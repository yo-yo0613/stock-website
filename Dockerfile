# Stage 1: Build frontend with Node.js
FROM node:20 AS builder

WORKDIR /app

# Copy frontend files
COPY package.json package-lock.json tsconfig*.json vite.config.ts postcss.config.js tailwind.config.js ./
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Install dependencies and build
RUN npm install --legacy-peer-deps && npm run build

# Stage 2: Runtime with PHP and Apache
FROM php:8.2-apache

# Install system dependencies and PostgreSQL driver
RUN apt-get update && apt-get install -y \
    libpq-dev \
    git \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql pgsql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Enable Apache mod_rewrite (optional, good for REST APIs)
RUN a2enmod rewrite

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy the built frontend from builder stage
COPY --from=builder /app/dist/ /var/www/html/

# Copy the backend files into the Apache document root
COPY backend/ /var/www/html/backend/

# Install PHP dependencies (firebase/php-jwt)
WORKDIR /var/www/html/backend
RUN composer install --no-dev --optimize-autoloader

# Back to main directory
WORKDIR /var/www/html

# Adjust permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

EXPOSE 80
