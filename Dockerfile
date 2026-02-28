# Root Dockerfile - Single container with both frontend and backend
# Build stage for frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Copy frontend package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build React app
RUN npm run build

# Final stage - Python backend with built frontend
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend files
COPY backend/pyproject.toml backend/MANIFEST.in ./
COPY backend/*.py ./

# Install Python dependencies
RUN pip install --no-cache-dir flask flask-cors requests gunicorn

# Copy built frontend from builder stage
COPY --from=frontend-builder /frontend/dist ./frontend/dist

# Create templates directory
RUN mkdir -p templates

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=7171

# Expose port
EXPOSE 7171

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:7171/api/health || exit 1

# Run with Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:7171", "--workers", "4", "--timeout", "120", "app:create_app()"]
