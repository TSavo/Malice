# Production Deployment

Guide to deploying Malice to production with Caddy reverse proxy, automatic HTTPS, and multi-domain routing.

## Quick Reference

**SSH to production:**
```bash
ssh -i ~/.ssh/malice-do root@malice.world
```

**Server:** `malice-prod` @ `146.190.135.71`

**Domains:**
| Domain | Purpose |
|--------|---------|
| https://malice.world | Admin site |
| https://thecontinuum.city | Continuum faction |
| https://graycartel.com | Gray Cartel faction |

**Common commands (on server):**
```bash
cd /root/Malice
docker compose ps                    # Check status
docker compose logs -f game          # View logs
git pull && docker compose build game && docker compose up -d  # Deploy update
```

---

## Architecture

Single server with Caddy routing multiple domains to the game container:

```
Internet (HTTPS :443)
         │
┌────────┴────────────────────────────────────────┐
│  Caddy (auto-HTTPS via Let's Encrypt)           │
│  Routes by Host header:                         │
│  ├─ malice.world        → game:80               │
│  ├─ thecontinuum.city   → game:8000 (HTTP)      │
│  │   └─ /mux (ws)       → game:8080 (WebSocket) │
│  ├─ graycartel.com      → game:8001 (HTTP)      │
│  │   └─ /mux (ws)       → game:8081 (WebSocket) │
│  └─ *.faction.domain    → game:800X (wildcards) │
└────────┬────────────────────────────────────────┘
         │
┌────────┴────────────────────────────────────────┐
│  Game Container                                 │
│  ├─ :80    Admin web (malice.world)             │
│  ├─ :8000  Continuum HTTP                       │
│  ├─ :8080  Continuum WebSocket                  │
│  ├─ :8001  Cartel HTTP                          │
│  ├─ :8081  Cartel WebSocket                     │
│  ├─ :3012  Continuum Session MCP                │
│  ├─ :3013  Cartel Session MCP                   │
│  └─ :3010  Admin MCP (internal only)            │
└─────────────────────────────────────────────────┘
```

## Prerequisites

- DigitalOcean account
- Cloudflare account with domains added
- SSH key pair for server access
- Domains:
  - `malice.world` (admin/meta site)
  - `thecontinuum.city` (Continuum faction)
  - `graycartel.com` (Gray Cartel faction)

---

## Phase 1: DigitalOcean Setup

### Create SSH Key

Generate a dedicated SSH key for the production server:

```bash
# Generate key pair
ssh-keygen -t ed25519 -C "malice-prod" -f ~/.ssh/malice-do

# View public key (for DigitalOcean)
cat ~/.ssh/malice-do.pub
```

### Add SSH Key to DigitalOcean

**Via Web UI:**
1. Go to Settings → Security → SSH Keys
2. Click "Add SSH Key"
3. Paste your public key
4. Name it (e.g., "malice-do")
5. Note the key ID for CLI use

**Via MCP (Claude Code):**
```
mcp__digitalocean__key-create
  Name: malice-do
  PublicKey: <contents of ~/.ssh/malice-do.pub>
```

### Create Droplet

**Via Web UI:**
1. Create → Droplets
2. Choose Ubuntu 24.04 LTS
3. Select size: Basic, Regular, $12/mo (s-1vcpu-2gb)
4. Choose region: SFO3 (or nearest)
5. Select your SSH key
6. Enable monitoring
7. Create Droplet
8. Note the IP address

**Via MCP (Claude Code):**
```
# First, find Ubuntu 24.04 image ID
mcp__digitalocean__image-list Type=distribution

# Create droplet
mcp__digitalocean__droplet-create
  Name: malice-prod
  Size: s-1vcpu-2gb
  ImageID: <ubuntu-24-04-image-id>
  Region: sfo3
  Monitoring: true
  SSHKeys: [<your-key-id>]
```

### Verify SSH Access

```bash
ssh -i ~/.ssh/malice-do root@<DROPLET_IP>
```

---

## Phase 2: Cloudflare DNS Setup

### Important: DNS-Only Mode

