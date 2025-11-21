"""
Initialize database with sample data from JSON file
"""
import json
import os
from decimal import Decimal
from datetime import datetime, timedelta
import random

from .database import SessionLocal
from .models import Product, CategoryStats, PriceHistory


def load_products_from_json():
    """Load products from demo_data/products.json"""
    json_path = os.path.join(os.path.dirname(__file__), 'demo_data', 'products.json')

    if not os.path.exists(json_path):
        print(f"Warning: {json_path} not found, using empty product list")
        return []

    with open(json_path, 'r') as f:
        data = json.load(f)

    return data.get('products', [])


def generate_price_history(product_id: int, asin: str, current_price: float, list_price: float) -> list:
    """Generate 90 days of price history for a product"""
    history = []
    today = datetime.now()

    for i in range(90, 0, -1):
        date = today - timedelta(days=i)

        # Simulate realistic price fluctuation
        base_price = current_price + (list_price - current_price) * 0.3
        variance = random.uniform(-0.15, 0.15)
        price = base_price * (1 + variance)
        price = max(current_price * 0.85, min(list_price, price))

        history.append(PriceHistory(
            product_id=product_id,
            asin=asin,
            price=Decimal(str(round(price, 2))),
            recorded_at=date,
            is_prime=True,
            is_sponsored=False,
            in_stock=True
        ))

    # Ensure current price is most recent
    history.append(PriceHistory(
        product_id=product_id,
        asin=asin,
        price=Decimal(str(current_price)),
        recorded_at=today,
        is_prime=True,
        is_sponsored=False,
        in_stock=True
    ))

    return history


def init_sample_data():
    """
    Insert sample products from JSON file
    """
    db = SessionLocal()

    try:
        # Check if data already exists
        existing = db.query(Product).first()
        if existing:
            print("Sample data already exists, skipping initialization")
            return

        # Load products from JSON
        products_data = load_products_from_json()

        if not products_data:
            print("No products found in JSON file")
            return

        category_counts = {}
        category_prices = {}
        category_unit_prices = {}
        category_ratings = {}

        for product_data in products_data:
            product = Product(
                asin=product_data['asin'],
                title=product_data['title'],
                brand=product_data['brand'],
                category=product_data['category'],
                current_price=Decimal(str(product_data['current_price'])),
                list_price=Decimal(str(product_data['list_price'])),
                unit_price=Decimal(str(product_data['unit_price'])),
                unit_type=product_data['unit_type'],
                quantity=Decimal(str(product_data.get('quantity', 1))),
                discount_pct=Decimal(str(product_data['discount_pct'])),
                rating=Decimal(str(product_data['rating'])),
                review_count=product_data['review_count'],
                verified_review_count=int(product_data['review_count'] * 0.8),
                image_url=product_data['image_url'],
                amazon_url=f"https://amazon.com/dp/{product_data['asin']}",
                is_prime=product_data.get('is_prime', True),
                is_sponsored=product_data.get('is_sponsored', False),
                subscribe_save_pct=Decimal('10.0'),
                in_stock=product_data.get('in_stock', True),
                hidden_gem_score=product_data.get('hidden_gem_score', 75),
                deal_quality_score=product_data.get('deal_quality_score', 75)
            )
            db.add(product)
            db.flush()  # Get the product ID

            # Generate price history
            price_history = generate_price_history(
                product.id,
                product.asin,
                float(product_data['current_price']),
                float(product_data['list_price'])
            )
            for ph in price_history:
                db.add(ph)

            # Track category stats
            cat = product_data['category']
            if cat not in category_counts:
                category_counts[cat] = 0
                category_prices[cat] = []
                category_unit_prices[cat] = []
                category_ratings[cat] = []

            category_counts[cat] += 1
            category_prices[cat].append(product_data['current_price'])
            category_unit_prices[cat].append(product_data['unit_price'])
            category_ratings[cat].append(product_data['rating'])

        # Calculate and add category stats
        for cat in category_counts:
            prices = sorted(category_prices[cat])
            unit_prices = sorted(category_unit_prices[cat])
            ratings = category_ratings[cat]

            median_price = prices[len(prices) // 2]
            median_unit_price = unit_prices[len(unit_prices) // 2]
            avg_rating = sum(ratings) / len(ratings)

            stats = CategoryStats(
                category=cat,
                median_price=Decimal(str(round(median_price, 2))),
                median_unit_price=Decimal(str(round(median_unit_price, 4))),
                avg_rating=Decimal(str(round(avg_rating, 2))),
                product_count=category_counts[cat]
            )
            db.add(stats)

        db.commit()
        print(f"Loaded {len(products_data)} products with price history from JSON")
        print(f"Categories: {', '.join(category_counts.keys())}")

    except Exception as e:
        print(f"Error initializing sample data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_sample_data()
