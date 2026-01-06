# Expert Note System - Implementation Plan

## Executive Summary

A comprehensive implementation plan for the Expert Note System - an annotation-based knowledge capture platform. Experts annotate Markdown documents with structured insights (MACRO/MESO/MICRO), which are extracted and organized into a reusable knowledge base for System Prompt generation.

**Target URL**: https://spansurvey.net/annote/
**Port**: 3006
**Tech Stack**: Next.js + TypeScript + React + PostgreSQL + Qwen via OpenRouter

---

## Development Tracks (Parallelizable)

```
Track A: Infrastructure     ████████░░░░░░░░░░░░  (Days 1-5)
Track B: Frontend Core      ░░░░████████████░░░░  (Days 3-10)
Track C: AI Integration     ░░░░░░░░░░████████░░  (Days 11-18)
Track D: Knowledge Base UI  ░░░░░░░░░░░░░░████████ (Days 15-22)
Integration & Testing       ░░░░░░░░░░░░░░░░░░████ (Days 23-25)
```

---

## Phase 1: Project Setup (Days 1-2)

### 1.1 Initialize Next.js Project

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
```

### 1.2 Project Structure

```
expert-note/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Dashboard
│   │   ├── login/page.tsx            # Login
│   │   ├── documents/
│   │   │   ├── page.tsx              # Document list
│   │   │   ├── [id]/page.tsx         # Document editor
│   │   │   └── new/page.tsx          # New document
│   │   ├── knowledge/
│   │   │   ├── page.tsx              # Knowledge list
│   │   │   └── [id]/page.tsx         # Knowledge detail
│   │   ├── prompts/
│   │   │   ├── page.tsx              # Prompts list
│   │   │   ├── generate/page.tsx     # Generator wizard
│   │   │   └── [id]/page.tsx         # Prompt detail
│   │   └── api/
│   │       ├── auth/                 # Auth endpoints
│   │       ├── documents/            # Document CRUD
│   │       ├── annotations/          # Annotation parsing
│   │       ├── knowledge/            # Knowledge entries
│   │       └── prompts/              # Prompt generation
│   ├── components/
│   │   ├── layout/                   # Header, Sidebar, Footer
│   │   ├── auth/                     # LoginForm, AuthGuard
│   │   ├── documents/                # DocumentList, Card, Upload
│   │   ├── editor/                   # MarkdownEditor, Toolbar, Modal
│   │   ├── knowledge/                # KnowledgeList, Card, Filter
│   │   └── prompts/                  # PromptList, Generator, Preview
│   ├── lib/
│   │   ├── db/                       # Database connection & queries
│   │   ├── ai/                       # OpenRouter client & agents
│   │   ├── utils/                    # Helpers (path, annotation, markdown)
│   │   └── auth/                     # Session management
│   ├── hooks/                        # React hooks
│   ├── types/                        # TypeScript definitions
│   └── styles/                       # Global CSS
├── sql/
│   ├── schema.sql                    # Database schema
│   └── seed.sql                      # Initial data
├── public/                           # Static assets
└── Configuration files...
```

### 1.3 Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "pg": "^8.11.3",
    "iron-session": "^8.0.1",
    "bcryptjs": "^2.4.3",
    "uuid": "^9.0.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@types/react": "^18.2.45",
    "@types/pg": "^8.10.9",
    "@types/bcryptjs": "^2.4.6",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.0"
  }
}
```

### 1.4 next.config.js (BASE_PATH support)

```javascript
const basePath = process.env.BASE_PATH || '';

module.exports = {
  basePath: basePath,
  assetPrefix: basePath,
  env: { BASE_PATH: basePath },
  experimental: {
    serverActions: { bodySizeLimit: '10mb' }
  }
};
```

---

## Phase 2: Database Schema (Days 3-5)

### 2.1 Tables

```sql
-- 1. Users (10 hardcoded for MVP)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- 2. Tags
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#6B7280',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  content TEXT DEFAULT '',
  status VARCHAR(20) DEFAULT 'raw',  -- raw, annotating, annotated, extracted
  created_by INTEGER REFERENCES users(id),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Document-Tags junction
CREATE TABLE document_tags (
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, tag_id)
);

-- 5. Annotations (parsed from content)
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  level VARCHAR(10) NOT NULL,  -- MACRO, MESO, MICRO
  content TEXT NOT NULL,
  context_text TEXT,
  position_line INTEGER,
  position_char INTEGER,
  raw_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Knowledge Entries (AI-extracted)
CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  source_annotation_id UUID REFERENCES annotations(id),
  level VARCHAR(10) NOT NULL,
  original_content TEXT NOT NULL,
  refined_content TEXT,
  background TEXT,
  is_universal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. System Prompts
CREATE TABLE system_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(50),
  content TEXT NOT NULL,
  source_document_ids UUID[],
  config JSONB,
  version INTEGER DEFAULT 1,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Sessions
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  data JSONB DEFAULT '{}',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Indexes

```sql
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_is_deleted ON documents(is_deleted);
CREATE INDEX idx_annotations_document_id ON annotations(document_id);
CREATE INDEX idx_annotations_level ON annotations(level);
CREATE INDEX idx_knowledge_document_id ON knowledge_entries(document_id);
CREATE INDEX idx_knowledge_level ON knowledge_entries(level);
```

---

## Phase 3: Frontend - Editor & Annotation UI (Days 6-10)

### 3.1 TypeScript Types

```typescript
export type AnnotationLevel = 'MACRO' | 'MESO' | 'MICRO';

