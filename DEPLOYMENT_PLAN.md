# ClawdBot/Moltbot Server Deployment Plan

## Overview

This document covers:
- **Phase 1:** Deploy ClawdBot on a server with Docker
- **Phase 2:** Hide secrets from the ClawdBot Agent (future implementation)

---

# Phase 1: Deploy ClawdBot/Moltbot on Server with Docker

## Prerequisites
| Requirement | Your Server | Required | Status |
|-------------|-------------|----------|--------|
| Docker | v26.1.3 | ✅ Any recent | ✅ OK |
| Docker Compose | (included) | v2+ | ✅ OK |
| Node.js | v20.19.5 | N/A | ✅ Not needed |

### ✅ Node.js: Handled by Docker

Moltbot requires **Node.js ≥22.12.0**, but you **don't need to install it on the server**.

The Docker image (`node:22-bookworm` base) includes Node.js 22 automatically. All CLI commands run inside the container, so the host Node.js version is irrelevant.

```dockerfile
# From Dockerfile - Node 22 is built into the image
FROM node:22-bookworm
```

> **Summary:** Just use Docker. No Node.js installation or upgrade needed on the server.

---

## Step-by-Step Deployment

### Step 1: Clone or Pull the Repository

```bash
cd /path/to/your/server
git clone https://github.com/moltbot/moltbot.git
cd moltbot

# Or if already cloned, pull latest
git pull origin main
```

### Step 2: Create Required Directories

```bash
mkdir -p ~/.clawdbot
mkdir -p ~/clawd
```

### Step 3: Create `.env` File

Create a `.env` file in the repository root:

```bash
cat > .env << 'EOF'
# Core Configuration
CLAWDBOT_CONFIG_DIR=/root/.clawdbot
CLAWDBOT_WORKSPACE_DIR=/root/clawd
CLAWDBOT_GATEWAY_PORT=18789
CLAWDBOT_BRIDGE_PORT=18790
CLAWDBOT_GATEWAY_BIND=lan
CLAWDBOT_IMAGE=moltbot:local

# Gateway Token (auto-generated if you use docker-setup.sh)
CLAWDBOT_GATEWAY_TOKEN=

# Model Authentication (add your keys)
ANTHROPIC_API_KEY=
CLAUDE_AI_SESSION_KEY=
CLAUDE_WEB_SESSION_KEY=
CLAUDE_WEB_COOKIE=

# Optional
CLAWDBOT_EXTRA_MOUNTS=
CLAWDBOT_HOME_VOLUME=
CLAWDBOT_DOCKER_APT_PACKAGES=
EOF
```

### Step 4: Run the Setup Script (Recommended)

The easiest way to deploy:

```bash
./docker-setup.sh
```

This script will:
1. ✅ Build the Docker image (`moltbot:local`)
2. ✅ Generate a secure gateway token (64-char hex)
3. ✅ Write configuration to `.env`
4. ✅ Run the onboarding wizard interactively
5. ✅ Start the gateway via Docker Compose

### Alternative: Manual Deployment

If you prefer manual control:

```bash
# 1. Build the image
docker build -t moltbot:local -f Dockerfile .

# 2. Generate a gateway token
export CLAWDBOT_GATEWAY_TOKEN=$(openssl rand -hex 32)
echo "CLAWDBOT_GATEWAY_TOKEN=$CLAWDBOT_GATEWAY_TOKEN" >> .env

# 3. Run onboarding
docker compose run --rm moltbot-cli onboard --no-install-daemon

# 4. Start the gateway
docker compose up -d moltbot-gateway
```

### Step 5: Configure Channels

After the gateway is running, add your messaging channels:

```bash
# WhatsApp (scan QR code)
docker compose run --rm moltbot-cli channels login

# Telegram (with bot token)
docker compose run --rm moltbot-cli channels add --channel telegram --token "YOUR_BOT_TOKEN"

# Discord (with bot token)
docker compose run --rm moltbot-cli channels add --channel discord --token "YOUR_BOT_TOKEN"

# Slack
docker compose run --rm moltbot-cli channels add --channel slack --token "YOUR_BOT_TOKEN"
```

### Step 6: Verify Deployment

```bash
# Check gateway health
docker compose exec moltbot-gateway node dist/index.js health --token "$CLAWDBOT_GATEWAY_TOKEN"

# View logs
docker compose logs -f moltbot-gateway

# Check channel status
docker compose run --rm moltbot-cli channels status
```

### Step 7: Access the Web Control UI

