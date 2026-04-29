# Pasul 1: Alegem imaginea de bază. PHP 8.2 cu Apache preinstalat.
FROM php:8.2-apache

# Pasul 2: Instalăm bibliotecile sistem necesare pentru PostgreSQL
# libpq-dev este necesară pentru ca PHP să poată compila extensia pdo_pgsql
RUN apt-get update && apt-get install -y \
    libpq-dev \
    zip \
    unzip \
    git \
    && docker-php-ext-install pdo pdo_pgsql

# Pasul 3: Activăm mod_rewrite din Apache. 
# Este esențial pentru ca Router.php-ul tău să funcționeze cu URL-uri frumoase.
RUN a2enmod rewrite

# Pasul 4: Modificăm Document Root-ul Apache.
# În structura ta, PHP-ul "intră" prin backend/public/index.php.
# Spunem Apache-ului să privească direct acolo.
#ENV APACHE_DOCUMENT_ROOT /var/www/html/backend/public
#RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
#RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Pasul 5: Instalăm Composer (opțional, dar recomandat pentru Autoloading)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Pasul 6: Setăm folderul de lucru în container
WORKDIR /var/www/html