
import sys
import os
import re
from typing import Optional

def _clean_amount_match(match: str) -> Optional[float]:
    """Helper to clean and convert regex amount match to float"""
    # Handle thousands separator (comma or dot)
    clean_match = match
    
    # Check for multiple separators
    dots = match.count('.')
    commas = match.count(',')
    
    if dots > 0 and commas > 0:
        # Mixed: 1,234.56 or 1.234,56
        if match.rfind(',') > match.rfind('.'):
            # 1.234,5 style
            clean_match = match.replace('.', '').replace(',', '.')
        else:
            # 1,234.56 style
            clean_match = match.replace(',', '')
    elif commas > 0:
        # Only commas: could be 1,234 or 12,34
        if commas == 1:
            comma_idx = match.rfind(',')
            digits_after = len(match) - comma_idx - 1
            if digits_after == 2:
                # 12,34 -> 12.34
                clean_match = match.replace(',', '.')
            elif digits_after == 3:
                # 1,234 -> 1234
                clean_match = match.replace(',', '')
            else:
                clean_match = match.replace(',', '')
        else:
            # Multiple commas: 1,234,567 -> 1234567
            clean_match = match.replace(',', '')
    
    # Ensure we only have one dot for float conversion
    if clean_match.count('.') > 1:
        # If multiple dots remain, take everything before the last dot as integer part
        last_dot_idx = clean_match.rfind('.')
        clean_match = clean_match[:last_dot_idx].replace('.', '') + clean_match[last_dot_idx:]
    
    try:
        val = float(clean_match)
        if 0.01 < val < 1000000: # Sanity check for realistic amounts
            return val
    except:
        pass
    return None

def extract_amount_from_text(text: str) -> Optional[float]:
    """
    Extract monetary amount from OCR text
    Looks for patterns like $10.99, 10.99, 10,99, EGP 10.99 etc.
    """
    # Pattern for currency amounts
    patterns = [
        r'(?:total|amount|net|due|egp|le|l\.e)[\s:]*[\$£€]?\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})', # Total: $1,234.56
        r'(?:total|amount|net|due|egp|le|l\.e)[\s:]*[\$£€]?\s*(\d+[.,]\d{2})',  # Total: $10.99
        r'[\$£€]\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})', # $1,234.56
        r'[\$£€]\s*(\d+[.,]\d{2})',  # $10.99
        r'(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*(?:usd|eur|gbp|cad|egp|le|l\.e)', # 1,234.56 USD
        r'(\d+[.,]\d{2})\s*(?:usd|eur|gbp|cad|egp|le|l\.e)',  # 10.99 USD
        r'(?:total|amount|net|due)[\s:]*[\$£€]?\s*(\d+(?:[.,]\d{3})*)\b',  # Total: 1,234 or 1000
        r'\b(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\b', # 1,234.56 (standalone)
        r'\b(\d{1,3}(?:[.,]\d{3})+)\b', # 1,234 or 1,234,567 (thousands only)
        r'\b(\d+[.,]\d{2})\b',  # Any number with 2 decimal places (fallback)
    ]
    
    text_lower = text.lower()
    
    found_amounts = []
    for pattern in patterns:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        if matches:
            for match in matches:
                val = _clean_amount_match(match)
                if val is not None:
                    found_amounts.append(val)
    
    if found_amounts:
        # Priority 1: Patterns with keywords or symbols (indices 0-6)
        priority_amounts = []
        for p_idx in range(7):
             m = re.findall(patterns[p_idx], text_lower, re.IGNORECASE)
             for match in m:
                  val = _clean_amount_match(match)
                  if val is not None:
                      priority_amounts.append(val)
        
        if priority_amounts:
            return max(priority_amounts)
            
        # Priority 2: Standalone numbers with thousands AND decimals (index 7)
        m7 = re.findall(patterns[7], text_lower, re.IGNORECASE)
        for match in m7:
            val = _clean_amount_match(match)
            if val is not None:
                return val # Return the first (and likely only) complex standalone number

        return max(found_amounts)
    
    return None

