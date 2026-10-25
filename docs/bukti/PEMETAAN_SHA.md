# Pemetaan SHA Commit

Pada 25 Oktober 2026 pesan commit di repositori ini dirapikan, sehingga 36 commit sejak `72eb4f8` mendapat SHA baru. Isi file setiap commit tidak berubah. Dokumen narasi di `docs/*.md` sudah memakai SHA baru.

Log bukti mentah (`docs/bukti/*.log`), riwayat run GitHub Actions, tag image GHCR, dan beberapa screenshot tetap memakai SHA lama karena merupakan keluaran asli saat kegiatan berlangsung. Image GHCR dengan tag SHA lama tetap tersedia untuk rollback. Gunakan tabel ini untuk mencocokkan keduanya.

| SHA lama | SHA baru | Pesan commit |
|---|---|---|
| `72eb4f8` | `8ac1174` | feat: switch AI to Groq with rotating keys and refresh the UI |
| `61084c8` | `ec42b98` | chore(deploy): production containers, reverse proxy, health check, ops scripts |
| `bd8160e` | `6e9d601` | chore(ops): make ops scripts vendor-neutral (MinIO object storage, GHCR) |
| `4ad25a1` | `effec4d` | feat(lab): Proxmox provisioning script for the IaaS lab |
| `506b97d` | `90cf3c7` | feat(lab): monitoring stack, VM setup scripts, CI/CD, and SLA report |
| `4c22f21` | `69eb1be` | test: make config-env test platform-neutral |
| `db324be` | `7c94f4c` | chore(lab): size lab VMs for a 16 GB host (app 2.5 GB, monitor 1.5 GB) |
| `58287a1` | `c8734e5` | feat(lab): provision Proxmox lab; add concept, technology, SLA, support docs |
| `ec8db3f` | `15596c8` | fix(lab): allow root to update the repo owned by the curalyta user |
| `c031cde` | `a3c8af4` | feat(lab): replace MinIO with Garage object storage, rclone client |
| `9e0190c` | `4953946` | fix(lab): set the Garage bucket lifecycle with a SigV4 helper |
| `137c960` | `69f92cb` | chore(lab): app VM uses CI-built images by default |
| `c3bfa30` | `486aca5` | fix(ops): deploy uses the new image tags; runner can write deploy logs |
| `2d065e1` | `eb4986b` | fix(ops): deploy.sh re-executes itself after updating the config |
| `0b1c3fb` | `659cdd4` | feat(lab): script to sync CORS, uptime targets, and Vercel rewrite with the tunnel URL |
| `3e1d67a` | `178cf63` | feat(staging): Vercel staging frontend proxies /api to the lab over HTTPS |
| `fd94864` | `f87b2d3` | feat(lab): node_exporter on the Proxmox host for hypervisor metrics |
| `ce5bf74` | `41ef2fa` | chore(lab): size vzdump schedule to the backup disk; quiet rclone |
| `0423955` | `1f769df` | fix(lab): ntfy alerts without anonymous email; add ops docs and evidence |
| `b1afcd3` | `2b9f264` | chore(lab): keep the ntfy URL placeholder out of a template comment |
| `ed8af70` | `5bb40dc` | fix(lab): let chrony step the Proxmox clock after the laptop sleeps |
| `d9d8766` | `b40d27d` | chore(staging): point Vercel /api rewrite to https://produces-solving-teddy-itself.trycloudflare.com |
| `352af86` | `4df1735` | feat(lab): tunnel watchdog after a real expired-tunnel incident (INC-002) |
| `dca1114` | `73aade6` | docs: incident simulation INC-001, hardware analysis, deployment, screenshots |
| `6b064a8` | `923be26` | fix(ops): SLA response time uses successful probes only |
| `64fa453` | `189086b` | docs: complete BNSP portfolio documents in formal Indonesian |
| `82bff24` | `4d315de` | feat(lab): owner-run script to enable ntfy e-mail alerts with an access token |
| `4c168a2` | `d82850e` | fix(lab): upgrade cAdvisor to v0.55.1 for Docker 29 containerd image store |
| `0632043` | `dab1095` | docs: add 38 evidence screenshots and record cAdvisor and tunnel findings |
| `0b4dab6` | `9106cb1` | docs: add Vercel deployment screenshots (U1-04, U4-06) |
| `d2d9109` | `eb6248c` | fix(lab): validate ntfy token length and against ntfy.sh before saving |
| `820f591` | `afac09c` | docs: email alert evidence (U5-05b) and email channel now active |
| `6e7487a` | `dbaffcb` | chore(staging): point Vercel /api rewrite to https://flashing-followed-montgomery-ccd.trycloudflare.com |
| `fd7f960` | `653311c` | docs: INC-003 (public URL changed after lab reboot) and phone ntfy evidence |
| `3a83964` | `b0e6c42` | docs: desktop/GitHub screenshots (U2-01, U3-01, U4-04, U4-05) and INC-003 root cause |
| `d1e07f1` | `f0a6dd9` | docs: closing SLA report and lab shutdown status |