**WebSockets require DNS-only mode** (gray cloud, not orange). Cloudflare's proxy doesn't support persistent WebSocket connections well with Let's Encrypt certificates from Caddy.

### Configure DNS Records

Each domain needs A records pointing to your droplet IP.

**Via Web UI:**

For each domain, go to DNS settings and add:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| A | @ | YOUR_DROPLET_IP | DNS only |
| A | www | YOUR_DROPLET_IP | DNS only |
| A | * | YOUR_DROPLET_IP | DNS only (for wildcards) |

**Via MCP (Claude Code):**

Each Cloudflare domain has a zone ID. Create records using:

```
# malice.world
mcp__cloudflare-malice__create_dns_record
  type: A
  name: @
  content: YOUR_DROPLET_IP
  proxied: false

mcp__cloudflare-malice__create_dns_record
  type: A
  name: www
  content: YOUR_DROPLET_IP
  proxied: false

# thecontinuum.city
mcp__cloudflare-continuum__create_dns_record
  type: A
  name: @
  content: YOUR_DROPLET_IP
  proxied: false

mcp__cloudflare-continuum__create_dns_record
  type: A
  name: www
  content: YOUR_DROPLET_IP
  proxied: false

mcp__cloudflare-continuum__create_dns_record
  type: A
  name: "*"
  content: YOUR_DROPLET_IP
  proxied: false

# graycartel.com
mcp__cloudflare-cartel__create_dns_record
  type: A
  name: @
  content: YOUR_DROPLET_IP
  proxied: false

mcp__cloudflare-cartel__create_dns_record
  type: A
  name: www
  content: YOUR_DROPLET_IP
  proxied: false

mcp__cloudflare-cartel__create_dns_record
  type: A
  name: "*"
  content: YOUR_DROPLET_IP
  proxied: false
```

### Verify DNS Propagation

```bash
# Check A records
dig +short malice.world
dig +short thecontinuum.city
dig +short graycartel.com

# All should return your droplet IP
```

---

## Phase 3: Server Setup

SSH to your droplet and set up the environment:

```bash
# SSH to server
ssh -i ~/.ssh/malice-do root@YOUR_DROPLET_IP

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Node.js (for tsx)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Install tsx globally (required for bootstrap)
npm install -g tsx

# Clone repo
git clone https://github.com/YOUR_ORG/Malice.git
cd Malice

# Configure environment
cp .env.example .env
nano .env  # Set EMAIL_API_KEY=re_xxxxxxxxxx

# Bootstrap database and start all services
npm run docker:reset

# Start Caddy (runs after game is healthy)
docker compose up -d caddy

# Verify HTTPS is working
curl -I https://malice.world
curl -I https://thecontinuum.city
curl -I https://graycartel.com
```

---

## Phase 4: Email Configuration

