FROM nginx:alpine

# Copy template
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Entrypoint script to substitute env vars and start nginx
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80 22 23 8080

ENTRYPOINT ["/entrypoint.sh"]
