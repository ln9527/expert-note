-- Migration: 016_fix_skill_md_template_yaml.sql
-- Description: Update skill-md template to include YAML frontmatter and remove code fence wrapper
-- Date: 2026-01-24

BEGIN;

-- Update the Skill MD Generator template to:
-- 1. Include YAML frontmatter (required by Claude Code skills)
-- 2. Remove the code fence wrapper from the output format example
-- 3. Clarify that output should be raw markdown, not wrapped in code fences
UPDATE prompt_templates
SET content = '## INPUT

You will receive:
- **Skill Name**: The name for the skill (will be converted to kebab-case)
- **Skill Purpose**: What problem this skill solves
- **Knowledge Base**: Domain expertise and best practices extracted from annotations
- **Target Workflow**: When and how this skill should be triggered

## OUTPUT FORMAT

Generate a complete SKILL.md file with YAML frontmatter and markdown content.
Do NOT wrap the output in code fences - output raw markdown directly.

The file MUST start with YAML frontmatter:

---
name: [skill-name-in-kebab-case]
description: "[One-line description of what this skill does]"
---

# [Skill Title]

## Overview

[Brief description of the skill''s purpose and approach]

## When to Use

[Bullet list of scenarios when this skill should be invoked]
- Scenario 1
- Scenario 2
- Scenario 3

## Description

[2-3 paragraphs explaining the skill''s purpose, approach, and value]

## Instructions

[Numbered list of steps the AI should follow when executing this skill]
1. First step
2. Second step
3. Third step

## Examples

[2-3 usage examples showing trigger phrases and expected behavior]

**Example 1: [Scenario Name]**
User: "[What the user says]"
Expected: [What should happen]

## Configuration

[Optional configuration options if applicable]

## GENERATION PRINCIPLES

1. **Clarity**: Instructions must be unambiguous and actionable
2. **Completeness**: Cover all common use cases and edge cases
3. **Consistency**: Use consistent terminology throughout
4. **Practicality**: Focus on real-world applicability
5. **Specificity**: Avoid vague guidance; be concrete and precise

## CRITICAL RULES

- Output MUST start with YAML frontmatter (--- name: ... description: ... ---)
- Do NOT wrap output in code fences (no ```markdown or ``` around content)
- Skill name MUST be kebab-case (e.g., "code-review", "test-driven-development")
- Description in frontmatter must be a quoted string on one line
- Instructions MUST be imperative ("Do X", not "You should do X")
- Examples MUST show realistic trigger phrases users would actually say
- Do NOT include implementation details about how the skill system works
- Do NOT reference internal mechanisms or file structures
- Keep the total length under 500 lines
- Each instruction step should be independently actionable'
WHERE template_type = 'skill-md' AND category = 'skill-generation';

COMMIT;

-- Verification query (run separately):
-- SELECT id, name, template_type,
--        SUBSTRING(content, 1, 200) as content_preview
-- FROM prompt_templates
-- WHERE template_type = 'skill-md' AND category = 'skill-generation';
