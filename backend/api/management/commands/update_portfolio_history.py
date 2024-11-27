# api/management/commands/update_portfolio_history.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Holding, PortfolioHistory, Stock
from django.utils import timezone
from datetime import timedelta, datetime
import yfinance as yf
from decimal import Decimal

class Command(BaseCommand):
    help = 'Updates PortfolioHistory for all users for all missing dates'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        users = User.objects.all()

        for user in users:
            self.stdout.write(f'Processing user: {user.username}')

            existing_dates = set(
                PortfolioHistory.objects.filter(user=user).values_list('date', flat=True)
            )

            prev_data = {}

            first_portfolio = PortfolioHistory.objects.filter(user=user).order_by('date').first()
            start_date = first_portfolio.date if first_portfolio else timezone.now().date()
            start_date = start_date

            current_date = start_date
            while current_date <= today:
                if current_date not in existing_dates:
                    total_value = Decimal(user.profile.cash)
                    holdings = Holding.objects.filter(user=user)

                    for holding in holdings:
                        ticker = holding.ticker.ticker
                        price = self.get_stock_price(ticker, current_date)
                        if price is None:
                            if ticker in prev_data:
                                price = prev_data[ticker]
                            else:
                                self.stdout.write(
                                    self.style.WARNING(
                                        f'No price found for {ticker} on {current_date}. Skipping holding.'
                                    )
                                )
                                continue

                        holding_total = Decimal(holding.shares_owned) * Decimal(price)
                        total_value += holding_total

                    # Create PortfolioHistory entry
                    PortfolioHistory.objects.create(
                        user=user,
                        date=current_date,
                        total_value=total_value
                    )

                    prev_data[ticker] = price

                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Updated portfolio for {user.username} on {current_date}'
                        )
                    )
                current_date += timedelta(days=1)

    def get_stock_price(self, ticker, target_date):
        """
        Retrieves the stock price for the given ticker on the target_date.
        If not available, fetches the most recent previous price.
        """
        ticker_data = yf.Ticker(ticker)

        historical_data = ticker_data.history(start=target_date, end=target_date + timedelta(days=1))

        if historical_data.empty:
            return None
        
        return historical_data['Close'][0]