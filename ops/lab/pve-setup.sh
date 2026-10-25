#!/usr/bin/env bash
# ============================================================
# pve-setup.sh — provisioning lab IaaS Curalyta di Proxmox VE
#
# Dijalankan di host Proxmox sebagai root (idempotent, aman diulang):
#   bash ops/lab/pve-setup.sh
#
# Yang dikerjakan:
#   1. Repositori no-subscription + patching host Proxmox
#   2. Verifikasi virtualisasi bersarang (/dev/kvm)
#   3. Template VM Ubuntu Server 22.04 LTS (cloud image + cloud-init)
#   4. VM 101 curalyta-app dan VM 102 curalyta-monitor dengan IP statis
#   5. Firewall Proxmox per VM (setara firewall VPC di public cloud)
#   6. Disk backup terpisah (storage backup-disk) + jadwal vzdump harian
#
# Kapasitas: SSD laptop hanya menyisakan ~20 GB, sehingga VM dibuat sebagai
# linked clone dari template. vzdump terjadwal hanya untuk VM aplikasi (data
# dan layanan utama) dengan 1 arsip; VM monitoring dibangun ulang dari skrip
# (analisis di docs/KEBUTUHAN_PERANGKAT_KERAS.md).
#
# Topologi (VMware NAT vmnet8 192.168.45.0/24, gateway .2):
#   pve 192.168.45.10 | curalyta-app .20 | curalyta-monitor .30 | laptop .1
# ============================================================
set -euo pipefail

# ---------- Parameter lab ----------
GATEWAY="192.168.45.2"
DNS="192.168.45.2"
HOST_IP="192.168.45.1"          # laptop Windows (admin)
PVE_IP="192.168.45.10"
APP_IP="192.168.45.20"
MON_IP="192.168.45.30"
TEMPLATE_ID=9000
APP_ID=101
MON_ID=102
STORAGE="local-lvm"
IMG_URL="https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img"
IMG_PATH="/var/lib/vz/template/iso/jammy-server-cloudimg-amd64.img"
SNIPPET="/var/lib/vz/snippets/curalyta-vendor.yaml"
SSH_KEYS="/root/.ssh/authorized_keys"   # kunci yang sama dipakai untuk VM
BACKUP_STORAGE="backup-disk"
BACKUP_MOUNT="/mnt/backup-disk"
# Disk backup dikenali dari label filesystem-nya; bila belum diformat, dipilih
# disk yang benar-benar kosong (tanpa partisi, tanpa filesystem, bukan PV LVM).
# Nama perangkat (nvme0n1/nvme0n2) bisa tertukar antar boot, jadi tidak dipakai.
find_backup_dev() {
  local dev
  dev=$(blkid -L curalyta-backup 2>/dev/null || true)
  if [ -n "$dev" ]; then echo "$dev"; return; fi
  for dev in $(lsblk -dnpo NAME,TYPE | awk '$2 == "disk" {print $1}'); do
    [ "$(lsblk -nro NAME "$dev" | wc -l)" -eq 1 ] || continue   # punya partisi
    blkid "$dev" >/dev/null 2>&1 && continue                   # punya filesystem/PV
    pvs "$dev" >/dev/null 2>&1 && continue                     # anggota LVM
    echo "$dev"; return
  done
}
TZ_NAME="Asia/Jakarta"

step() { printf '\n==== %s ====\n' "$*"; }

# ---------- 1. Repositori dan patching ----------
step "1. Repositori no-subscription dan patching host"
for f in /etc/apt/sources.list.d/pve-enterprise.sources /etc/apt/sources.list.d/ceph.sources; do
  # Repositori enterprise butuh langganan berbayar; nonaktifkan untuk lab
  [ -f "$f" ] && grep -q '^Enabled: no' "$f" || { [ -f "$f" ] && echo 'Enabled: no' >> "$f"; }
done
for f in /etc/apt/sources.list.d/pve-enterprise.list /etc/apt/sources.list.d/ceph.list; do
  [ -f "$f" ] && sed -i 's/^deb /# deb /' "$f"
done
codename=$(. /etc/os-release && echo "$VERSION_CODENAME")
if [ ! -f /etc/apt/sources.list.d/pve-no-subscription.sources ]; then
  cat > /etc/apt/sources.list.d/pve-no-subscription.sources <<EOF
Types: deb
URIs: http://download.proxmox.com/debian/pve
Suites: ${codename}
Components: pve-no-subscription
Signed-By: /usr/share/keyrings/proxmox-archive-keyring.gpg
EOF
fi
export DEBIAN_FRONTEND=noninteractive
# Jam harus benar sebelum apt: tanda tangan repositori ditolak bila jam mundur
# (VMware memberi jam lokal Windows; chrony mengoreksinya ke NTP)
chronyc -a makestep >/dev/null 2>&1 || true
hwclock --systohc || true
apt-get update -qq
apt-get -y -qq dist-upgrade
apt-get -y -qq autoremove
apt-get clean
timedatectl set-timezone "$TZ_NAME"
pveversion

