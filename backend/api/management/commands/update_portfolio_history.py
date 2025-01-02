# api/management/commands/update_portfolio_history.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Holding, PortfolioHistory, Stock
from django.utils import timezone
from datetime import timedelta
import yfinance as yf
from decimal import Decimal
import pandas as pd
from django.db import transaction
import logging

logger = logging.getLogger(__name__)

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

            first_portfolio = PortfolioHistory.objects.filter(user=user).order_by('date').first()
            start_date = first_portfolio.date if first_portfolio else today

            holdings = Holding.objects.filter(user=user).select_related('ticker')
            tickers = holdings.values_list('ticker__ticker', flat=True).distinct()

            if not tickers:
                self.stdout.write(f'No holdings found for user: {user.username}. Skipping.')
                continue

            # Fetch historical data for all tickers at once
            try:
                historical_data = yf.download(
                    tickers=list(tickers),
                    start=start_date - timedelta(days=365),  # Adjust range as needed
                    end=today + timedelta(days=1),
                    group_by='ticker',
                    auto_adjust=True
                )
            except Exception as e:
                logger.error(f'Error fetching data for user {user.username}: {e}')
                self.stdout.write(
                    self.style.ERROR(
                        f'Error fetching data for user {user.username}: {e}'
                    )
                )
                continue

            for current_date in pd.date_range(start=start_date, end=today):
                date = current_date.date()
                if date in existing_dates:
                    continue

                with transaction.atomic():
                    total_value = Decimal(user.profile.cash)
                    for holding in holdings:
                        ticker = holding.ticker.ticker
                        try:
                            price = historical_data[ticker].loc[date]['Close']
                        except KeyError:
                            # Find the last available price before the date
                            try:
                                price = historical_data[ticker].loc[:date]['Close'].iloc[-1]
                            except (KeyError, IndexError):
                                self.stdout.write(
                                    self.style.WARNING(
                                        f'No price found for {ticker} on or before {date}. Skipping holding.'
                                    )
                                )
                                continue

                        holding_total = Decimal(holding.shares_owned) * Decimal(price)
                        total_value += holding_total

                    # Create PortfolioHistory entry
                    PortfolioHistory.objects.create(
                        user=user,
                        date=date,
                        total_value=total_value
                    )

                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Updated portfolio for {user.username} on {date}'
                        )
                    )