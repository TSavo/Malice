#!/bin/sh
set -e

# Substitute environment variables into nginx config
envsubst '${GAME_HOST} ${HTTP_PORT} ${WS_PORT} ${TELNET_PORT} ${SSH_PORT}' \
    < /etc/nginx/nginx.conf.template \
    > /etc/nginx/nginx.conf

echo "Faction proxy starting..."
echo "  HTTP:   80 -> ${GAME_HOST}:${HTTP_PORT}"
echo "  WS:   8080 -> ${GAME_HOST}:${WS_PORT}"
echo "  Telnet: 23 -> ${GAME_HOST}:${TELNET_PORT}"
echo "  SSH:    22 -> ${GAME_HOST}:${SSH_PORT}"

# Start nginx in foreground
exec nginx -g 'daemon off;'
