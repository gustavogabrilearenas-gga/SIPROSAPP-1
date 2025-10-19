# ============================================
# Dockerfile para SIPROSA MES - Desarrollo Local
# ============================================

FROM python:3.10.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
        gcc \
    && rm -rf /var/lib/apt/lists/* \
    && which pg_isready

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Copy and set permissions for entrypoint (ruta relativa al contexto: la raíz del repo)
COPY backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create non-root user
RUN useradd --create-home --shell /bin/bash django \
    && chown -R django:django /app \
    && chown django:django /entrypoint.sh
USER django

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python manage.py check --deploy || exit 1

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Run the application in development mode
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

