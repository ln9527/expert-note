# Expert Note System - Project Configuration

**Project**: Expert Note (Annotation-based knowledge capture)
**URL**: https://spansurvey.net/annote/
**Port**: 3006
**Status**: Development

---

## Server Information (Aliyun ECS)

| Item | Value |
|------|-------|
| Public IP | 47.121.176.193 |
| OS | Ubuntu 24.04 |
| Specs | 4 vCPU, 16 GiB RAM |
| Domain | spansurvey.net |
| Service Path | /annote/ |

### SSH Access
```bash
ssh -i ningli.pem root@47.121.176.193
```

### Server Deployment Path
```
/var/www/annote-service
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript |
| Backend | Next.js (API Routes) |
| Database | PostgreSQL 16 (on ECS) |
| AI Model | Qwen via OpenRouter |
| Process Manager | PM2 |
| Reverse Proxy | Nginx |

---

## Git Configuration

| Item | Value |
|------|-------|
| Username | ln9527 |
| Personal Token | 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 |

---

## API Keys

### OpenRouter (Qwen)
```
OPENROUTER_API_KEY=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
```

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | ECS filesystem + PostgreSQL | No OSS needed for MVP, simpler |
| Auth | Hardcoded 10 users | Simple MVP, shared pool |
| Annotation | Insert at cursor | Per user preference |
| Editor | Raw Markdown only | No preview rendering needed |
| AI Refinement | Auto-refine | Controlled by prompts |
| Prompt Scope | Tags + document selection | Both options available |

---

## Development Workflow

### Local Development
```bash
cd /Users/ningli/Library/CloudStorage/Dropbox/Ning_Agentic_AI_workflow/claude_code/expert-note
npm run dev
# Test at http://localhost:3000
```

### Deploy to Server
```bash
# 1. Push to GitHub
git add .
git commit -m "Description"
git push origin main

# 2. SSH to server
ssh -i ningli.pem root@47.121.176.193

# 3. Pull and restart
cd /var/www/annote-service
git pull origin main
npm install --production
npm run build
pm2 restart annote-service --update-env
```

---

## Nginx Configuration (to add on server)

```nginx
# Add to /etc/nginx/sites-available/spansurvey

location /annote/ {
    rewrite ^/annote/(.*)$ /$1 break;
    proxy_pass http://localhost:3006;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Script-Name /annote;
    proxy_cache_bypass $http_upgrade;
}
```

---

## Environment Variables

### Local (.env.local)
```bash
PORT=3000
NODE_ENV=development
BASE_PATH=

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=annotservice
DB_USER=ningli
DB_PASSWORD=

# OpenRouter
OPENROUTER_API_KEY=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
```

### Production (.env)
```bash
PORT=3006
NODE_ENV=production
BASE_PATH=/annote

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=annotservice
DB_USER=postgres
DB_PASSWORD=annotservice2025

# OpenRouter
OPENROUTER_API_KEY=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
```

---

## Related Services on Same Server

| Service | URL | Port | Status |
|---------|-----|------|--------|
| Landing | / | - | Active |
| Auth | /auth/ | 3002 | Active |
| Chat | /chat/ | 3001 | Active |
| **Annote** | /annote/ | 3006 | Development |

---

## Key Files

| File | Purpose | Commit? |
|------|---------|---------|
| `ningli.pem` | SSH private key | NO |
| `expert-note-prd-final.md` | Product requirements document | YES |
| `IMPLEMENTATION_PLAN.md` | Technical implementation plan | YES |
| `.env.local` | Local environment variables | NO |
| `.env` | Production environment (on server) | NO |

---

## Project Principles

1. **Minimal viable first** - Verify each feature works before moving on
2. **No interference** - Keep separate from other services on ECS
3. **Path-based deployment** - Use BASE_PATH pattern like other services
4. **Git-based workflow** - Local dev → GitHub → Server pull

---

## Testing & Debugging Principles

**CRITICAL: Do NOT patch bugs. Always identify and fix root causes systematically.**

### When Encountering Bugs

1. **Reproduce First**
   - Create minimal reproduction steps
   - Identify exact conditions that trigger the bug
   - Document input/output/expected behavior

2. **Trace to Root Cause**
   - Follow data flow from entry point to failure
   - Check assumptions at each layer (UI → API → DB)
   - Identify WHERE the data/state becomes incorrect, not just where error appears

3. **Understand the "Why"**
   - Ask: Why did this bug occur?
   - Ask: What design assumption was wrong?
   - Ask: Are there similar patterns elsewhere that have the same issue?

4. **Fix Systematically**
   - Fix the root cause, not the symptom
   - If a type is wrong, fix the type definition
   - If data flow is wrong, fix the architecture
   - If validation is missing, add it at the appropriate boundary

5. **Verify Comprehensively**
   - Test the fix with original reproduction steps
   - Test related functionality that shares the same code path
   - Consider edge cases the fix might affect

### Anti-Patterns to Avoid

| Bad Practice | Why It's Bad | Better Approach |
|--------------|--------------|-----------------|
| Adding `try/catch` to hide errors | Masks root cause | Fix the error source |
| Type casting to silence TypeScript | Breaks type safety | Fix the type definitions |
| Adding `if` checks for undefined | Treats symptom | Ensure data exists at source |
| Copy-pasting fixes | Creates duplication | Abstract shared logic |
| "It works now" without understanding | Bug will return | Document the root cause |

### Bug Categories and Investigation Strategy

| Bug Type | Investigation Approach |
|----------|----------------------|
| UI not updating | Check state management → re-render triggers → data binding |
| API returns error | Check request format → server logs → database state |
| Data corruption | Trace write operations → check concurrent access → validate inputs |
| Performance issue | Profile → identify bottleneck → optimize specific path |
| Auth/session issue | Check cookie/token flow → session storage → expiration logic |

---

## PRD Reference

Full product requirements are in `expert-note-prd-final.md`. Key features:

1. **Document Management** - Upload, create, tag, delete/restore Markdown files
2. **Annotation Interface** - Button-based `[[MACRO/MESO/MICRO: content]]` insertion
3. **Knowledge Extraction** - AI extracts and refines annotations into reusable knowledge
4. **System Prompt Generation** - Generate prompts from accumulated knowledge base