export interface Document {
  id: string;
  filename: string;
  content: string;
  status: 'raw' | 'annotating' | 'annotated' | 'extracted';
  tags?: Tag[];
  annotationCounts?: { macro: number; meso: number; micro: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface Annotation {
  id: string;
  documentId: string;
  level: AnnotationLevel;
  content: string;
  rawText: string;
  positionLine?: number;
  positionChar?: number;
}

export interface KnowledgeEntry {
  id: string;
  documentId: string;
  level: AnnotationLevel;
  originalContent: string;
  refinedContent?: string;
  isUniversal: boolean;
  tags?: Tag[];
}

export const ANNOTATION_COLORS = {
  MACRO: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  MESO: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  MICRO: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
};
```

### 3.2 Annotation Parsing Utility

```typescript
// Regex: [[LEVEL: content]]
const ANNOTATION_REGEX = /\[\[(MACRO|MESO|MICRO):\s*(.+?)\]\]/g;

export function parseAnnotations(text: string): ParsedAnnotation[] {
  const annotations = [];
  let match;
  while ((match = ANNOTATION_REGEX.exec(text)) !== null) {
    annotations.push({
      level: match[1],
      content: match[2].trim(),
      rawText: match[0],
      startIndex: match.index,
    });
  }
  return annotations;
}

export function insertAnnotation(text, cursor, level, content) {
  const annotation = `[[${level}: ${content}]]`;
  return text.slice(0, cursor) + ' ' + annotation + ' ' + text.slice(cursor);
}
```

### 3.3 Core Editor Components

**MarkdownEditor.tsx** - Main editor with textarea
**AnnotationToolbar.tsx** - Macro/Meso/Micro buttons with counts
**AnnotationModal.tsx** - Input modal for annotation content

**Key UX Requirements:**
- Button-based insertion (NO manual `[[]]` typing)
- Keyboard shortcuts: Cmd+1 (Macro), Cmd+2 (Meso), Cmd+3 (Micro)
- Color-coded display: Red/Yellow/Green
- Insert at cursor position

---

## Phase 4: Annotation Parsing & Storage (Days 11-12)

### 4.1 Document API Flow

```
Create/Update Document
  ↓
Parse content for [[LEVEL: content]] patterns
  ↓
Delete existing annotations for document
  ↓
Insert new annotation records
  ↓
Update document status
```

### 4.2 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents` | GET | List documents (filter by status, tags) |
| `/api/documents` | POST | Create document |
| `/api/documents/[id]` | GET | Get document with annotations |
| `/api/documents/[id]` | PUT | Update document (re-parse annotations) |
| `/api/documents/[id]` | DELETE | Soft delete to trash |
| `/api/documents/upload` | POST | Upload .md file |
| `/api/annotations/parse` | POST | Parse annotations from content |

---

## Phase 5: Knowledge Extraction Agent (Days 13-15)

### 5.1 OpenRouter Client

```typescript
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL = 'qwen/qwen-2.5-72b-instruct';

export async function chatCompletion(messages, options) {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, messages, ...options }),
  });
  return response.json();
}
```

### 5.2 Extraction Agent System Prompt

```
You are a knowledge extraction specialist. Transform expert annotations into reusable knowledge:

1. Preserve original meaning and intent
2. Remove context-specific dependencies
3. Generalize into reusable principles
4. Classify as universal vs situational
5. Optimize language for clarity

Output JSON: {
  "original": "...",
  "refined": "...",
  "isUniversal": true/false,
  "reasoning": "..."
}
```

### 5.3 Extraction API

```
POST /api/annotations/extract
Body: { documentId, background }

1. Get document annotations
2. Send to Qwen for refinement
3. Save knowledge entries
4. Update document status to 'extracted'
```

---

## Phase 6: System Prompt Generation (Days 16-18)

### 6.1 Generation Agent System Prompt

```
You are a System Prompt architect. Synthesize knowledge entries into effective AI instructions:

1. Structure: Role, Task, Guidelines, Examples
2. Prioritize MACRO as principles, MESO as patterns, MICRO as techniques
3. Maintain expert voice
4. Make prompts actionable

Output: Ready-to-use System Prompt in markdown
```

### 6.2 Templates

| Template | Focus |
|----------|-------|
| Introduction Review | Research importance, gap identification |
| Methodology Review | Clarity, reproducibility, alignment |
| Discussion Review | Interpretation, limitations, implications |
| Academic Coach | Comprehensive writing guidance |
| Custom | User-defined purpose |

### 6.3 Generation API

```
POST /api/prompts/generate
Body: { purpose, templateType, documentIds, customInstructions }

1. Fetch knowledge entries from selected documents
2. Group by level (MACRO → MESO → MICRO)
3. Send to Qwen with template context
4. Return generated prompt
```

---

## Phase 7: Knowledge Base & Prompts UI (Days 19-22)

### 7.1 Knowledge Base Page

- List knowledge entries with filtering
- Filter by: level, tags, universal/situational
- Show original vs refined content
- Link to source document

### 7.2 Prompt Generator Page

- Template selection dropdown
- Purpose input field
- Document multi-select (from extracted docs)
- Custom instructions textarea
- Generate button → Preview → Save

### 7.3 Prompts Management

- List saved prompts
- View/copy prompt content
- Version history (basic)

---

## Phase 8: Integration & Testing (Days 23-25)

### 8.1 Testing Checklist

- [ ] User login/logout flow
- [ ] Document CRUD (create, read, update, delete)
- [ ] File upload (.md files)
- [ ] Annotation insertion via all 3 buttons
- [ ] Keyboard shortcuts (Cmd+1/2/3)
- [ ] Annotation parsing and storage
- [ ] Knowledge extraction (AI call)
- [ ] Prompt generation (AI call)
- [ ] Tag filtering
- [ ] Trash/restore
- [ ] BASE_PATH routing in production

### 8.2 Deployment Checklist

- [ ] Production .env configured
- [ ] Database schema applied
- [ ] Seed data inserted (users, tags)
- [ ] `npm run build` succeeds
- [ ] PM2 ecosystem.config.js created
- [ ] Nginx location block added
- [ ] Service starts on port 3006
- [ ] Test at https://spansurvey.net/annote/

---

## Deployment Configuration

### PM2 (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'annote-service',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/annote-service',
    env: {
      NODE_ENV: 'production',
      PORT: 3006,
    },
  }],
};
```

### Nginx (add to spansurvey config)

```nginx
location /annote/ {
    rewrite ^/annote/(.*)$ /$1 break;
    proxy_pass http://localhost:3006;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    client_max_body_size 10M;
}
```

---

## Dependencies Map

```
                    ┌─────────────────┐
                    │  Project Setup  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────────┐
        │ Database │  │   Auth   │  │ Path Helper  │
        │  Schema  │  │  System  │  │   Utility    │
        └────┬─────┘  └────┬─────┘  └──────────────┘
             │              │
             ▼              ▼
        ┌──────────────────────┐
        │   Document API       │
        │   (CRUD + Upload)    │
        └──────────┬───────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌──────────┐
   │ Editor │ │ Annot. │ │ OpenRoute│
   │   UI   │ │ Parser │ │  Client  │
   └────┬───┘ └────┬───┘ └────┬─────┘
        │          │          │
        └──────────┼──────────┘
                   ▼
        ┌──────────────────────┐
        │ Knowledge Extraction │
        │       Agent          │
        └──────────┬───────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌──────────┐
   │Knowldge│ │ Prompt │ │  Prompt  │
   │Base UI │ │  Gen   │ │Generator │
   └────────┘ │ Agent  │ │    UI    │
              └────────┘ └──────────┘
```

---

## Parallel Agent Assignment

For maximum development speed, deploy multiple agents:

| Agent | Track | Tasks |
|-------|-------|-------|
| Agent 1 | Infrastructure | Next.js setup, config, path helpers |
| Agent 2 | Database | Schema, connection pool, queries |
| Agent 3 | Auth | Session, login API, user queries |
| Agent 4 | Editor UI | MarkdownEditor, Toolbar, Modal |
| Agent 5 | Document API | CRUD endpoints, file upload |
| Agent 6 | AI Integration | OpenRouter client, extraction, generation |

**Synchronization Points:**
- After Phase 2: Database must be ready before Document API
- After Phase 4: Annotations must work before Knowledge Extraction
- After Phase 6: All AI features before final integration

---

## Success Criteria

### MVP Complete When:

1. User can log in with hardcoded credentials
2. User can create/upload Markdown documents
3. User can add annotations via Macro/Meso/Micro buttons
4. Annotations display with correct colors
5. AI can extract knowledge from annotations
6. AI can generate system prompts from knowledge
7. Service accessible at https://spansurvey.net/annote/

---

**Estimated Total: 25 working days (~5 weeks)**

*With parallel agents: Can compress to ~15 working days (~3 weeks)*
