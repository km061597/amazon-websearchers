"""
Mock scraper stub for demo mode.
Real scraping functionality archived - this provides minimal interface for API compatibility.
"""

class MockAmazonScraper:
    """Stub scraper that returns empty results (demo uses pre-loaded DB data)"""

    def search(self, query: str, pages: int = 1) -> list:
        """Return empty list - demo relies on init_data sample products"""
        return []

    def get_product(self, asin: str) -> dict | None:
        """Return None - demo relies on init_data sample products"""
        return None