# ---------- 2. Virtualisasi bersarang ----------
step "2. Verifikasi virtualisasi bersarang"
lscpu | grep -E 'Model name|^CPU\(s\)|Virtualization' || true
if [ -c /dev/kvm ]; then
  ls -l /dev/kvm
  echo "KVM tersedia: VM berjalan dengan akselerasi hardware"
else
  echo "PERINGATAN: /dev/kvm tidak ada. Aktifkan 'Virtualize Intel VT-x' di VMware dan matikan Hyper-V Windows." >&2
  exit 1
fi
free -h
df -h / /var/lib/vz

# Storage 'local' boleh menyimpan snippet cloud-init dan disk import
pvesm set local --content iso,vztmpl,backup,snippets,import

# Metrik host hypervisor (CPU, RAM, disk) untuk Prometheus di VM monitoring
apt-get install -y -qq prometheus-node-exporter
systemctl enable --now prometheus-node-exporter
apt-get clean

# ---------- 3. Template Ubuntu 22.04 ----------
step "3. Template VM Ubuntu 22.04 (cloud-init)"
mkdir -p "$(dirname "$IMG_PATH")" /var/lib/vz/snippets
if [ ! -f "$IMG_PATH" ]; then
  wget -q -O "$IMG_PATH.part" "$IMG_URL" && mv "$IMG_PATH.part" "$IMG_PATH"
fi

# Vendor data: paket dasar yang dipasang otomatis saat VM pertama kali boot
cat > "$SNIPPET" <<'EOF'
#cloud-config
timezone: Asia/Jakarta
package_update: true
package_upgrade: true
packages:
  - qemu-guest-agent
  - prometheus-node-exporter
  - ca-certificates
  - curl
  - git
  - jq
  - unattended-upgrades
runcmd:
  - systemctl enable --now qemu-guest-agent
  - systemctl enable --now prometheus-node-exporter
EOF

# Template yang pembuatannya terputus (masih terkunci / belum jadi template)
# dihapus dulu agar bisa dibuat ulang dengan bersih
if qm status "$TEMPLATE_ID" >/dev/null 2>&1 && ! qm config "$TEMPLATE_ID" | grep -q '^template: 1'; then
  echo "Template ${TEMPLATE_ID} tidak lengkap, dibuat ulang"
  qm unlock "$TEMPLATE_ID" || true
  qm destroy "$TEMPLATE_ID" --purge
fi
# Volume sisa yang tidak tercatat di konfigurasi VM (pembuatan terputus)
if ! qm status "$TEMPLATE_ID" >/dev/null 2>&1; then
  for vol in $(pvesm list "$STORAGE" --vmid "$TEMPLATE_ID" 2>/dev/null | awk 'NR>1 {print $1}'); do
    echo "Menghapus volume sisa $vol"
    pvesm free "$vol"
  done
fi

if ! qm status "$TEMPLATE_ID" >/dev/null 2>&1; then
  qm create "$TEMPLATE_ID" --name ubuntu-2204-template --ostype l26 \
    --memory 2048 --cores 2 --cpu host \
    --net0 virtio,bridge=vmbr0,firewall=1 \
    --scsihw virtio-scsi-single \
    --scsi0 "${STORAGE}:0,import-from=${IMG_PATH},discard=on,ssd=1" \
    --ide2 "${STORAGE}:cloudinit" --boot order=scsi0 \
    --serial0 socket --vga serial0 --agent enabled=1 \
    --ciuser curalyta --sshkeys "$SSH_KEYS" \
    --nameserver "$DNS" --searchdomain curalyta.lab \
    --cicustom "vendor=local:snippets/$(basename "$SNIPPET")"
  qm template "$TEMPLATE_ID"
fi
# Image sumber tidak diperlukan lagi setelah template terbentuk (hemat disk)
if qm config "$TEMPLATE_ID" | grep -q '^template: 1'; then rm -f "$IMG_PATH"; fi

# ---------- 4. VM aplikasi dan VM monitoring ----------
make_vm() {
  local id="$1" name="$2" ip="$3" cores="$4" mem="$5" disk="$6"
  if ! qm status "$id" >/dev/null 2>&1; then
    # Linked clone: berbagi disk dasar template, hanya perubahan yang disimpan
    qm clone "$TEMPLATE_ID" "$id" --name "$name"
    qm set "$id" --cores "$cores" --memory "$mem" \
      --ipconfig0 "ip=${ip}/24,gw=${GATEWAY}" --onboot 1 \
      --tags curalyta
    qm resize "$id" scsi0 "$disk"
  fi
  [ "$(qm status "$id" | awk '{print $2}')" = "running" ] || qm start "$id"
}
step "4. VM ${APP_ID} curalyta-app dan VM ${MON_ID} curalyta-monitor"
make_vm "$APP_ID" curalyta-app "$APP_IP" 2 2560 25G
make_vm "$MON_ID" curalyta-monitor "$MON_IP" 2 1536 20G
qm list

