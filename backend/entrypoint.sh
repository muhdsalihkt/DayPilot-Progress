#!/bin/sh
set -e

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear || true

echo "Starting Gunicorn server..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3

