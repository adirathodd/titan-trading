from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Holding, PortfolioHistory
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Updates PortfolioHistory for all users'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        users = User.objects.all()

        for user in users:
            # Check if today's portfolio history already exists
            if not PortfolioHistory.objects.filter(user=user, date=today).exists():
                total_value = float(user.profile.cash)
                holdings = Holding.objects.filter(user=user)
                for holding in holdings:
                    current_price = holding.current_price()
                    holding_total = float(holding.shares_owned) * current_price
                    total_value += holding_total

                # Create PortfolioHistory entry
                PortfolioHistory.objects.create(
                    user=user,
                    date=today,
                    total_value=total_value
                )
                self.stdout.write(self.style.SUCCESS(f'Updated portfolio for {user.username} on {today}'))
            else:
                self.stdout.write(f'Portfolio for {user.username} on {today} already exists.')