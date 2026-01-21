-- Migration: 015_skill_generation_templates.sql
-- Description: Add skill-generation templates for Claude Code skill package generation
-- Date: 2026-01-21

BEGIN;

-- 1. Skill MD Generator (generates SKILL.md file content)
INSERT INTO prompt_templates (
    name,
    description,
    content,
    template_type,
    category,
    is_default,
    is_active,
    created_by
) VALUES (
    'Skill MD Generator',
    'Generates SKILL.md file content following Claude Code skill format',
    '## INPUT

You will receive:
- **Skill Name**: The name for the skill (will be converted to kebab-case)
- **Skill Purpose**: What problem this skill solves
- **Knowledge Base**: Domain expertise and best practices extracted from annotations
- **Target Workflow**: When and how this skill should be triggered

## OUTPUT FORMAT

Generate a complete SKILL.md file with this exact structure:

```markdown
# [skill-name-in-kebab-case]

[One-line description of what this skill does]

## When to Use

[Bullet list of scenarios when this skill should be invoked]

## Description

[2-3 paragraphs explaining the skill''s purpose, approach, and value]

## Instructions

[Numbered list of steps the AI should follow when executing this skill]

## Examples

[2-3 usage examples showing trigger phrases and expected behavior]

## Configuration

[Optional configuration options if applicable]
```

## GENERATION PRINCIPLES

1. **Clarity**: Instructions must be unambiguous and actionable
2. **Completeness**: Cover all common use cases and edge cases
3. **Consistency**: Use consistent terminology throughout
4. **Practicality**: Focus on real-world applicability
5. **Specificity**: Avoid vague guidance; be concrete and precise

## CRITICAL RULES

- Skill name MUST be kebab-case (e.g., "code-review", "test-driven-development")
- Instructions MUST be imperative ("Do X", not "You should do X")
- Examples MUST show realistic trigger phrases users would actually say
- Do NOT include implementation details about how the skill system works
- Do NOT reference internal mechanisms or file structures
- Keep the total length under 500 lines
- Each instruction step should be independently actionable',
    'skill-md',
    'skill-generation',
    TRUE,
    TRUE,
    NULL
);

-- 2. Skill Prompts Generator (generates prompts/ folder content)
INSERT INTO prompt_templates (
    name,
    description,
    content,
    template_type,
    category,
    is_default,
    is_active,
    created_by
) VALUES (
    'Skill Prompts Generator',
    'Generates prompts/ folder content as JSON with filename keys and markdown content values',
    '## INPUT

You will receive:
- **Skill Definition**: The SKILL.md content or skill specification
- **Knowledge Base**: Domain expertise and detailed procedures
- **Prompt Categories**: Types of prompts needed (e.g., main, validation, error-handling)

## OUTPUT FORMAT

Return a JSON object where:
- Keys are filenames (without path, e.g., "main.md", "validation.md")
- Values are the complete markdown content for each prompt file

```json
{
  "main.md": "# Main Prompt\n\n[Content for the primary skill prompt...]\n\n## Context\n...",
  "validation.md": "# Validation Prompt\n\n[Content for validating outputs...]\n\n## Checks\n...",
  "error-handling.md": "# Error Handling\n\n[How to handle common errors...]\n\n## Recovery Steps\n..."
}
```

## GENERATION PRINCIPLES

1. **Modularity**: Each prompt file should handle one specific aspect
2. **Reusability**: Prompts should be composable and not duplicate content
3. **Context-Awareness**: Include necessary context without being verbose
4. **Error Resilience**: Always include guidance for handling failures
5. **Token Efficiency**: Be concise; avoid unnecessary preambles

## PROMPT FILE CONVENTIONS

- `main.md`: Primary execution prompt (required)
- `validation.md`: Output validation criteria (if needed)
- `refinement.md`: Iterative improvement guidance (if needed)
- `error-handling.md`: Error recovery procedures (if needed)
- `context-gathering.md`: How to collect required context (if needed)

## CRITICAL RULES

- Output MUST be valid JSON (escape special characters properly)
- Each prompt file MUST be self-contained (can be used independently)
- Do NOT include file paths in keys (just filenames)
- Do NOT nest JSON objects within the markdown content
- Markdown content should use proper escaping for JSON (\\n for newlines)
- Keep individual prompts under 200 lines each
- Always include main.md as the minimum required prompt',
    'skill-prompts',
    'skill-generation',
    TRUE,
    TRUE,
    NULL
);

