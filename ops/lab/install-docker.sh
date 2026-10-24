#!/usr/bin/env bash
# ============================================================
# install-docker.sh — pasang Docker Engine + Compose plugin dari repositori
# resmi Docker (Ubuntu), dengan rotasi log container. Idempotent.
# ============================================================
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# Rotasi log container (rotasi log sebagai aktivitas rutin IaaS)
if [ ! -f /etc/docker/daemon.json ]; then
  cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "5" }
}
EOF
  systemctl restart docker
fi

systemctl enable --now docker
id -nG curalyta 2>/dev/null | grep -qw docker || usermod -aG docker curalyta
docker --version
docker compose version
