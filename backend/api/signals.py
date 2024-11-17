from django.db.models.signals import post_save
from django.contrib.auth.models import User
from datetime import date
from decimal import Decimal
from django.dispatch import receiver
from .models import Profile, PortfolioHistory

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

        PortfolioHistory.objects.create(
            user=instance,
            date=date.today(),
            total_value=Decimal('10000.00')
        )

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()