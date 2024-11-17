python manage.py flush --noinput
python manage.py migrate
python manage.py import_stocks tickers.csv
python manage.py import_stocks tickers1.csv
