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

# Copy the backend files into the Apache document root
# We only copy the backend folder because Render only needs the PHP API
COPY backend/ /var/www/html/

# Install PHP dependencies (firebase/php-jwt)
RUN composer install --no-dev --optimize-autoloader

# Update Apache configuration to use the correct DocumentRoot if necessary
# By default, Apache serves from /var/www/html, which now contains your api/ and config/ folders.
# So https://your-render-url.onrender.com/api/auth.php will work perfectly!

# Adjust permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

EXPOSE 80
