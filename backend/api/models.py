from django.contrib.auth.models import User
from django.db import models
from decimal import Decimal
from django.core.validators import MinValueValidator

class Stock(models.Model):
    ticker = models.CharField(max_length=10, unique=True)
    company_name = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.ticker} - {self.company_name}"

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_email_verified = models.BooleanField(default=False)
    cash = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('10000.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Amount of money available to the user.",
    )

    def __str__(self):
        return f"{self.user.username}'s profile"