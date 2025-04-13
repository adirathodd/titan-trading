from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator

class Stock(models.Model):
    ticker = models.CharField(max_length=10, unique=True)
    company_name = models.CharField(max_length=255)
    current_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Current price of the stock."
    )

    def update_current_price(self):
        import yfinance as yf
        ticker_data = yf.Ticker(self.ticker)
        latest_price = ticker_data.info.get('currentPrice') or ticker_data.info.get('ask') or ticker_data.info.get('regularMarketPreviousClose')
        if latest_price is not None:
            self.current_price = Decimal(str(latest_price))
            self.save()
        else:
            raise ValueError(f"Could not fetch latest price for ticker {self.ticker}")

    def __str__(self):
        return f"{self.ticker} - {self.company_name}"

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_email_verified = models.BooleanField(default=False)
    cash = models.DecimalField(
        decimal_places=2, 
        default=Decimal('10000.00'), 
        help_text='Amount of money available to the user.', 
        max_digits=12, 
        validators=[MinValueValidator(Decimal('0.00'))]
        )

    def __str__(self):
        return f"{self.user.username}'s profile"

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('BUY', 'Buy'),
        ('SELL', 'Sell'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=4, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        validators=[MinValueValidator(Decimal('0.0001'))],
        help_text="Number of shares bought or sold."
    )
    price_per_share = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Price per share at the time of transaction."
    )
    total_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Total amount for the transaction (quantity * price_per_share)."
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.total_amount = self.quantity * self.price_per_share
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.transaction_type} {self.quantity} shares of {self.stock.ticker} by {self.user.username} on {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"

class Holding(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='holdings')
    ticker = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='holdings')
    company_name = models.CharField(max_length=100)
    shares_owned = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        default=Decimal(0.0000),
        validators=[MinValueValidator(Decimal('0.0000'))],
        help_text="Number of shares owned."
    )
    average_price = models.DecimalField(max_digits=20, decimal_places=2)

    @property
    def current_price(self):
        try:
            info = self.ticker_data.info
            latest_price = (info.get('currentPrice') or 
                            info.get('ask') or 
                            info.get('regularMarketPreviousClose'))
        except Exception as e:
            print(f"Error fetching ticker info for {self.ticker_symbol}: {e}")
            latest_price = None
        return latest_price

    def total_value(self):
        return float(self.shares_owned) * self.current_price()

    class Meta:
        unique_together = ('user', 'ticker')

    def __str__(self):
        return f"{self.user.username} owns {self.shares_owned} shares of {self.stock.ticker}"

class PortfolioHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='portfolio_history')
    date = models.DateField()
    total_value = models.DecimalField(max_digits=20, decimal_places=2)

    class Meta:
        ordering = ['date']
        unique_together = ('user', 'date')