def extract_merchant_from_text(text: str) -> str:
    """
    Extract merchant name from OCR text
    """
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    # Common words to skip in merchant name
    skip_keywords = ['receipt', 'invoice', 'order', 'date', 'time', 'total', 'welcome', 'thank you', 'tax', 'cashier', 'tel', 'phone', 'address', 'customer', 'terminal', 'auth', 'copy', 'merchant id', 'st.', 'street', 'road', 'ave']
    
    # Common merchants to prioritize
    common_merchants = ['starbucks', 'mcdonald', 'walmart', 'amazon', 'uber', 'careem', 'shell', 'total', 'kfc', 'pizza hut', 'carrefour', 'metro', 'spinneys', 'jumia', 'noon', '7-eleven']

    # First, check if any of the first 8 lines contains a common merchant
    for line in lines[:8]:
        line_clean = line.strip().lower()
        for merchant in common_merchants:
            if merchant in line_clean:
                return line.strip()

    # Second pass: use heuristics
    for line in lines[:8]:
        line_clean = line.strip()
        # Skip if line is too long or too short
        if len(line_clean) < 3 or len(line_clean) > 50:
            continue
            
        # Skip if it's just an address (common pattern: digit + word + st/rd/ave or city/state)
        address_patterns = [
            r'\d+\s+\w+\s+(?:st|street|rd|road|ave|avenue|blvd|boulevard)',
            r'^[A-Z][a-z]+,?\s+[A-Z]{2}$', # City, ST
            r'^[A-Z][a-z]+$', # Single word city
        ]
        if any(re.search(p, line_clean, re.IGNORECASE) for p in address_patterns):
            continue
            
        # Skip if it contains common non-merchant keywords
        if any(skip in line_clean.lower() for skip in skip_keywords):
            continue
            
        # Skip if it's just a date or time
        if re.search(r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}', line_clean) or re.search(r'\d{1,2}:\d{2}', line_clean):
            continue
            
        # If it has letters, it's likely a name
        if any(c.isalpha() for c in line_clean):
            return line_clean
    
    # Fallback: search for common merchants in text
    for merchant in common_merchants:
        if merchant in text.lower():
            return merchant.capitalize()
            
    return "Unknown Merchant"

def test_extract_amount():
    print("Testing amount extraction...")
    test_cases = [
        ("TOTAL: $10.99", 10.99),
        ("Amount: 25.50 EGP", 25.5),
        ("Net amount due: LE 150.00", 150.0),
        ("Total 500", 500.0),
        ("Date: 2023.01.01 Amount: 45.00", 45.0),
        ("Price is 1,234.56", 1234.56),
        ("Mixed separators 1.234,56", 1234.56),
        ("Only commas 1,234", 1234.0),
        ("Comma as decimal 12,34", 12.34),
        ("Multiple dots 1.2.3", None),
        ("Too small 0.005", None),
        ("Too large 2000000", None),
    ]
    
    for text, expected in test_cases:
        result = extract_amount_from_text(text)
        print(f"Text: '{text}' -> Extracted: {result} (Expected: {expected})")
        if result != expected:
            if expected is None and result is not None:
                print(f"  FAILED: expected None but got {result}")
            elif expected is not None and (result is None or abs(result - expected) > 0.001):
                print(f"  FAILED: expected {expected} but got {result}")

def test_extract_merchant():
    print("\nTesting merchant extraction...")
    test_cases = [
        ("7-Eleven\nReceipt #123\nDate: 2023-01-01", "7-Eleven"),
        ("WELCOME TO\nSTARBUCKS COFFEE\nTotal: $5.00", "STARBUCKS COFFEE"),
        ("Invoice 456\nAmazon.com\nSeattle, WA", "Amazon.com"),
        ("Cashier: John\nMcDonald's\nThank you", "McDonald's"),
        ("123 Main St\nAnytown\nWalmart\nTotal: 10.00", "Walmart"),
    ]
    
    for text, expected in test_cases:
        result = extract_merchant_from_text(text)
        print(f"Text snippet: '{text.splitlines()[0]}...' -> Extracted: '{result}' (Expected: '{expected}')")
        if expected.lower() not in result.lower() and result.lower() not in expected.lower():
             print(f"  FAILED: expected '{expected}' but got '{result}'")

if __name__ == "__main__":
    test_extract_amount()
    test_extract_merchant()
