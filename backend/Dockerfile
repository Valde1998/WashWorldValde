FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5001

CMD ["sh", "-c", "python -c 'from app import prepare_application; prepare_application()' && exec gunicorn --bind 0.0.0.0:${PORT:-5001} --workers 1 --threads 4 app:app"]
