from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import PortfolioHistory, Holding
from datetime import timedelta, date
import yfinance as yf

class Command(BaseCommand):
    help = "Adds yesterday's portfolio history entry for each user based on their previous day valuation."

    def handle(self, *args, **kwargs):
        # Calculate yesterday's date
        yesterday = date.today() - timedelta(days=1)
        
        # For each user, add the valuation for yesterday if it doesn't already exist.
        for user in User.objects.all():
            if PortfolioHistory.objects.filter(user=user, date=yesterday).exists():
                self.stdout.write(self.style.WARNING(
                    f"PortfolioHistory for {user.username} on {yesterday} already exists. Skipping."
                ))
                continue

            total_value = float(user.profile.cash)  # Start with cash balance
            prev_data = {}  # To store last known closing prices

            # Fetch holdings for the user
            holdings = Holding.objects.filter(user=user)
            for holding in holdings:
                try:
                    ticker_symbol = holding.ticker.ticker
                    ticker_data = yf.Ticker(ticker_symbol)
                    # Get historical closing price for yesterday
                    historical_data = ticker_data.history(start=yesterday, end=yesterday + timedelta(days=1))
                    
                    if not historical_data.empty:
                        closing_price = historical_data['Close'].iloc[0]
                    elif ticker_symbol in prev_data:
                        closing_price = prev_data[ticker_symbol]
                    else:
                        self.stderr.write(
                            f"No closing price available for {ticker_symbol} on {yesterday}."
                        )
                        continue

                    prev_data[ticker_symbol] = closing_price
                    total_value += float(holding.shares_owned) * float(closing_price)
                except Exception as e:
                    self.stderr.write(f"Error fetching price for {ticker_symbol}: {e}")
                    continue

            # Create a new PortfolioHistory entry for yesterday
            PortfolioHistory.objects.create(
                user=user,
                date=yesterday,
                total_value=total_value
            )
            self.stdout.write(self.style.SUCCESS(
                f"PortfolioHistory for {user.username} on {yesterday} created."
            ))

        self.stdout.write(self.style.SUCCESS("Yesterday's PortfolioHistory added successfully."))