Open in your browser:
- **Local:** `http://localhost:18789/`
- **Remote:** `http://<server-ip>:18789/`

Paste your `CLAWDBOT_GATEWAY_TOKEN` to authenticate.

---

## Environment Variables Reference

### Core Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAWDBOT_CONFIG_DIR` | Config storage directory | `$HOME/.clawdbot` |
| `CLAWDBOT_WORKSPACE_DIR` | Agent workspace directory | `$HOME/clawd` |
| `CLAWDBOT_GATEWAY_PORT` | Gateway HTTP port | `18789` |
| `CLAWDBOT_BRIDGE_PORT` | Bridge port | `18790` |
| `CLAWDBOT_GATEWAY_BIND` | Network binding mode | `lan` |
| `CLAWDBOT_GATEWAY_TOKEN` | Authentication token | Auto-generated |
| `CLAWDBOT_IMAGE` | Docker image name | `moltbot:local` |

### Model Authentication

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key (recommended) |
| `CLAUDE_AI_SESSION_KEY` | Claude OAuth session key |
| `CLAUDE_WEB_SESSION_KEY` | Alternative session key |
| `CLAUDE_WEB_COOKIE` | Claude web cookie |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENROUTER_API_KEY` | OpenRouter API key |

### Docker Build Options

| Variable | Description |
|----------|-------------|
| `CLAWDBOT_DOCKER_APT_PACKAGES` | Extra apt packages (e.g., `ffmpeg`) |
| `CLAWDBOT_EXTRA_MOUNTS` | Additional bind mounts (comma-separated) |
| `CLAWDBOT_HOME_VOLUME` | Named volume for `/home/node` |

---

## Configuration Files

| Path | Purpose |
|------|---------|
| `.env` | Docker Compose environment variables |
| `~/.clawdbot/moltbot.json` | Main configuration (JSON5) |
| `~/.clawdbot/credentials/` | Channel credentials |
| `~/.clawdbot/agents/<id>/` | Per-agent configuration |

### Minimal Configuration (`~/.clawdbot/moltbot.json`)

```json5
{
  agents: {
    defaults: {
      workspace: "~/clawd"
    }
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"]
    }
  }
}
```

---

## Common Commands

```bash
# Start gateway
docker compose up -d moltbot-gateway

# Stop gateway
docker compose down

# Restart gateway
docker compose restart moltbot-gateway

# View logs
docker compose logs -f moltbot-gateway

# Run CLI commands
docker compose run --rm moltbot-cli <command>

# Rebuild after code changes
docker compose build && docker compose up -d moltbot-gateway

# Security audit
docker compose run --rm moltbot-cli security audit --deep
```

---

## Troubleshooting

### Gateway won't start

```bash
# Check logs
docker compose logs moltbot-gateway

# Verify .env file
cat .env

