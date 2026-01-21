-- Migration: 016_mcp_generation_templates.sql
-- Description: Add MCP prompt generator template for generating deployable MCP prompt content
-- Date: 2026-01-21

BEGIN;

-- MCP Prompt Generator (generates deployable MCP prompt content)
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
    'MCP Prompt Generator',
    'Generates deployable MCP (Model Context Protocol) prompt content as self-contained markdown',
    '## INPUT

You will receive:
- **Source Prompts**: Existing prompts and instructions to incorporate
- **Knowledge Base**: Domain expertise, best practices, and contextual information extracted from annotations
- **User Instructions**: Specific requirements or customizations for the MCP prompt
- **Target Use Case**: The scenario or workflow this MCP prompt will support

## OUTPUT FORMAT

Generate a complete, self-contained markdown document with this exact structure:

```markdown
# [Prompt Title]

[One-line description of what this MCP prompt enables]

## Role & Identity

[Define the AI''s role, expertise level, and persona for this prompt]
- Primary role and responsibilities
- Domain expertise areas
- Tone and communication style

## Core Capabilities

[List the specific capabilities this prompt enables]
- Capability 1: [Description]
- Capability 2: [Description]
- Capability 3: [Description]

## Instructions

[Numbered list of clear, actionable instructions the AI should follow]

1. [First instruction with specific guidance]
2. [Second instruction with specific guidance]
3. [Continue as needed...]

## Context

[Relevant background information and domain knowledge]

### Domain Knowledge
[Key concepts, terminology, and expertise areas]

### Constraints & Boundaries
[What the AI should and should not do]

## Examples

### Example 1: [Scenario Name]
**User Input:** [Sample user request]
**Expected Response:** [How the AI should respond]

### Example 2: [Scenario Name]
**User Input:** [Sample user request]
**Expected Response:** [How the AI should respond]

## Output Guidelines

[Specify format, structure, and quality expectations for responses]
- Response format requirements
- Quality standards
- Length guidelines
```

## GENERATION PRINCIPLES

1. **Standalone**: The generated prompt must be fully self-contained and immediately usable without external dependencies
2. **Action-Oriented**: Instructions must be imperative and directly actionable
3. **Grounded in Sources**: All guidance must be derived from the provided prompts and knowledge base
4. **MCP-Compatible**: Output must follow MCP prompt conventions and be deployable via MCP endpoints
5. **Specific & Concrete**: Avoid vague or generic instructions; be precise about expected behaviors
6. **Context-Rich**: Include sufficient domain knowledge for the AI to perform effectively

## QUALITY CRITERIA

- Clear role definition that establishes expertise and boundaries
- Actionable instructions that leave no ambiguity
- Relevant examples that demonstrate expected behavior
- Appropriate constraints that prevent misuse
- Professional tone suitable for production deployment

## CRITICAL RULES

- Output ONLY the markdown content - no JSON wrapping, no code blocks around the entire output
- The output must be immediately usable as an MCP prompt without any post-processing
- Do NOT include meta-commentary about the generation process
- Do NOT include placeholder text like "[insert here]" or "[TODO]"
- Do NOT reference the source materials or generation process in the output
- Keep total length under 800 lines for optimal MCP performance
- Use proper markdown formatting throughout
- Escape special characters appropriately for markdown
- Every section must contain substantive content derived from the inputs',
    'mcp-prompt',
    'mcp-generation',
    TRUE,
    TRUE,
    NULL
);

COMMIT;

-- Verification query (run separately):
-- SELECT id, name, template_type, category, is_default, is_active
-- FROM prompt_templates
-- WHERE category = 'mcp-generation'
-- ORDER BY template_type;