# ---------- 5. Firewall per VM ----------
step "5. Firewall Proxmox per VM"
# Firewall level datacenter harus aktif agar aturan VM berlaku.
# Kebijakan input datacenter tetap ACCEPT agar akses 8006/22 ke host aman.
mkdir -p /etc/pve/firewall
cat > /etc/pve/firewall/cluster.fw <<EOF
[OPTIONS]
enable: 1
policy_in: ACCEPT
policy_out: ACCEPT
EOF

# VM aplikasi: HTTP/HTTPS dari mana saja, SSH hanya dari laptop admin dan host,
# node_exporter hanya dari VM monitoring
cat > /etc/pve/firewall/${APP_ID}.fw <<EOF
[OPTIONS]
enable: 1
policy_in: DROP
policy_out: ACCEPT

[RULES]
IN ACCEPT -p tcp -dport 80 -log nolog # HTTP publik
IN ACCEPT -p tcp -dport 443 -log nolog # HTTPS publik
IN ACCEPT -source ${HOST_IP} -p tcp -dport 22 -log nolog # SSH admin (laptop)
IN ACCEPT -source ${PVE_IP} -p tcp -dport 22 -log nolog # SSH dari host Proxmox
IN ACCEPT -source ${MON_IP} -p tcp -dport 9100 -log nolog # node_exporter -> Prometheus
IN ACCEPT -source ${MON_IP} -p tcp -dport 8080 -log nolog # cAdvisor -> Prometheus
IN ACCEPT -p icmp -log nolog # ping untuk diagnosis
EOF

# VM monitoring: dashboard dan API monitoring hanya dari laptop admin;
# object storage Garage (API S3 :3900) dari VM aplikasi
cat > /etc/pve/firewall/${MON_ID}.fw <<EOF
[OPTIONS]
enable: 1
policy_in: DROP
policy_out: ACCEPT

[RULES]
IN ACCEPT -source ${HOST_IP} -p tcp -dport 22 -log nolog # SSH admin (laptop)
IN ACCEPT -source ${PVE_IP} -p tcp -dport 22 -log nolog # SSH dari host Proxmox
IN ACCEPT -source ${HOST_IP} -p tcp -dport 3000 -log nolog # Grafana
IN ACCEPT -source ${HOST_IP} -p tcp -dport 9090 -log nolog # Prometheus
IN ACCEPT -source ${HOST_IP} -p tcp -dport 9093 -log nolog # Alertmanager
IN ACCEPT -source ${APP_IP} -p tcp -dport 3900 -log nolog # Garage S3 API (backup dari app)
IN ACCEPT -source ${HOST_IP} -p tcp -dport 3900 -log nolog # Garage S3 API (admin)
IN ACCEPT -p icmp -log nolog
EOF
pve-firewall compile >/dev/null && pve-firewall restart && pve-firewall status

# ---------- 6. Disk backup dan jadwal vzdump ----------
step "6. Disk backup terpisah dan jadwal vzdump harian"
BACKUP_DEV=$(find_backup_dev)
if [ -n "$BACKUP_DEV" ] && [ -b "$BACKUP_DEV" ]; then
  echo "Disk backup: $BACKUP_DEV ($(lsblk -dno SIZE "$BACKUP_DEV"))"
  if ! blkid "$BACKUP_DEV" >/dev/null 2>&1; then
    mkfs.ext4 -q -L curalyta-backup "$BACKUP_DEV"
  fi
  mkdir -p "$BACKUP_MOUNT"
  grep -q "LABEL=curalyta-backup" /etc/fstab || \
    echo "LABEL=curalyta-backup $BACKUP_MOUNT ext4 defaults,nofail 0 2" >> /etc/fstab
  mountpoint -q "$BACKUP_MOUNT" || mount "$BACKUP_MOUNT"
  pvesm status | grep -q "^$BACKUP_STORAGE " || \
    pvesm add dir "$BACKUP_STORAGE" --path "$BACKUP_MOUNT" --content backup --is_mountpoint 1
  target_storage="$BACKUP_STORAGE"
else
  echo "Disk backup $BACKUP_DEV tidak ada; backup disimpan di storage local"
  target_storage="local"
fi
df -h "$BACKUP_MOUNT" 2>/dev/null || true
if ! pvesh get /cluster/backup --output-format json | grep -q '"id":"curalyta-daily"'; then
  pvesh create /cluster/backup --id curalyta-daily --schedule '01:30' \
    --vmid "${APP_ID}" --storage "$target_storage" --mode snapshot \
    --compress zstd --prune-backups keep-last=1 --enabled 1 \
    --notes-template '{{guestname}} harian'
else
  pvesh set /cluster/backup/curalyta-daily --vmid "${APP_ID}" --prune-backups keep-last=1
fi
pvesh get /cluster/backup --output-format yaml

step "Selesai"
echo "VM aplikasi : ssh -i ~/.ssh/curalyta_lab curalyta@${APP_IP}"
echo "VM monitor  : ssh -i ~/.ssh/curalyta_lab curalyta@${MON_IP}"
