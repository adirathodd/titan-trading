from django.contrib.auth.models import User
from django.db import models

class Stock(models.Model):
    ticker = models.CharField(max_length=10, unique=True)
    company_name = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.ticker} - {self.company_name}"

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_email_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username}'s profile"