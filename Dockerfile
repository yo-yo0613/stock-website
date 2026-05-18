FROM php:8.2-apache

# 安裝系統必備套件與 PostgreSQL 驅動程式
RUN apt-get update && apt-get install -y \
    libpq-dev \
    git \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql pgsql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 開啟 Apache 的 mod_rewrite
RUN a2enmod rewrite

# 安裝 Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 設定工作目錄
WORKDIR /var/www/html

# 僅複製 backend 資料夾到伺服器根目錄
COPY backend/ /var/www/html/

# 安裝 PHP 相依套件
RUN composer install --no-dev --optimize-autoloader

# 調整權限
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

EXPOSE 80
