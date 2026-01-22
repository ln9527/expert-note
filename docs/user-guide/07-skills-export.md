# Skills Export Guide

This guide explains how to create and export Skills packages for use with Claude Code.

---

## What are Skills?

Skills are packaged AI prompts that can be installed in Claude Code. They bundle your expert knowledge into reusable components with prompts, examples, and tests.

When you export a Skill, you get a downloadable ZIP package containing:
- **SKILL.md** - Overview and usage instructions
- **prompts/** - Prompt templates
- **examples/** - Example inputs and outputs
- **tests/** - Validation scenarios

---

## Building a Skill

### Step 1: Navigate to Skills Builder

1. Click **Skills** in the main navigation
2. Click **Build Skill** button

This opens the Skills Builder wizard, which guides you through four steps:
- Sources
- Instructions
- Preview
- Build

### Step 2: Select Sources

Choose the prompts and knowledge entries to include in your skill:

**Prompts Tab**
- Browse your existing prompts
- Click to select prompts you want to include
- Selected prompts appear with a checkmark

**Knowledge Tab**
- Browse your knowledge entries
- Select entries to synthesize into the skill
- Multiple entries can be combined

**Tip**: Select at least one prompt or knowledge entry to proceed.

### Step 3: Enter Instructions

Provide details about your skill:

| Field | Description | Required |
|-------|-------------|----------|
| **Title** | Name your skill (e.g., "Code Review Expert") | Yes |
| **Description** | Brief description of what the skill does | No |
| **Instructions** | Additional guidance for the AI generation | Yes |

The Instructions field is particularly important - it tells the AI how to structure and present your knowledge in the skill package.

### Step 4: Review Generated Content

After clicking **Next**, the AI generates a skill package plan. You'll see a preview of:

- The generated content structure
- File names and their purposes
- A preview panel on the right showing the content

Review the generated content carefully before proceeding.

### Step 5: Build and Download

1. Click **Next** to build the skill
2. Wait for the build process to complete
3. Click **Download** to get your ZIP package

---

## Installing in Claude Code

After downloading your skill:

1. Extract the ZIP file to a local directory
2. In Claude Code, reference the skill using:
   ```
   /skill path/to/your-skill
   ```

---

## Skill Package Structure

```
my-skill/
+-- SKILL.md           # Overview, when to use, instructions
+-- prompts/           # Prompt templates
|   +-- main.md
+-- examples/          # Example inputs/outputs
|   +-- 01-basic.md
+-- tests/             # Validation scenarios
    +-- core.md
```

### File Descriptions

| File | Purpose |
|------|---------|
| `SKILL.md` | Main documentation describing the skill, when to use it, and how |
| `prompts/*.md` | Prompt templates that define the AI behavior |
| `examples/*.md` | Sample inputs and expected outputs for reference |
| `tests/*.md` | Validation scenarios to verify the skill works correctly |

---

## Managing Skills

### Viewing Your Skills

Navigate to **Skills** to see all your created skills. Each skill shows:
- Title and description
- Creation date
- Source references

### Editing a Skill

1. Click on a skill to open its details
2. Click **Edit** to modify the skill
3. Update fields as needed
4. Save your changes

### Deleting a Skill

1. Open the skill details
2. Click **Delete**
3. Confirm the deletion

**Note**: Deleting a skill moves it to trash first, allowing recovery if needed.

---

## Tips for Effective Skills

1. **Choose related prompts and knowledge** - Combining related content creates more coherent skills

2. **Provide clear instructions** - Detailed instructions produce better AI-generated content

3. **Review before downloading** - Always check the preview to ensure quality

4. **Test the skill in Claude Code** - Verify functionality before sharing with others

5. **Use descriptive titles** - Makes skills easier to find and understand

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check that you have selected at least one source and provided both title and instructions |
| Download doesn't start | Check browser popup blockers; the download opens in a new window |
| Skill doesn't work in Claude Code | Verify the path is correct and the ZIP was properly extracted |

---

**Next**: [MCP Endpoints Guide](./08-mcp-endpoints.md) - Learn how to deploy prompts as API endpoints
