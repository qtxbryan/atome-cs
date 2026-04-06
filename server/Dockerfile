FROM python:3.11-slim AS builder

WORKDIR /install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --target=/install/packages

FROM python:3.11-slim

WORKDIR /app
COPY --from=builder /install/packages /usr/local/lib/python3.11/site-packages
COPY . .

RUN mkdir -p /app/data

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
