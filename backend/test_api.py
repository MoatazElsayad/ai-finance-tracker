import httpx
import asyncio

async def test():
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    async with httpx.AsyncClient(verify=False, headers=headers) as client:
        try:
            resp = await client.get("https://data-asg.goldprice.org/dbXRates/EGP", timeout=15.0)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                if "items" in data and len(data["items"]) > 0:
                    item = data["items"][0]
                    ounce_to_gram = 31.1035
                    if "xauPrice" in item:
                        gold = round(item["xauPrice"] / ounce_to_gram, 2)
                        print(f"Gold (24K): {gold} EGP/g")
                    if "xagPrice" in item:
                        silver = round(item["xagPrice"] / ounce_to_gram, 2)
                        print(f"Silver (Pure): {silver} EGP/g")
                else:
                    print("No items in response")
            else:
                print(f"Error body: {resp.text[:500]}")
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(test())