-- 3. Skill Examples Generator (generates examples/ folder content)
INSERT INTO prompt_templates (
    name,
    description,
    content,
    template_type,
    category,
    is_default,
    is_active,
    created_by
) VALUES (
    'Skill Examples Generator',
    'Generates examples/ folder content as JSON with example scenarios',
    '## INPUT

You will receive:
- **Skill Definition**: The SKILL.md content or skill specification
- **Knowledge Base**: Real-world scenarios and use cases from annotations
- **Complexity Levels**: Range of examples needed (simple, intermediate, advanced)

## OUTPUT FORMAT

Return a JSON object where:
- Keys are example filenames (e.g., "01-basic-usage.md", "02-complex-scenario.md")
- Values are the complete markdown content showing the example

```json
{
  "01-basic-usage.md": "# Basic Usage Example\n\n## Scenario\n[Description of the situation]\n\n## User Request\n```\n[What the user says to trigger the skill]\n```\n\n## Expected Behavior\n[Step-by-step what should happen]\n\n## Expected Output\n[Sample output or result]",
  "02-edge-case.md": "# Edge Case: [Name]\n\n## Scenario\n...",
  "03-advanced-workflow.md": "# Advanced Workflow\n\n## Scenario\n..."
}
```

## GENERATION PRINCIPLES

1. **Progressive Complexity**: Start simple, build to complex
2. **Realistic Scenarios**: Use believable, practical situations
3. **Diverse Coverage**: Cover different use cases and edge cases
4. **Clear Expectations**: Make expected behavior unambiguous
5. **Teachable Moments**: Each example should teach something specific

## EXAMPLE STRUCTURE REQUIREMENTS

Each example file MUST include:
- **Scenario**: Context and setup (2-3 sentences)
- **User Request**: Exact trigger phrase or request
- **Expected Behavior**: What the skill should do (numbered steps)
- **Expected Output**: Sample result or outcome
- **Notes** (optional): Special considerations or variations

## CRITICAL RULES

- Output MUST be valid JSON
- Number examples with leading zeros (01-, 02-, 03-)
- Include at least 3 examples minimum
- Include at least 1 edge case or error scenario
- Do NOT use placeholder text like "[insert here]"
- Examples should be copy-paste testable
- Keep each example under 100 lines',
    'skill-examples',
    'skill-generation',
    TRUE,
    TRUE,
    NULL
);

-- 4. Skill Tests Generator (generates tests/ folder content)
INSERT INTO prompt_templates (
    name,
    description,
    content,
    template_type,
    category,
    is_default,
    is_active,
    created_by
) VALUES (
    'Skill Tests Generator',
    'Generates tests/ folder content as JSON with test scenarios for skill validation',
    '## INPUT

You will receive:
- **Skill Definition**: The SKILL.md content or skill specification
- **Examples**: The generated examples for reference
- **Quality Criteria**: What constitutes successful skill execution

## OUTPUT FORMAT

Return a JSON object where:
- Keys are test filenames (e.g., "test-basic.md", "test-edge-cases.md")
- Values are the complete markdown content with test specifications

```json
{
  "test-basic.md": "# Basic Functionality Tests\n\n## Test 1: [Name]\n\n### Input\n```\n[Test input]\n```\n\n### Expected Outcome\n[What should happen]\n\n### Pass Criteria\n- [ ] [Criterion 1]\n- [ ] [Criterion 2]\n\n### Failure Indicators\n- [What indicates failure]",
  "test-edge-cases.md": "# Edge Case Tests\n\n## Test 1: Empty Input\n...",
  "test-integration.md": "# Integration Tests\n\n## Test 1: With Other Skills\n..."
}
```

## GENERATION PRINCIPLES

1. **Comprehensive Coverage**: Test all documented behaviors
2. **Isolation**: Each test should verify one specific aspect
3. **Reproducibility**: Tests should produce consistent results
4. **Clear Criteria**: Pass/fail conditions must be unambiguous
5. **Failure Diagnosis**: Include indicators to identify what went wrong

## TEST CATEGORIES TO INCLUDE

- **Basic Functionality**: Core happy-path scenarios
- **Edge Cases**: Boundary conditions and unusual inputs
- **Error Handling**: How the skill handles invalid inputs
- **Integration**: How the skill works with other skills/tools
- **Performance** (optional): Response time or resource usage

## TEST STRUCTURE REQUIREMENTS

Each test MUST include:
- **Test Name**: Clear, descriptive name
- **Input**: Exact input to provide
- **Expected Outcome**: What should happen
- **Pass Criteria**: Checklist of verification points
- **Failure Indicators**: Signs that the test failed

## CRITICAL RULES

- Output MUST be valid JSON
- Include at least 5 tests minimum
- Include at least 2 edge case tests
- Include at least 1 error handling test
- Pass criteria MUST be objectively verifiable
- Do NOT include tests that require human judgment to evaluate
- Tests should be executable by an AI evaluator
- Keep each test file under 150 lines',
    'skill-tests',
    'skill-generation',
    TRUE,
    TRUE,
    NULL
);

COMMIT;

-- Verification query (run separately):
-- SELECT id, name, template_type, category, is_default, is_active
-- FROM prompt_templates
-- WHERE category = 'skill-generation'
-- ORDER BY template_type;