# Check port availability
ss -tlnp | grep 18789
```

### WhatsApp QR not showing

```bash
# Run with TTY
docker compose run --rm -it moltbot-cli channels login
```

### Permission issues

```bash
# Fix ownership
sudo chown -R $USER:$USER ~/.clawdbot ~/clawd
```

---

# Phase 2: Secret Hiding from ClawdBot Agent

> **Status:** Future implementation — to be done after Phase 1 is stable

## Goal

Ensure all secret keys and tokens used in Docker deployment are:
1. **Hidden from the Agent** — cannot be read via `echo`, `printenv`, `cat /proc/*/environ`, or any tool
2. **Usable by the Agent** — the gateway/runtime can access them for API calls
3. **Manageable via Web UI** — admins can add/update keys without rebuilding containers
4. **Activated on restart** — new keys work after `docker compose restart` (no rebuild)

---

## Current State Analysis

### How Secrets Are Currently Handled

1. **docker-compose.yml** passes secrets as environment variables:
   ```yaml
   environment:
     CLAWDBOT_GATEWAY_TOKEN: ${CLAWDBOT_GATEWAY_TOKEN}
     CLAUDE_AI_SESSION_KEY: ${CLAUDE_AI_SESSION_KEY}
   ```

2. **Redaction system** (`src/logging/redact.ts`) masks secrets in logs/output:
   - Patterns: `sk-*`, `ghp_*`, `Bearer`, PEM blocks, etc.
   - Only affects **logging output**, not actual env var access

3. **Agent sandbox** can isolate tool execution but env vars still leak if not configured

### The Problem

- Secrets in `environment:` are readable via `printenv`, `echo $VAR`, `/proc/1/environ`
- Redaction only hides from logs, not from direct agent tool calls
- If user asks "what's my API key?", agent can technically read and return it

---

## Proposed Architecture

### Option A: Secret Proxy Service (Recommended)

```
┌─────────────────────────────────────────────────────────┐
│  Docker Host                                            │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │  .env file      │───▶│  moltbot-secrets (sidecar)  │ │
│  │  (source of     │    │  - Reads .env on startup    │ │
│  │   truth)        │    │  - Exposes internal API     │ │
│  └─────────────────┘    │  - Not accessible to agent  │ │
│                         └──────────────┬──────────────┘ │
│                                        │ internal net   │
│                         ┌──────────────▼──────────────┐ │
│                         │  moltbot-gateway            │ │
│                         │  - Fetches secrets via API  │ │
│                         │  - Never exposes to agent   │ │
│                         │  - Sandboxed agent tools    │ │
│                         └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Benefits:**
- Secrets never in gateway's environment
- Agent cannot access via any means
- `.env` changes apply on container restart
- Web UI writes to `.env`, secrets service reloads

### Option B: Docker Secrets + Init Container

Use Docker Swarm secrets or mounted secret files that are read once at startup and removed from filesystem:

```yaml
services:
  moltbot-gateway:
    secrets:
      - claude_api_key
      - anthropic_api_key
    # Read from /run/secrets/* at startup, store in memory only
```

**Limitation:** Requires Swarm mode or custom init logic

### Option C: Enhanced Sandbox Isolation (Simplest)

Configure agent sandbox to run in isolated container without env inheritance:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        inheritEnv: false,  // Don't pass host env to sandbox
        allowedEnvVars: ["PATH", "HOME", "TERM"]  // Whitelist only safe vars
      }
    }
  }
}
```

**Benefits:**
- Uses existing sandbox infrastructure
- No new services needed
- Secrets stay in gateway process, never reach agent tools

---

## Implementation Plan

### Step 1: Research Current Sandbox Env Handling

- [ ] Check `src/sandbox/` for `inheritEnv` or env filtering
- [ ] Check if sandbox already isolates environment variables
- [ ] Review `src/agent/` for how tools access environment

### Step 2: Implement Env Filtering in Sandbox

If not already present:
- [ ] Add `sandbox.inheritEnv: boolean` config option
- [ ] Add `sandbox.allowedEnvVars: string[]` whitelist
- [ ] Ensure Docker sandbox containers don't receive sensitive vars

### Step 3: Web UI → `.env` Integration

- [ ] Check if Web UI already writes to config/credentials
- [ ] Add endpoint to write secrets to `.env` file
- [ ] Implement file watcher or reload mechanism
- [ ] Ensure gateway reads updated `.env` on restart

### Step 4: Documentation & Testing

- [ ] Document secret management best practices
- [ ] Add tests for env isolation
- [ ] Run `moltbot security audit --deep` to verify

---

## Questions to Resolve

1. **Where does Web UI currently store credentials?**
   - Check `~/.clawdbot/credentials/` structure
   - Check if there's an existing secrets store

2. **How does the gateway currently load API keys?**
   - Environment variables?
   - Config file (`moltbot.json`)?
   - Credentials directory?

3. **Does sandbox already filter environment?**
   - Check `Dockerfile.sandbox` and sandbox spawn code

4. **What's the reload mechanism?**
   - Does gateway support config hot-reload?
   - Or must container restart?

---

## Files to Investigate

| Path | Purpose |
|------|---------|
| `src/sandbox/` | Sandbox container spawning |
| `src/agent/tools/` | How tools execute and access env |
| `src/infra/config/` | Configuration loading |
| `src/web/` or `ui/` | Web UI credential management |
| `src/logging/redact.ts` | Current redaction patterns |
| `docker-compose.yml` | Current env var injection |

---

## Success Criteria

- [ ] Agent cannot read secrets via `echo $SECRET`, `printenv`, `cat /proc/*/environ`
- [ ] Agent cannot print secrets even if directly asked
- [ ] Gateway can still use secrets for API calls
- [ ] New secrets added via Web UI work after `docker compose restart`
- [ ] No Docker image rebuild required for secret changes
- [ ] `moltbot security audit --deep` passes

---

## Summary

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | 🚀 Ready | Deploy with Docker using `docker-setup.sh` |
| **Phase 2** | 📋 Planned | Implement secret hiding from agent |

**Next Steps:**
1. Complete Phase 1 deployment
2. Test basic functionality
3. Begin Phase 2 implementation
