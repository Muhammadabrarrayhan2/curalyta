#!/bin/sh
# Writes the /api proxy block for the frontend nginx.
#   API_UPSTREAM empty -> no proxy (VM: the reverse proxy already routes /api)
#   API_UPSTREAM set   -> proxy /api to that origin over HTTPS (Cloud Run staging)
set -eu

target=/etc/nginx/conf.d/api-proxy.inc

if [ -z "${API_UPSTREAM:-}" ]; then
  : > "$target"
  echo "api-upstream: disabled"
  exit 0
fi

host=$(echo "$API_UPSTREAM" | sed -E 's#^https?://##; s#/.*$##')

cat > "$target" <<EOF
location /api/ {
    proxy_pass ${API_UPSTREAM%/}/api/;
    proxy_http_version 1.1;
    proxy_ssl_server_name on;
    proxy_set_header Host ${host};
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_read_timeout 60s;
    client_max_body_size 15M;
}
EOF
echo "api-upstream: /api -> ${API_UPSTREAM}"
