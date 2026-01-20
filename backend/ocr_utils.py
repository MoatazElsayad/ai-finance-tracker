"""
OCR and Receipt Parsing Utilities
Extracts text from receipt images and categorizes transactions
"""
import re
from datetime import datetime
from typing import Dict, List, Optional, Any
import base64
import httpx
import asyncio
import os

# Try to use Google Generative AI (vision)
try:
    import google.generativeai as genai
    HAS_GOOGLE_AI = True
except ImportError:
    HAS_GOOGLE_AI = False

# Try to use EasyOCR, fallback to pytesseract or online API
try:
    import easyocr  # type: ignore
    HAS_EASYOCR = True
except (ImportError, OSError):
    HAS_EASYOCR = False

try:
    import pytesseract  # type: ignore
    HAS_PYTESSERACT = True
except ImportError:
    HAS_PYTESSERACT = False

try:
    from PIL import Image  # type: ignore
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

# Initialize reader (loads model on first use)
reader = None

def get_ocr_reader():
    """Lazy load EasyOCR reader to avoid loading on every request"""
    global reader
    if reader is None and HAS_EASYOCR:
        try:
            reader = easyocr.Reader(['en'], gpu=False)
        except Exception as e:
            print(f"Failed to load EasyOCR: {e}")
            return None
    return reader

def extract_text_with_easyocr(image_path: str) -> str:
    """Extract text using EasyOCR"""
    try:
        ocr_reader = get_ocr_reader()
        if ocr_reader is None:
            raise Exception("EasyOCR reader not available")
        
        results = ocr_reader.readtext(image_path)
        extracted_text = '\n'.join([text[1] for text in results])
        return extracted_text
    except Exception as e:
        raise Exception(f"EasyOCR Error: {str(e)}")

def extract_text_with_pytesseract(image_path: str) -> str:
    """Extract text using pytesseract (requires Tesseract binary)"""
    if not HAS_PYTESSERACT:
        raise Exception("pytesseract not installed")
    
    try:
        # Set Tesseract path if on Windows
        import os
        if os.name == 'nt':  # Windows
            # correct attribute name for pytesseract executable path
            pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        
        text = pytesseract.image_to_string(image_path)
        return text
    except Exception as e:
        raise Exception(f"Pytesseract Error: {str(e)}")

def extract_text_with_online_ocr(image_path: str) -> str:
    """
    Fallback: Extract text using a free online OCR API (synchronous)
    Uses ocr.space API which is free and doesn't require authentication
    This is synchronous to avoid "event loop is already running" errors
    when running under an async server.
    """
    try:
        with open(image_path, 'rb') as f:
            image_data = f.read()

        response = httpx.post(
            'https://api.ocr.space/parse/image',
            files={'filename': ('receipt.png', image_data)},
            data={'apikey': 'K84320779988957', 'language': 'eng'},
            timeout=30.0,
        )
        
        response.raise_for_status()

        # Parse JSON response safely
        try:
            result = response.json()
        except Exception as json_err:
            # If JSON parsing fails, log the raw response for debugging
            print(f"Failed to parse JSON response: {json_err}")
            print(f"Response text: {response.text[:500]}")
            raise Exception(f"Invalid JSON response from OCR API: {str(json_err)}")
        
        # Ensure result is a dict
        if not isinstance(result, dict):
            print(f"Unexpected response type: {type(result)}, value: {result}")
            raise Exception(f"OCR API returned non-dict response: {type(result)}")
        
        if result.get('IsErroredOnProcessing'):
            err = result.get('ErrorMessage') or result.get('ErrorDetails') or 'Online OCR failed'
            raise Exception(err)

        parsed_results = result.get('ParsedResults')
        if parsed_results and isinstance(parsed_results, list) and len(parsed_results) > 0:
            return parsed_results[0].get('ParsedText', '')
        return result.get('ParsedText', '') or ''
    except Exception as e:
        raise Exception(f"Online OCR Error: {str(e)}")

def extract_text_from_image(image_path: str) -> str:
    """
    Extract text from an image file using available OCR methods
    Tries EasyOCR first, then pytesseract, then online OCR as fallback
    
    Args:
        image_path: Path to image file
        
    Returns:
        Extracted text from the image
    """
    # Try EasyOCR first (most reliable)
    if HAS_EASYOCR:
        try:
            return extract_text_with_easyocr(image_path)
        except Exception as e:
            print(f"EasyOCR failed: {e}, trying pytesseract...")
    
    # Try pytesseract next
    if HAS_PYTESSERACT:
        try:
            return extract_text_with_pytesseract(image_path)
        except Exception as e:
            print(f"Pytesseract failed: {e}, trying online OCR...")
    
    # Fall back to online OCR (synchronous)
    try:
        return extract_text_with_online_ocr(image_path)
    except Exception as e:
        raise Exception(f"All OCR methods failed: {str(e)}")

def extract_amount_from_text(text: str) -> Optional[float]:
    """
    Extract monetary amount from OCR text
    Looks for patterns like $10.99, 10.99, 10,99, etc.
    """
    # Pattern for currency amounts: $10.99 or 10.99 or 10,99
    patterns = [
        r'\$\s*(\d+[.,]\d{2})',  # $10.99
        r'(?:total|amount|total\s*amount|price|due)[\s:]*\$?(\d+[.,]\d{2})',  # Total: $10.99
        r'(\d+[.,]\d{2})\s*(?:usd|eur|gbp|cad)',  # 10.99 USD
    ]
    
    text_lower = text.lower()
    
    for pattern in patterns:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        if matches:
            # Take the largest amount found (likely the total)
            amounts = []
            for match in matches:
                amount_str = match.replace(',', '.')
                try:
                    amounts.append(float(amount_str))
                except:
                    continue
            if amounts:
                return max(amounts)  # Return largest amount
    
    return None

