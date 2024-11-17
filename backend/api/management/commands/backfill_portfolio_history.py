from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Holding, PortfolioHistory
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Backfill PortfolioHistory for all users'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        users = User.objects.all()

        for user in users:
            first_history = PortfolioHistory.objects.filter(user=user).order_by('date').first()
            start_date = first_history.date if first_history else today

            current_date = start_date
            while current_date <= today:
                if not PortfolioHistory.objects.filter(user=user, date=current_date).exists():
                    total_value = float(user.profile.cash)
                    holdings = Holding.objects.filter(user=user)
                    for holding in holdings:
                        current_price = holding.current_price()
                        holding_total = float(holding.shares_owned) * current_price
                        total_value += holding_total

                    PortfolioHistory.objects.create(
                        user=user,
                        date=current_date,
                        total_value=total_value
                    )
                    self.stdout.write(self.style.SUCCESS(f'Backfilled portfolio for {user.username} on {current_date}'))
                current_date += timedelta(days=1)