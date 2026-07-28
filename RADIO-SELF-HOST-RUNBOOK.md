# OOH Radio — Self-Host Runbook

**Decision (locked):** Run our own broadcast stack. Self-hosted **AzuraCast** (open-source, AGPL) on **our** VPS — our server, our data, our stream, our library. Not a rented service (no radio.co / managed host), and **not** a streaming server written from scratch (that's the trap). AzuraCast is the engine; we own the box it runs on.

**Division of labour:**
- **You** stand up the server (your cloud login, your domain, your audio files). ~1 hour.
- **Claude** — the entire app side is already built and shipped dark. The moment the stream URL exists, it flips live in minutes.

Strategic/architecture context: `OOH-Radio-Ops-Plan.md`.

---

## 0. What you provide
- A VPS you control (Hetzner / DigitalOcean / OVH / any Docker-capable host).
- Control of the `ooh.earth` DNS (to add `radio.ooh.earth`).
- Your audio library (mp3/FLAC/etc.).

## 1. Provision the server
- 2 vCPU / 4 GB RAM / 40–80 GB SSD (size disk to fit the library), Ubuntu 24.04 LTS, ~£5–11/mo, 100+ concurrent listeners on starter size.
- Hardening before install:
```bash
adduser ops && usermod -aG sudo ops
# add SSH key to /home/ops/.ssh/authorized_keys, then:
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw allow 8000 && ufw enable
```

## 2. DNS
A record: `radio.ooh.earth → <server IP>`. Let it resolve before requesting TLS.

## 3. Install AzuraCast (verified)
```bash
sudo su -
mkdir -p /var/azuracast && cd /var/azuracast
curl -fsSL https://raw.githubusercontent.com/AzuraCast/AzuraCast/master/docker.sh > docker.sh
chmod +x docker.sh
./docker.sh install
```
Installer handles Docker + all components. Then open the site to create the super-admin.

## 4. First-run setup
1. Create super-admin.
2. Administration → System Settings → Base URL `https://radio.ooh.earth`, enable HTTPS/Let's Encrypt (auto TLS).
3. New Station: name `OOH Radio`, shortcode `ooh`, enable AutoDJ, Icecast frontend, streamers/DJs.

## 5. CORS (real FFT visualizer)
- Now-playing API (`/api/nowplaying/ooh`) is generally CORS-open → dashboard + track readout work.
- If the visualizer falls back to simulated, allow cross-origin on the audio stream (frontend/web-proxy CORS). Non-fatal: audio always plays.

## 6. Two URLs → hand to Claude
From Station → Profile:
- Listen URL — e.g. `https://radio.ooh.earth/listen/ooh/radio.mp3`
- Base URL — `https://radio.ooh.earth`

## 7. Ingest the library
- Formats: MP3/FLAC/OGG/AAC. Clean ID3 tags (artist/title/art) → polished now-playing.
- Upload: web (small), or **SFTP Users** + rsync (bulk). Reprocess media after a bulk drop.
- Enable ReplayGain/loudness normalisation.
- Suggested folders: `/OOH-Signal`, `/Protest-Cuts`, `/Ambient-Ops`, `/Station-IDs`.

## 8. Programming (playlists + clock)
- 24/7 AutoDJ on `OOH-Signal`; `Station-IDs` every N songs; `Ambient-Ops` overnight; scheduled shows; live takeover (ducks AutoDJ, crossfades back); optional top-of-hour news relay.
- Set 1–2s crossfade.

## 9. Live DJs
BUTT / Rocket Broadcaster / built-in web DJ with streamer credentials. AutoDJ resumes on disconnect.

## 10. Backups / updates / monitoring
- Backups: schedule, send off-box (media + DB).
- Update: `cd /var/azuracast && ./docker.sh update-self && ./docker.sh update` (off-peak).
- Later: n8n uptime ping → alert on drop.

## 11. Ownership & scaling
- Full ownership of data/media/stream.
- Migrating hosts / adding a CDN = change **one line** in `src/lib/radioOps.js`. No app rebuild.

## 12. The flip (Claude's side — built, shipped dark)
- `src/lib/radioOps.js` (control file), `radioContext.jsx` (merge + now-playing poll), `RadioMiniPlayer.jsx` (readout + LIVE), `src/pages/RadioOps.jsx` (`/radio-ops`, protected), route registered.
- On receiving the two URLs: paste config → verify player + now-playing + dashboard → add nav link (+ admin gate) → build → launched.

## 13. Licensing
Broadcasting our own library makes royalties our responsibility. Use CC / artist-permitted / cleared / original content, or obtain PRS/PPL (UK) / SoundExchange (US). Spoken-word + field audio + originals = safest launch content.

## Launch checklist
- [ ] VPS provisioned + hardened
- [ ] `radio.ooh.earth` resolving
- [ ] AzuraCast installed, super-admin created
- [ ] HTTPS/TLS on
- [ ] Station `OOH Radio` (`ooh`) + AutoDJ + DJs
- [ ] CORS enabled
- [ ] Library uploaded, tags clean, ReplayGain on
- [ ] Playlists + clock + crossfade
- [ ] Listen URL confirmed playing
- [ ] Two URLs sent → app flipped live
- [ ] Nav link + optional admin gate
- [ ] Licensing squared
- [ ] Backups off-box
