# Phase 2: Generation Templates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create AI prompt templates that generate high-quality Claude Code Skills and MCP prompt content from user knowledge/prompts.

**Architecture:** Extend `prompt_templates` table with new categories (`skill-generation`, `mcp-generation`). Each template guides AI to produce well-structured output matching the Claude Code skill format or MCP prompt structure.

**Tech Stack:** PostgreSQL migrations, existing OpenRouter integration (Grok 4.1 Fast)

---

## Task 1: Database Migration - Add New Categories

**Files:**
- Create: `sql/migrations/014_skill_mcp_template_categories.sql`

**Step 1: Write the migration SQL**

```sql
-- Migration: Add skill-generation and mcp-generation categories to prompt_templates
-- This extends the category CHECK constraint to support skill and MCP generation templates

-- Drop and recreate the constraint with new categories
ALTER TABLE prompt_templates
DROP CONSTRAINT IF EXISTS prompt_templates_category_check;

ALTER TABLE prompt_templates
ADD CONSTRAINT prompt_templates_category_check
CHECK (category IN ('extraction', 'generation', 'skill-generation', 'mcp-generation'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'prompt_templates_category_check';
```

**Step 2: Apply migration locally**

Run: `psql -h localhost -U ningli -d annotservice -f sql/migrations/014_skill_mcp_template_categories.sql`
Expected: ALTER TABLE commands succeed

**Step 3: Verify constraint**

Run: `psql -h localhost -U ningli -d annotservice -c "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'prompt_templates_category_check';"`
Expected: Shows constraint with all 4 categories

**Step 4: Commit**

```bash
git add sql/migrations/014_skill_mcp_template_categories.sql
git commit -m "feat: Add skill-generation and mcp-generation categories to prompt_templates"
```

---

## Task 2: Create SKILL.md Generator Template

**Files:**
- Create: `sql/migrations/015_skill_generation_templates.sql`

**Step 1: Write the seed template**

The SKILL.md generator should produce output matching Claude Code skill format:
- Skills have: name, description, trigger patterns, instructions, examples
- Format follows superpowers patterns studied earlier

```sql
-- Migration: Add skill-generation templates
-- These templates guide AI to create Claude Code skill packages

INSERT INTO prompt_templates (name, description, category, template_type, content, is_default, is_active)
VALUES (
  'Skill MD Generator',
  'Generates SKILL.md file content for Claude Code skills',
  'skill-generation',
  'skill-md',
  'You are a Claude Code Skill architect. Your task is to create a well-structured SKILL.md file from the provided knowledge and prompts.

# INPUT
You will receive:
1. **Source Prompts**: User-created prompts containing expert knowledge
2. **Source Knowledge**: Extracted knowledge entries with structured insights
3. **User Instructions**: Title, description, and additional guidance

# OUTPUT FORMAT
Generate a complete SKILL.md file in this exact structure:

```markdown
---
name: {kebab-case-name}
description: {One clear sentence describing what this skill does}
---

# {Skill Title}

## When to Use

{Clear trigger conditions - when should Claude invoke this skill?}
- Trigger pattern 1
- Trigger pattern 2
- Trigger pattern 3

## Instructions

{Core instructions derived from the knowledge/prompts. Be specific and actionable.}

### Key Principles
{Extract the most important principles from source materials}

### Process
{Step-by-step process the AI should follow}

### Quality Criteria
{How to evaluate if the output is good}

## Examples

### Example 1: {Scenario}
**Input:** {Example user request}
**Output:** {Expected AI behavior/response}

### Example 2: {Scenario}
**Input:** {Example user request}
**Output:** {Expected AI behavior/response}
```

# GENERATION PRINCIPLES

1. **Extract, Don''t Invent**: Base all instructions on the provided source materials
2. **Be Specific**: Vague instructions like "write well" are useless. Be concrete.
3. **Trigger Clarity**: Make it obvious when this skill should activate
4. **Actionable Steps**: Every instruction should be executable
5. **Test with Examples**: Examples should demonstrate real usage

# CRITICAL RULES

- The skill name MUST be kebab-case (e.g., "code-review", "api-design")
- Description MUST be under 100 characters
- Include at least 2 concrete examples
- Do NOT include placeholder text like "[fill in later]"
- Output ONLY the markdown content, no explanations',
  TRUE,
  TRUE
);
```

