#!/usr/bin/env bash
# ============================================================
# github-runner-setup.sh — pasang GitHub Actions runner self-hosted di VM
# aplikasi, agar job deploy berjalan di dalam lab tanpa membuka port masuk.
#
# Dijalankan sebagai root. Token registrasi sekali pakai (berlaku 1 jam)
# diambil dari GitHub lewat gh CLI di laptop admin dan dikirim lewat env:
#   RUNNER_TOKEN=... bash ops/lab/github-runner-setup.sh
# ============================================================
set -euo pipefail

REPO="${REPO:-Muhammadabrarrayhan2/curalyta}"
RUNNER_DIR=/opt/actions-runner
RUNNER_USER=curalyta
LABELS="curalyta-lab"
: "${RUNNER_TOKEN:?RUNNER_TOKEN wajib diisi}"

if [ ! -x "$RUNNER_DIR/config.sh" ]; then
  version=$(curl -fsSL https://api.github.com/repos/actions/runner/releases/latest | jq -r .tag_name | sed 's/^v//')
  mkdir -p "$RUNNER_DIR"
  curl -fsSL -o /tmp/runner.tgz \
    "https://github.com/actions/runner/releases/download/v${version}/actions-runner-linux-x64-${version}.tar.gz"
  tar -xzf /tmp/runner.tgz -C "$RUNNER_DIR"
  chown -R "$RUNNER_USER:$RUNNER_USER" "$RUNNER_DIR"
  "$RUNNER_DIR/bin/installdependencies.sh" >/dev/null
fi

if [ ! -f "$RUNNER_DIR/.runner" ]; then
  sudo -u "$RUNNER_USER" "$RUNNER_DIR/config.sh" --unattended \
    --url "https://github.com/${REPO}" --token "$RUNNER_TOKEN" \
    --name "$(hostname)" --labels "$LABELS" --work _work --replace
fi

cd "$RUNNER_DIR"
./svc.sh install "$RUNNER_USER" >/dev/null 2>&1 || true
./svc.sh start >/dev/null 2>&1 || true
./svc.sh status | head -n 5
