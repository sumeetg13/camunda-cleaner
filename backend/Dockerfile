# Multi-stage Dockerfile - Builds frontend and backend in one image
FROM node:20-alpine AS frontend-builder

# Set working directory for frontend build
WORKDIR /frontend

# Copy frontend package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build the React app
RUN npm run build

# Backend stage
FROM python:3.13-slim

# Set working directory
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

# Copy frontend build from previous stage
COPY --from=frontend-builder /frontend/dist ./frontend/dist

# Create templates directory if needed
RUN mkdir -p templates

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=7171

# Expose port
EXPOSE 7171

# Run with Gunicorn for production
CMD ["gunicorn", "--bind", "0.0.0.0:7171", "--workers", "4", "--timeout", "120", "app:create_app()"]