**Step 2: Apply migration**

Run: `psql -h localhost -U ningli -d annotservice -f sql/migrations/015_skill_generation_templates.sql`
Expected: INSERT 0 1

**Step 3: Verify template created**

Run: `psql -h localhost -U ningli -d annotservice -c "SELECT name, category, template_type FROM prompt_templates WHERE category = 'skill-generation';"`
Expected: Shows "Skill MD Generator" row

**Step 4: Commit**

```bash
git add sql/migrations/015_skill_generation_templates.sql
git commit -m "feat: Add SKILL.md generator template"
```

---

## Task 3: Create Skill Prompts Generator Template

**Files:**
- Modify: `sql/migrations/015_skill_generation_templates.sql`

**Step 1: Add prompts folder generator**

This template generates content for the prompts/ folder in a skill package.

```sql
-- Add to the same migration file
INSERT INTO prompt_templates (name, description, category, template_type, content, is_default, is_active)
VALUES (
  'Skill Prompts Generator',
  'Generates prompts/ folder content for Claude Code skills',
  'skill-generation',
  'skill-prompts',
  'You are a Claude Code Skill architect. Your task is to create prompt files for the prompts/ folder of a skill package.

# INPUT
You will receive:
1. **SKILL.md Content**: The main skill definition (already generated)
2. **Source Materials**: Original prompts and knowledge entries
3. **User Instructions**: Additional guidance

# OUTPUT FORMAT
Generate one or more .md files for the prompts/ folder. Each file should contain a specialized prompt that supports the main skill.

Structure each file as:

```markdown
# {Prompt Title}

## Purpose
{What this prompt accomplishes}

## Prompt Content

{The actual prompt text to be used}

## Usage Notes
{When to use this specific prompt}
```

# GENERATION PRINCIPLES

1. **Decompose Complexity**: If the skill handles multiple scenarios, create separate prompt files
2. **Reusable Components**: Prompts should be modular and reusable
3. **Clear Boundaries**: Each prompt file should have a single, clear purpose
4. **Inheritance**: Reference the main SKILL.md principles, don''t repeat them

# OUTPUT
Return a JSON object with file names as keys and content as values:
```json
{
  "core-prompt.md": "# Core Prompt\n...",
  "edge-case-handler.md": "# Edge Case Handler\n..."
}
```

Only create files that add value beyond the main SKILL.md.',
  TRUE,
  TRUE
);
```

**Step 2: Apply migration (if not combined)**

Run: `psql -h localhost -U ningli -d annotservice -f sql/migrations/015_skill_generation_templates.sql`
Expected: INSERT succeeds

**Step 3: Commit**

```bash
git add sql/migrations/015_skill_generation_templates.sql
git commit -m "feat: Add skill prompts generator template"
```

---

## Task 4: Create Skill Examples Generator Template

**Files:**
- Modify: `sql/migrations/015_skill_generation_templates.sql`

**Step 1: Add examples folder generator**

```sql
INSERT INTO prompt_templates (name, description, category, template_type, content, is_default, is_active)
VALUES (
  'Skill Examples Generator',
  'Generates examples/ folder content for Claude Code skills',
  'skill-generation',
  'skill-examples',
  'You are a Claude Code Skill architect. Your task is to create example files that demonstrate skill usage.

# INPUT
You will receive:
1. **SKILL.md Content**: The main skill definition
2. **Source Materials**: Original prompts and knowledge
3. **User Instructions**: Specific example scenarios to cover

# OUTPUT FORMAT
Generate example files showing input/output pairs. Each file demonstrates one usage scenario.

Structure each file as:

```markdown
# Example: {Scenario Title}

## Context
{Brief setup/background for this example}

## User Input
```
{What the user would say/ask}
```

## Expected Output
```
{What Claude should produce}
```