def extract_merchant_from_text(text: str) -> Optional[str]:
    """
    Extract merchant/business name from OCR text
    Usually appears at the top of the receipt
    """
    lines = text.split('\n')
    
    # First few non-empty lines are likely merchant name
    for line in lines[:10]:
        line = line.strip()
        if len(line) > 3 and not any(c.isdigit() for c in line):  # Avoid lines with numbers
            # Skip common receipt headers
            if not any(skip in line.lower() for skip in ['receipt', 'invoice', 'order', 'date', 'time', 'total']):
                if len(line) < 50:  # Reasonable length for business name
                    return line
    
    return "Unnamed Merchant"

def extract_date_from_text(text: str) -> Optional[str]:
    """
    Extract date from OCR text
    Looks for common date patterns
    """
    # Common date patterns
    patterns = [
        r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',  # MM/DD/YYYY or DD/MM/YYYY
        r'(?:date|dated)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',  # Date: MM/DD/YYYY
        r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})',  # YYYY/MM/DD
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            date_str = match.group(1)
            # Try to parse and standardize to YYYY-MM-DD
            try:
                # Try different formats
                for fmt in ['%m/%d/%Y', '%d/%m/%Y', '%m-%d-%Y', '%d-%m-%Y', '%Y-%m-%d', '%Y/%m/%d']:
                    try:
                        date_obj = datetime.strptime(date_str, fmt)
                        return date_obj.strftime('%Y-%m-%d')
                    except:
                        continue
            except:
                pass
    
    # Default to today if no date found
    return datetime.now().strftime('%Y-%m-%d')

def categorize_transaction(
    text: str, 
    merchant: str,
    amount: float,
    categories: List[Dict] = None
) -> Dict[str, any]:
    """
    Categorize a transaction based on merchant name, text, and amount
    Uses rule-based matching + optional LLM categorization
    
    Args:
        text: OCR extracted text
        merchant: Merchant name
        amount: Transaction amount
        categories: List of available categories
        
    Returns:
        Dict with category_id, confidence score, and reasoning
    """
    
    # Default categories if none provided
    if not categories:
        categories = [
            {"id": 1, "name": "Food & Dining", "type": "expense", "keywords": ["restaurant", "cafe", "pizza", "burger", "food", "lunch", "dinner", "breakfast", "coffee", "bar", "diner"]},
            {"id": 2, "name": "Transportation", "type": "expense", "keywords": ["uber", "lyft", "taxi", "gas", "fuel", "parking", "transit", "metro", "bus", "train", "airline"]},
            {"id": 3, "name": "Shopping", "type": "expense", "keywords": ["store", "shop", "mall", "amazon", "target", "walmart", "clothes", "apparel", "retail"]},
            {"id": 4, "name": "Bills", "type": "expense", "keywords": ["utility", "electric", "water", "internet", "phone", "rent", "mortgage", "insurance", "subscription"]},
            {"id": 5, "name": "Other Expense", "type": "expense", "keywords": []},
            {"id": 6, "name": "Salary", "type": "income", "keywords": ["salary", "wage", "paycheck", "deposit"]},
            {"id": 7, "name": "Freelance", "type": "income", "keywords": ["freelance", "invoice", "payment", "transferred"]},
            {"id": 8, "name": "Other Income", "type": "income", "keywords": []},
        ]
    
    text_lower = (text + " " + merchant).lower()
    
    # Score each category
    scores = {}
    for category in categories:
        score = 0
        for keyword in category.get("keywords", []):
            if keyword in text_lower:
                score += 1
        scores[category["id"]] = score
    
    # Get best match
    best_category_id = max(scores, key=scores.get) if scores else 5  # Default to "Other Expense"
    best_score = scores.get(best_category_id, 0)
    
    # Calculate confidence (max 5 keywords, so confidence is score / 5)
    confidence = min(100, (best_score / 5) * 100) if best_score > 0 else 10
    
    return {
        "category_id": best_category_id,
        "confidence": confidence,
        "reasoning": f"Matched {best_score} keywords for category"
    }

def parse_receipt(
    image_path: str,
    available_categories: List[Dict] = None
) -> Dict[str, any]:
    """
    Complete receipt parsing pipeline
    Extracts text, merchant, amount, date, and suggests category
    
    Args:
        image_path: Path to receipt image
        available_categories: List of available categories from database
        
    Returns:
        Dict with extracted data and suggestions
    """
    try:
        # Extract text from image
        extracted_text = extract_text_from_image(image_path)
        
        # Parse components
        merchant = extract_merchant_from_text(extracted_text)
        amount = extract_amount_from_text(extracted_text)
        date = extract_date_from_text(extracted_text)
        categorization = categorize_transaction(extracted_text, merchant, amount or 0, available_categories)
        
        return {
            "success": True,
            "extracted_text": extracted_text,
            "merchant": merchant,
            "amount": amount,
            "date": date,
            "category_id": categorization["category_id"],
            "confidence": categorization["confidence"],
            "reasoning": categorization["reasoning"]
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
