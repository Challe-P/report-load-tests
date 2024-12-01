FROM php:8.2-cli

# Installera nödvändiga tillägg
RUN docker-php-ext-install pdo pdo_mysql

# Kopiera din Laravel-applikation
COPY . /var/www/html
WORKDIR /var/www/html

# Installera Composer och beroenden
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
RUN composer install

# Exponera porten för Laravel's inbyggda server
EXPOSE 8000

# Starta Laravel's inbyggda server
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8002"]
