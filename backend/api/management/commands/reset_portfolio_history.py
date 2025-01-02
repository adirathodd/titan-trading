from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import PortfolioHistory, Holding
from datetime import timedelta, date
import yfinance as yf

class Command(BaseCommand):
    help = 'Resets all Portfolio History and initializes with a starting valuation of $10,000'

    def handle(self, *args, **kwargs):
        today = date.today()
        initial_total_value = 10000

        # Clear all existing PortfolioHistory
        PortfolioHistory.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('All PortfolioHistory entries have been deleted.'))

        # Fetch all users
        users = User.objects.all()
        for user in users:
            start_date = user.date_joined.date()
            current_date = start_date

            prev_data = {}

            while current_date <= today:
                # Skip if an entry for the current date already exists
                if not PortfolioHistory.objects.filter(user=user, date=current_date).exists():
                    if current_date == start_date:
                        total_value = initial_total_value
                    else:
                        previous_date = current_date - timedelta(days=1)
                        total_value = float(user.profile.cash)  # Start with cash balance

                        # Fetch holdings for the user
                        holdings = Holding.objects.filter(user=user)
                        for holding in holdings:
                            try:
                                # Fetch historical closing price for the specific date using yfinance
                                ticker = holding.ticker.ticker
                                ticker_data = yf.Ticker(ticker)
                                historical_data = ticker_data.history(start=current_date, end=current_date + timedelta(days=1))

                                if not historical_data.empty:
                                    closing_price = historical_data['Close'].iloc[0]
                                elif ticker in prev_data:
                                    closing_price = prev_data[ticker]
                                else:
                                    self.stderr.write(
                                        f"No closing price available for {holding.ticker} on {current_date}."
                                    )
                                    continue
                                    
                                prev_data[holding.ticker.ticker] = closing_price
                                total_value += float(holding.shares_owned) * float(closing_price)
                            except Exception as e:
                                self.stderr.write(f'Error fetching price for {holding.ticker}: {e}')
                                total_value += 0

                    # Create PortfolioHistory for the current date
                    PortfolioHistory.objects.create(
                        user=user,
                        date=current_date,
                        total_value=total_value
                    )

                    self.stdout.write(self.style.SUCCESS(
                        f'PortfolioHistory for {user.username} on {current_date} created.'
                    ))

                # Move to the next date
                current_date += timedelta(days=1)

        self.stdout.write(self.style.SUCCESS('PortfolioHistory reset and updated successfully.'))