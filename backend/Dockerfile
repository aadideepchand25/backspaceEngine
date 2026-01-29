FROM php:8.2-apache

# Copy everything into Apache web root
COPY . /var/www/html/

# Fix permissions
RUN chown -R www-data:www-data /var/www/html

# Enable Apache rewrite (optional, safe)
RUN a2enmod rewrite
