# Expert Note

Annotation-based knowledge capture system for academic writing feedback.

## Overview

Expert Note allows experts to annotate documents with structured feedback at three levels:
- **MACRO** (Red): High-level principles and judgments
- **MESO** (Yellow): Pattern-level guidance
- **MICRO** (Green): Specific edits and suggestions

Annotations are extracted into a searchable knowledge base and can be used to generate AI prompts.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000 and login with `ning` / `password123`.

## Documentation

| File | Description |
|------|-------------|
| [LOCAL_SETUP.md](./LOCAL_SETUP.md) | Full setup guide for new computers |
| [CLAUDE.md](./CLAUDE.md) | Project configuration for Claude Code |

## Features

- Document editor with annotation toolbar
- Knowledge base with tag filtering
- Markdown export for knowledge entries
- AI-powered prompt generation
- Batch annotation extraction

## Tech Stack

- Next.js 16 (App Router)
- React 19
- PostgreSQL 16
- Tailwind CSS
- OpenRouter AI (Qwen model)

## Project Structure

```
src/
├── app/           # Pages and API routes
├── components/    # React components
├── lib/           # Database, auth, AI utilities
└── types/         # TypeScript definitions
sql/
├── schema.sql     # Database tables
└── seed.sql       # Initial data
```

## License

Private project.
