# your_app/management/commands/import_stocks.py

import csv
import os
from decimal import Decimal, InvalidOperation
from django.core.management.base import BaseCommand, CommandError
from api.models import Stock

class Command(BaseCommand):
    help = 'Imports stock tickers and company names from a CSV file.'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='The path to the CSV file containing stock data.')

    def handle(self, *args, **kwargs):
        csv_file_path = kwargs['csv_file']

        if not os.path.exists(csv_file_path):
            raise CommandError(f'File "{csv_file_path}" does not exist.')

        with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            count = 0
            for row in reader:
                ticker = row.get('ticker', '').strip().upper()
                company_name = row.get('name', '').strip()

                if not ticker or not company_name:
                    self.stdout.write(self.style.WARNING(f'Skipping incomplete row: {row}'))
                    continue

                try:
                    stock, created = Stock.objects.update_or_create(
                        ticker=ticker,
                        defaults={'company_name': company_name, 'current_price': 0}
                    )
                    if created:
                        count += 1
                        self.stdout.write(self.style.SUCCESS(f'Added new stock: {stock.ticker} - {stock.company_name}'))
                    else:
                        self.stdout.write(self.style.NOTICE(f'Updated stock: {ticker} - {company_name}'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error saving stock {ticker}: {e}'))

            self.stdout.write(self.style.SUCCESS(f'Import completed. {count} new stocks added.'))