## Key Points
- {What this example demonstrates}
- {Common variations}
```

# GENERATION PRINCIPLES

1. **Realistic Scenarios**: Examples should reflect actual usage patterns
2. **Edge Cases**: Include at least one non-obvious example
3. **Graduated Complexity**: Start simple, then show advanced usage
4. **Explicit Expected Output**: Show exactly what good output looks like

# OUTPUT
Return JSON with file names and content:
```json
{
  "basic-usage.md": "# Example: Basic Usage\n...",
  "advanced-scenario.md": "# Example: Advanced Scenario\n..."
}
```',
  TRUE,
  TRUE
);
```

**Step 2: Apply and verify**

Run: `psql -h localhost -U ningli -d annotservice -f sql/migrations/015_skill_generation_templates.sql`

**Step 3: Commit**

```bash
git add sql/migrations/015_skill_generation_templates.sql
git commit -m "feat: Add skill examples generator template"
```

---

## Task 5: Create Skill Tests Generator Template

**Files:**
- Modify: `sql/migrations/015_skill_generation_templates.sql`

**Step 1: Add tests folder generator**

```sql
INSERT INTO prompt_templates (name, description, category, template_type, content, is_default, is_active)
VALUES (
  'Skill Tests Generator',
  'Generates tests/ folder content for Claude Code skills',
  'skill-generation',
  'skill-tests',
  'You are a Claude Code Skill architect. Your task is to create test scenarios that validate skill behavior.

# INPUT
You will receive:
1. **SKILL.md Content**: The main skill definition
2. **Examples**: Generated example files
3. **User Instructions**: Specific behaviors to test

# OUTPUT FORMAT
Generate test files that can validate the skill works correctly.

Structure each file as:

```markdown
# Test: {Test Name}

## Scenario
{What behavior is being tested}

## Setup
{Any required preconditions}

## Test Input
```
{Input to provide}
```

## Expected Behavior
- [ ] {Checkable outcome 1}
- [ ] {Checkable outcome 2}
- [ ] {Checkable outcome 3}

## Pass Criteria
{How to determine if the test passed}

## Failure Indicators
{Signs that something went wrong}
```

# GENERATION PRINCIPLES

1. **Behavior-Focused**: Test behaviors, not implementation details
2. **Boundary Conditions**: Test edge cases and limits
3. **Negative Tests**: Include "should NOT do X" tests
4. **Reproducible**: Tests should give consistent results

# OUTPUT
Return JSON with file names and content:
```json
{
  "core-behavior.md": "# Test: Core Behavior\n...",
  "edge-cases.md": "# Test: Edge Cases\n..."
}
```',
  TRUE,
  TRUE
);
```

**Step 2: Apply and verify**

**Step 3: Commit**

```bash
git add sql/migrations/015_skill_generation_templates.sql
git commit -m "feat: Add skill tests generator template"
```

---

## Task 6: Create MCP Prompt Generator Template

**Files:**
- Create: `sql/migrations/016_mcp_generation_templates.sql`

**Step 1: Write the MCP prompt generator**

```sql
-- Migration: Add mcp-generation templates
-- These templates guide AI to create MCP-compatible prompts

INSERT INTO prompt_templates (name, description, category, template_type, content, is_default, is_active)
VALUES (
  'MCP Prompt Generator',
  'Generates deployable MCP prompt content from knowledge and prompts',
  'mcp-generation',
  'mcp-prompt',
  'You are an MCP (Model Context Protocol) prompt architect. Your task is to create a deployable prompt that can be served via MCP endpoints.

# INPUT
You will receive:
1. **Source Prompts**: User-created prompts containing expert knowledge
2. **Source Knowledge**: Extracted knowledge entries with structured insights
3. **User Instructions**: Title, namespace, description, and additional guidance

# OUTPUT FORMAT
Generate a single, comprehensive prompt that will be served via MCP. The prompt should be:
- Self-contained (no external dependencies)
- Well-structured with clear sections
- Immediately usable by AI assistants

Structure:

```markdown
# {Title}

{Brief description of what this prompt enables}

## Role & Identity

{Define who the AI becomes when using this prompt}

## Core Capabilities

{List the key things this prompt enables}

