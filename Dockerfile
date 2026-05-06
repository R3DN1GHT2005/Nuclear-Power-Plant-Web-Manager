FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    libpq-dev \
    zip \
    unzip \
    git \
    && docker-php-ext-install pdo pdo_pgsql

RUN a2enmod rewrite

# Schimbam DocumentRoot direct in apache2.conf
RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/backend/public|g' \
    /etc/apache2/apache2.conf \
    /etc/apache2/sites-available/000-default.conf

# Configuram Directory pentru public
RUN echo '<Directory /var/www/html/backend/public>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/apache2.conf

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html