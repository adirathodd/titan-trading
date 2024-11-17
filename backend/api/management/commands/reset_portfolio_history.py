# your_app/management/commands/reset_portfolio_history.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import PortfolioHistory, Holding
from datetime import timedelta, date

class Command(BaseCommand):
    help = 'Resets all PortfolioHistory and initializes with a starting valuation of $10,000'

    def handle(self, *args, **kwargs):
        today = date.today()
        initial_total_value = 10000

        PortfolioHistory.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('All PortfolioHistory entries have been deleted.'))

        users = User.objects.all()
        for user in users:
            start_date = user.date_joined.date()
            current_date = start_date

            while current_date <= today:
                if not PortfolioHistory.objects.filter(user=user, date=current_date).exists():
                    if current_date == start_date:
                        total_value = initial_total_value
                    else:
                        previous_date = current_date - timedelta(days=1)
                        total_value = float(user.profile.cash)

                        holdings = Holding.objects.filter(user=user)
                        for holding in holdings:
                            try:
                                current_price = holding.current_price()
                                total_value += (float(holding.shares_owned) * float(current_price))
                            except Exception as e:
                                self.stderr.write(f'Error fetching price for {holding.ticker}: {e}')
                                total_value += 0

                    PortfolioHistory.objects.create(
                        user=user,
                        date=current_date,
                        total_value=total_value
                    )
                    self.stdout.write(self.style.SUCCESS(f'PortfolioHistory for {user.username} on {current_date} created.'))
                
                current_date += timedelta(days=1)

        self.stdout.write(self.style.SUCCESS('PortfolioHistory reset and updated successfully.'))