## Instructions

{Detailed guidance derived from source materials}

### Primary Guidelines
{The most important rules}

### Process
{Step-by-step approach}

### Quality Standards
{How to evaluate outputs}

## Context

{Background information from knowledge entries}

## Examples

### Example 1
**Situation:** {Scenario}
**Approach:** {How to handle it}

### Example 2
**Situation:** {Scenario}
**Approach:** {How to handle it}

## Constraints

{What the AI should NOT do}
```

# GENERATION PRINCIPLES

1. **Standalone**: The prompt must work without additional context
2. **Action-Oriented**: Focus on what the AI should DO
3. **Grounded in Sources**: Base instructions on provided materials
4. **MCP-Compatible**: No special syntax or dependencies

# CRITICAL RULES

- Output ONLY the markdown prompt content
- Do NOT include JSON wrapping or explanations
- Ensure the prompt is immediately usable
- Keep it focused - one prompt should do one thing well',
  TRUE,
  TRUE
);
```

**Step 2: Apply migration**

Run: `psql -h localhost -U ningli -d annotservice -f sql/migrations/016_mcp_generation_templates.sql`
Expected: INSERT 0 1

**Step 3: Verify template**

Run: `psql -h localhost -U ningli -d annotservice -c "SELECT name, category FROM prompt_templates WHERE category = 'mcp-generation';"`
Expected: Shows "MCP Prompt Generator" row

**Step 4: Commit**

```bash
git add sql/migrations/016_mcp_generation_templates.sql
git commit -m "feat: Add MCP prompt generator template"
```

---

## Task 7: Update API to Support New Categories

**Files:**
- Modify: `src/app/api/prompt-templates/route.ts`

**Step 1: Read current API**

Read the current prompt-templates API to understand filtering logic.

**Step 2: Update category filtering (if needed)**

Ensure the API can filter by the new categories. The API should accept `?category=skill-generation` or `?category=mcp-generation`.

**Step 3: Test API**

Run: `curl "http://localhost:3000/api/prompt-templates?category=skill-generation"`
Expected: Returns templates with skill-generation category

**Step 4: Commit if changes made**

```bash
git add src/app/api/prompt-templates/route.ts
git commit -m "feat: Support skill-generation and mcp-generation categories in API"
```

---

## Task 8: Integration Test - Generate Sample Skill

**Files:**
- Create: `test-reports/phase2-generation-templates-test.md`

**Step 1: Test skill-md generator via API**

Use the OpenRouter integration to test template execution. Create a test that:
1. Fetches the skill-md generator template
2. Passes sample knowledge/prompts
3. Verifies output matches expected SKILL.md format

**Step 2: Document results**

Create test report with:
- Template used
- Input provided
- Output generated
- Pass/fail assessment

**Step 3: Commit test report**

```bash
git add test-reports/phase2-generation-templates-test.md
git commit -m "test: Add Phase 2 generation templates test report"
```

---

## Task 9: Update Master Plan

**Files:**
- Modify: `docs/plans/MASTER-PLAN-skills-mcp-export.md`

**Step 1: Mark Phase 2 complete**

Update the Phase Summary table and add session log entry.

**Step 2: Document commits**

Add commit hashes for Phase 2 work.

**Step 3: Update Next Actions**

Point to Phase 3: Skills Builder Wizard.

**Step 4: Commit**

```bash
git add docs/plans/MASTER-PLAN-skills-mcp-export.md
git commit -m "docs: Mark Phase 2 complete in master plan"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add new categories to DB | 014_skill_mcp_template_categories.sql |
| 2 | SKILL.md generator template | 015_skill_generation_templates.sql |
| 3 | Prompts folder generator | 015_skill_generation_templates.sql |
| 4 | Examples folder generator | 015_skill_generation_templates.sql |
| 5 | Tests folder generator | 015_skill_generation_templates.sql |
| 6 | MCP prompt generator | 016_mcp_generation_templates.sql |
| 7 | Update API for new categories | prompt-templates/route.ts |
| 8 | Integration test | test report |
| 9 | Update master plan | MASTER-PLAN doc |
