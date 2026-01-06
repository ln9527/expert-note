-- Migration 001: Add prompt_templates table
-- Run this after the initial schema if updating an existing database
-- Or it's already included in the updated schema.sql for fresh installs

-- Check if table exists before creating
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'prompt_templates') THEN
        -- Create the prompt_templates table
        CREATE TABLE prompt_templates (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(50) NOT NULL CHECK (category IN ('extraction', 'generation')),
            template_type VARCHAR(50),
            content TEXT NOT NULL,
            is_default BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            version INTEGER DEFAULT 1,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes
        CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
        CREATE INDEX idx_prompt_templates_is_default ON prompt_templates(is_default);

        -- Create update trigger
        CREATE TRIGGER update_prompt_templates_updated_at
            BEFORE UPDATE ON prompt_templates
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();

        RAISE NOTICE 'Created prompt_templates table';
    ELSE
        RAISE NOTICE 'prompt_templates table already exists, skipping creation';
    END IF;
END $$;

-- Insert default templates if they don't exist
INSERT INTO prompt_templates (name, description, category, template_type, content, is_default, is_active)
SELECT * FROM (VALUES
(
    'Default Knowledge Extraction',
    'Standard template for extracting knowledge from expert annotations',
    'extraction',
    NULL::VARCHAR(50),
    'You are a knowledge extraction specialist. Your task is to transform expert annotations from documents into structured, reusable knowledge entries.

For each annotation, you will:
1. Preserve the original meaning and intent
2. Remove context-specific dependencies (names, specific examples that are too narrow)
3. Generalize the insight into a reusable principle
4. Classify whether the knowledge is universal (applies broadly) or situational (applies to specific contexts)
5. Optimize the language for clarity while maintaining the expert''s voice

Output a JSON array with one object per annotation:
[
  {
    "original": "the original annotation text",
    "refined": "the refined, generalized version",
    "isUniversal": true or false,
    "reasoning": "brief explanation of refinement decisions"
  }
]

Guidelines by level:
- MACRO: Extract high-level, transferable principles. Remove specific domain references where possible.
- MESO: Identify pattern-level guidance. Generalize the structure while preserving the insight.
- MICRO: Convert specific edits to generalizable suggestions. Keep actionable but broaden applicability.

IMPORTANT: Return ONLY valid JSON, no additional text.',
    TRUE,
    TRUE
),
(
    'Default Prompt Generation',
    'Standard template for generating system prompts from knowledge entries',
    'generation',
    NULL::VARCHAR(50),
    'You are a System Prompt architect specializing in creating AI instructions based on expert knowledge.

Your task is to synthesize knowledge entries into effective System Prompts that capture expert judgment patterns.

Structure your prompts with:
1. **Role Definition**: Clear statement of the AI''s role
2. **Core Principles**: High-level guidelines from MACRO knowledge
3. **Patterns & Approaches**: Pattern-level guidance from MESO knowledge
4. **Specific Techniques**: Actionable suggestions from MICRO knowledge
5. **Examples**: Where helpful, include brief examples

Guidelines:
- Prioritize MACRO knowledge as overarching principles
- Use MESO knowledge as pattern-level guidance
- Include relevant MICRO knowledge as specific techniques
- Maintain the expert''s voice and judgment style
- Make prompts actionable and clear
- Keep the prompt focused and not overly long

Output a ready-to-use System Prompt in markdown format.',
    TRUE,
    TRUE
),
(
    'Introduction Review Template',
    'Specialized template for reviewing paper introductions',
    'generation',
    'introduction',
    'You are a System Prompt architect specializing in academic writing review.

Focus on creating prompts for introduction sections that emphasize:
1. **Research Importance**: How to establish why the research matters
2. **Gap Identification**: Clear articulation of research gaps
3. **Contribution Clarity**: Explicit statement of contributions
4. **Flow & Structure**: Logical progression from context to specific focus

Output a ready-to-use System Prompt optimized for introduction review.',
    FALSE,
    TRUE
),
(
    'Methodology Review Template',
    'Specialized template for reviewing research methodology sections',
    'generation',
    'methodology',
    'You are a System Prompt architect specializing in research methodology review.

Focus on creating prompts for methodology sections that emphasize:
1. **Method Clarity**: Clear explanation of research methods
2. **Reproducibility**: Sufficient detail for replication
3. **Justification**: Why specific methods were chosen
4. **Alignment**: Methods match research questions

Output a ready-to-use System Prompt optimized for methodology review.',
    FALSE,
    TRUE
),
(
    'Discussion Review Template',
    'Specialized template for reviewing discussion sections',
    'generation',
    'discussion',
    'You are a System Prompt architect specializing in research discussion review.

Focus on creating prompts for discussion sections that emphasize:
1. **Interpretation Depth**: Meaningful analysis of results
2. **Limitations**: Honest acknowledgment of constraints
3. **Implications**: Practical and theoretical significance
4. **Future Directions**: Suggestions for further research

Output a ready-to-use System Prompt optimized for discussion review.',
    FALSE,
    TRUE
),
(
    'Academic Writing Coach Template',
    'General template for comprehensive academic writing guidance',
    'generation',
    'academicCoach',
    'You are a System Prompt architect creating comprehensive academic writing coaches.

Create prompts that provide holistic guidance across:
1. **Structure**: Overall paper organization
2. **Argumentation**: Logic and flow of arguments
3. **Clarity**: Writing style and readability
4. **Academic Conventions**: Citations, terminology, tone

Output a ready-to-use System Prompt for an academic writing coach.',
    FALSE,
    TRUE
)
) AS t(name, description, category, template_type, content, is_default, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_templates WHERE name = t.name
);
