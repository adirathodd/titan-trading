from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import PortfolioHistory, Holding
from datetime import timedelta, date
import yfinance as yf

class Command(BaseCommand):
    help = 'Updates Portfolio History from the last recorded date until today'

    def handle(self, *args, **kwargs):
        today = date.today()

        # Fetch all users
        users = User.objects.all()
        for user in users:
            # Determine the starting date for updating:
            last_history = PortfolioHistory.objects.filter(user=user).order_by('-date').first()
            if last_history:
                start_date = last_history.date + timedelta(days=1)
                self.stdout.write(self.style.SUCCESS(
                    f"Updating {user.username}'s history starting from {start_date}"
                ))
            else:
                # If no history exists, default to user's join date
                start_date = user.date_joined.date()
                self.stdout.write(self.style.WARNING(
                    f"No existing history for {user.username}. Starting from date_joined: {start_date}"
                ))

            current_date = start_date
            prev_data = {}  # Store last known closing prices for fallback

            while current_date <= today:
                # Skip if an entry for the current date already exists
                if PortfolioHistory.objects.filter(user=user, date=current_date).exists():
                    self.stdout.write(self.style.WARNING(
                        f'PortfolioHistory for {user.username} on {current_date} already exists. Skipping.'
                    ))
                else:
                    total_value = float(user.profile.cash)  # Begin with cash balance

                    # Fetch user's holdings
                    holdings = Holding.objects.filter(user=user)
                    for holding in holdings:
                        try:
                            ticker_symbol = holding.ticker.ticker
                            ticker_obj = yf.Ticker(ticker_symbol)
                            # Get historical data for the current day
                            historical_data = ticker_obj.history(start=current_date, end=current_date + timedelta(days=1))

                            if not historical_data.empty:
                                closing_price = historical_data['Close'].iloc[0]
                            elif ticker_symbol in prev_data:
                                closing_price = prev_data[ticker_symbol]
                            else:
                                self.stderr.write(
                                    f"No closing price available for {ticker_symbol} on {current_date}."
                                )
                                continue

                            prev_data[ticker_symbol] = closing_price
                            total_value += float(holding.shares_owned) * float(closing_price)
                        except Exception as e:
                            self.stderr.write(f'Error fetching price for {holding.ticker}: {e}')
                            continue

                    # Create a new PortfolioHistory entry for the current date
                    PortfolioHistory.objects.create(
                        user=user,
                        date=current_date,
                        total_value=total_value
                    )
                    self.stdout.write(self.style.SUCCESS(
                        f'PortfolioHistory for {user.username} on {current_date} created.'
                    ))

                # Move to the next day
                current_date += timedelta(days=1)

        self.stdout.write(self.style.SUCCESS('PortfolioHistory updated successfully.'))