Malice uses [Resend](https://resend.com) for transactional email (registration verification, password resets).

### Resend Account Setup

1. Create account at [resend.com](https://resend.com)
2. Get API key from dashboard
3. Add domain `malice.world` to Resend (Domains → Add Domain)

### DNS Records for Email

Add these records in Cloudflare for `malice.world`:

**SPF Record:**
```
TXT  @  "v=spf1 include:_spf.resend.com ~all"
```

**Via MCP:**
```
mcp__cloudflare-malice__create_dns_record
  type: TXT
  name: @
  content: "v=spf1 include:_spf.resend.com ~all"
```

**DKIM Record:** (get exact value from Resend dashboard)
```
CNAME  resend._domainkey  →  [resend-provided-cname-value]
```

### Configure Server

Set the API key in `.env` on the production server:
```bash
EMAIL_API_KEY=re_xxxxxxxxxx
```

Restart game container to pick up changes:
```bash
docker compose restart game
```

### Verify Email

Check Resend dashboard for domain verification status. Send a test registration to verify emails are delivered.

### Faction Domains (Future)

Currently all emails send from `noreply@malice.world`. To enable faction-specific sending domains:

1. Add each faction domain to Resend (`thecontinuum.city`, `graycartel.com`)
2. Add SPF/DKIM records for each domain
3. Uncomment domain registration in `src/game/game-coordinator.ts`

---

## Docker Compose Configuration

The production stack uses three containers:

| Container | Purpose |
|-----------|---------|
| `malice-mongo` | MongoDB database (persistent volume) |
| `malice-game` | Game server (all ports) |
| `malice-caddy` | Reverse proxy with auto-HTTPS |

### Key Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Container orchestration |
| `Caddyfile` | Domain routing and HTTPS |
| `.env` | Environment variables |
| `.env.example` | Template for environment |

### Caddyfile

```caddyfile
# Admin site
malice.world {
    reverse_proxy game:80
}

# Continuum faction
thecontinuum.city {
    @websocket {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    reverse_proxy @websocket game:8080
    reverse_proxy game:8000
}

# Gray Cartel faction
graycartel.com {
    @websocket {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    reverse_proxy @websocket game:8081
    reverse_proxy game:8001
}

# Wildcard subdomains for player profiles
*.thecontinuum.city {
    reverse_proxy game:8000
}

*.graycartel.com {
    reverse_proxy game:8001
}
```

## Common Operations

### View Logs

```bash
# Game container logs
docker logs -f malice-game

# Caddy logs
docker logs -f malice-caddy

# All containers
docker compose logs -f
```

### Restart Services

```bash
# Restart game only
docker compose restart game

# Rebuild and restart game
docker compose build game && docker compose up -d game

# Full restart
docker compose down && docker compose up -d
```

### Update Code

```bash
cd /root/Malice
git pull
docker compose build game
docker compose up -d
```

### Reset Database

```bash
npm run docker:reset
docker compose up -d caddy
```

### Check Status

```bash
docker compose ps
docker compose logs --tail 20 game
```

## Port Summary

| Port | Service | Exposed Externally? |
|------|---------|---------------------|
| 22 | SSH | Yes (firewall protected) |
| 80 | HTTP → Caddy | Yes (redirects to 443) |
| 443 | HTTPS → Caddy | Yes |
| 3000 | LSP API | No (Docker internal) |
| 3010 | MCP Admin | No (Docker internal) |
| 3012+ | Session MCP | No (Docker internal) |
| 8000+ | Faction HTTP | No (via Caddy) |
| 8080+ | Faction WebSocket | No (via Caddy) |
| 9999 | DevTools | No (Docker internal) |
| 27017 | MongoDB | No (Docker internal) |

## Troubleshooting

### HTTPS Not Working

1. Check DNS propagation: `dig +short your-domain.com`
2. Check Caddy logs: `docker logs malice-caddy`
3. Verify Caddy can reach game: `docker exec malice-caddy curl -I http://game:80`

### WebSocket Connection Failed

1. Ensure DNS is not proxied (Cloudflare orange cloud = bad)
2. Check WebSocket upgrade in Caddyfile
3. Test direct: `wscat -c wss://thecontinuum.city/mux`

### Email Not Sending

1. Verify `EMAIL_API_KEY` in `.env`
2. Check game logs for email errors
3. Verify domain is verified in Resend dashboard
4. Check SPF/DKIM records: `dig TXT your-domain.com`

### Container Won't Start

1. Check logs: `docker compose logs game`
2. Verify MongoDB is healthy: `docker compose ps`
3. Check port conflicts: `netstat -tlnp | grep 8080`

---

## MCP Tools Reference

Claude Code has MCP servers configured for managing infrastructure.

### DigitalOcean MCP

Manage droplets, SSH keys, and more:

```
# List droplets
mcp__digitalocean__droplet-list

# Get droplet info
mcp__digitalocean__droplet-get ID=<droplet-id>

# Reboot droplet
mcp__digitalocean__reboot-droplet ID=<droplet-id>

# Power cycle
mcp__digitalocean__power-cycle-droplet ID=<droplet-id>

# List SSH keys
mcp__digitalocean__key-list

# Get account info
mcp__digitalocean__account-get-information
```

### Cloudflare MCP (per-domain)

Each domain has its own MCP server:

**malice.world:** `mcp__cloudflare-malice__*`
**thecontinuum.city:** `mcp__cloudflare-continuum__*`
**graycartel.com:** `mcp__cloudflare-cartel__*`

```
# List DNS records
mcp__cloudflare-malice__list_dns_records

# Create A record
mcp__cloudflare-malice__create_dns_record
  type: A
  name: @
  content: 146.190.135.71
  proxied: false

# Update record
mcp__cloudflare-malice__update_dns_record
  recordId: <record-id>
  content: <new-ip>

# Delete record
mcp__cloudflare-malice__delete_dns_record
  recordId: <record-id>
```

---

## SSH Tunneling for Dev Tools

Admin ports (MCP, LSP, DevTools) are bound to localhost only. Access them via SSH tunnel.

### Basic SSH Tunnel

```bash
# Forward all dev ports (using 4xxx to avoid conflicts with local dev)
ssh -L 4000:localhost:3000 \
    -L 4010:localhost:3010 \
    -L 4999:localhost:9999 \
    -L 4012:localhost:3012 \
    -L 4013:localhost:3013 \
    -i ~/.ssh/malice-do root@146.190.135.71
```

### Port Mapping

| Service | Remote Port | Local Tunnel | Local Dev |
|---------|-------------|--------------|-----------|
| LSP API | 3000 | 4000 | 3000 |
| MCP Admin | 3010 | 4010 | 3010 |
| DevTools | 9999 | 4999 | 9999 |
| Continuum Session MCP | 3012 | 4012 | 3012 |
| Cartel Session MCP | 3013 | 4013 | 3013 |

### Claude Code MCP Configuration

Add to your Claude Code MCP settings (with tunnel active):

```json
{
  "mcpServers": {
    "malice-prod": {
      "type": "http",
      "url": "http://localhost:4010/mcp"
    }
  }
}
```

### Keep Tunnel Alive

For persistent access, use autossh or add to SSH config:

```bash
# ~/.ssh/config
Host malice-prod
    HostName 146.190.135.71
    User root
    IdentityFile ~/.ssh/malice-do
    LocalForward 4000 localhost:3000
    LocalForward 4010 localhost:3010
    LocalForward 4999 localhost:9999
    LocalForward 4012 localhost:3012
    LocalForward 4013 localhost:3013
```

Then just: `ssh malice-prod`

---

## Automated Backups

MongoDB and NPC session logs are backed up to Google Drive with tiered retention.

### What's Backed Up

| Data | File Pattern | Source |
|------|--------------|--------|
| MongoDB | `malice-*.gz` | Game objects, players, rooms, etc. |
| NPC Sessions | `sessions-*.tar.gz` | Claude API conversation logs (JSONL) |

### Backup Schedule

| Frequency | Retention | Purpose |
|-----------|-----------|---------|
| Every 30 min | 3 days | Point-in-time recovery |
| Daily (midnight) | 7 days | Daily snapshots |
| Weekly (Sunday) | Forever | Long-term archive |

### Storage Locations

| Location | Path | Purpose |
|----------|------|---------|
| Local | `/root/backups/` | Fast restore |
| Google Drive | `Malice-Backups/` | Off-site disaster recovery |

### Manual Backup

```bash
ssh -i ~/.ssh/malice-do root@malice.world /root/backups/backup-mongo.sh
```

### Restore from Backup

```bash
# List available backups
ssh -i ~/.ssh/malice-do root@malice.world 'rclone ls gdrive:Malice-Backups/ | tail -10'

# Download specific backup
ssh -i ~/.ssh/malice-do root@malice.world 'rclone copy gdrive:Malice-Backups/malice-2025-12-31_0000.gz /root/backups/'

# Restore MongoDB (stops game first)
ssh -i ~/.ssh/malice-do root@malice.world 'cd /root/Malice && docker compose stop game && gunzip -c /root/backups/malice-2025-12-31_0000.gz | docker exec -i malice-mongo mongorestore --archive --drop --db malice && docker compose start game'

# Restore NPC sessions (JSONL logs)
ssh -i ~/.ssh/malice-do root@malice.world 'rclone copy gdrive:Malice-Backups/sessions-2025-12-31_0000.tar.gz /root/backups/ && docker exec -i malice-game tar xzf - -C /home/node/.claude < /root/backups/sessions-2025-12-31_0000.tar.gz'
```

### Backup Script Location

- Script: `/root/backups/backup-mongo.sh`
- Log: `/root/backups/backup.log`
- Cron: `*/30 * * * *` (every 30 minutes)

### Google Drive Setup

Backups use rclone with Google Drive OAuth. To reconfigure:

```bash
# On a machine with browser access
rclone authorize "drive"

# Copy the token JSON to server
ssh -i ~/.ssh/malice-do root@malice.world 'cat > ~/.config/rclone/rclone.conf << EOF
[gdrive]
type = drive
token = <paste-token-json-here>
EOF'
```

---

## GitHub Actions Self-Hosted Runner

Run GitHub Actions workflows on the production server for faster builds and access to the production environment.

### Why Self-Hosted?

- **Faster builds**: No cold start, Docker layer caching persists
- **Production access**: Can run integration tests against live services
- **Cost savings**: Free unlimited minutes (vs GitHub-hosted limits)
- **Custom environment**: Pre-installed tools (Bun, Node.js, Docker)

### Quick Setup

```bash
# On production server
cd /root/Malice

# Set required environment variables
export GITHUB_TOKEN=ghp_xxxxx  # PAT with 'repo' scope
export GITHUB_REPOSITORY=yourorg/Malice

# Run setup script
./scripts/setup-runner.sh
```

### Manual Setup

1. **Create GitHub Token**

   Go to [GitHub Settings > Tokens](https://github.com/settings/tokens) and create a token with `repo` scope.

2. **Configure Environment**

   Add to `.env`:
   ```bash
   GITHUB_TOKEN=ghp_xxxxx
   GITHUB_REPOSITORY=yourorg/Malice
   RUNNER_NAME=malice-prod
   RUNNER_LABELS=self-hosted,Linux,X64,malice,production
   ```

3. **Start Runner**

   ```bash
   docker compose -f docker-compose.runner.yml up -d
   ```

4. **Verify Registration**

   Check https://github.com/yourorg/Malice/settings/actions/runners

### Using the Runner in Workflows

Update your workflow to target the self-hosted runner:

```yaml
jobs:
  build:
    runs-on: [self-hosted, malice]  # or just 'self-hosted'
    steps:
      - uses: actions/checkout@v4
      # ... rest of your job
```

### Runner Management

```bash
# View logs
docker logs -f malice-runner

# Stop runner (deregisters from GitHub)
docker compose -f docker-compose.runner.yml down

# Restart runner
docker compose -f docker-compose.runner.yml restart

# Rebuild runner image (after Dockerfile changes)
docker compose -f docker-compose.runner.yml build --no-cache
docker compose -f docker-compose.runner.yml up -d
```

### Runner with Full Stack

Run the runner alongside the game services:

```bash
# Start everything
docker compose -f docker-compose.yml -f docker-compose.runner.yml up -d

# Or ensure network exists first
docker network create --subnet=172.20.0.0/16 malice-network
docker compose -f docker-compose.runner.yml up -d
```

### Security Considerations

- The runner has Docker socket access (required for containerized jobs)
- Only repository collaborators can trigger workflows
- The runner auto-deregisters on shutdown to prevent orphaned registrations
- Consider using fine-grained tokens with minimal permissions

### Troubleshooting

**Runner not appearing in GitHub:**
```bash
docker logs malice-runner  # Check for registration errors
```

**Token permission errors:**
- Ensure token has `repo` scope for private repositories
- For organization repos, you may need `admin:org` scope

**Docker permission errors:**
```bash
# Inside runner container, verify docker access
docker exec malice-runner docker ps
```

---

## Current Production

**Droplet:** `malice-prod`
**IP:** `146.190.135.71`
**SSH:** `ssh -i ~/.ssh/malice-do root@malice.world`

**Domains:**
- https://malice.world (admin)
- https://thecontinuum.city (Continuum faction)
- https://graycartel.com (Gray Cartel faction)
