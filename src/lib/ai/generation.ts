// System prompt generation agent

import { chatCompletion } from './openrouter';
import { KnowledgeEntry, AnnotationLevel } from '@/types';

const GENERATION_SYSTEM_PROMPT = `You are a System Prompt architect specializing in creating AI instructions based on expert knowledge.

Your task is to synthesize knowledge entries into effective System Prompts that capture expert judgment patterns.

Structure your prompts with:
1. **Role Definition**: Clear statement of the AI's role
2. **Core Principles**: High-level guidelines from MACRO knowledge
3. **Patterns & Approaches**: Pattern-level guidance from MESO knowledge
4. **Specific Techniques**: Actionable suggestions from MICRO knowledge
5. **Examples**: Where helpful, include brief examples

Guidelines:
- Prioritize MACRO knowledge as overarching principles
- Use MESO knowledge as pattern-level guidance
- Include relevant MICRO knowledge as specific techniques
- Maintain the expert's voice and judgment style
- Make prompts actionable and clear
- Keep the prompt focused and not overly long

Output a ready-to-use System Prompt in markdown format.`;

export interface GenerationInput {
  purpose: string;
  templateType: string;
  knowledgeEntries: KnowledgeEntry[];
  documentBackgrounds?: string[];
  customInstructions?: string;
}

/**
 * Pre-defined templates for paper writing domain
 */
export const PROMPT_TEMPLATES = {
  introduction: {
    name: 'Introduction Review',
    description: 'Review and improve paper introductions',
    baseInstructions: 'Focus on establishing research importance, identifying gaps, and articulating contributions clearly.',
  },
  methodology: {
    name: 'Methodology Review',
    description: 'Review research methodology sections',
    baseInstructions: 'Focus on method clarity, reproducibility, and alignment with research questions.',
  },
  discussion: {
    name: 'Discussion Review',
    description: 'Review discussion and interpretation sections',
    baseInstructions: 'Focus on interpretation depth, limitations acknowledgment, and implications.',
  },
  academicCoach: {
    name: 'Academic Writing Coach',
    description: 'General academic writing improvement',
    baseInstructions: 'Provide comprehensive writing guidance across all aspects of academic papers.',
  },
  custom: {
    name: 'Custom Prompt',
    description: 'Create a custom system prompt',
    baseInstructions: '',
  },
} as const;

export type TemplateType = keyof typeof PROMPT_TEMPLATES;

/**
 * Generate a system prompt from knowledge entries
 */
export async function generateSystemPrompt(input: GenerationInput): Promise<string> {
  const { purpose, templateType, knowledgeEntries, documentBackgrounds, customInstructions } = input;

  // Group knowledge by level
  const groupByLevel = (level: AnnotationLevel) =>
    knowledgeEntries.filter(k => k.level === level);

  const macroEntries = groupByLevel('MACRO');
  const mesoEntries = groupByLevel('MESO');
  const microEntries = groupByLevel('MICRO');

  // Get template base instructions
  const template = PROMPT_TEMPLATES[templateType as TemplateType] || PROMPT_TEMPLATES.custom;

  const userPrompt = `Generate a System Prompt for the following purpose:

**Purpose**: ${purpose}
**Template Type**: ${template.name}
${template.baseInstructions ? `**Template Focus**: ${template.baseInstructions}` : ''}
${customInstructions ? `**Additional Instructions**: ${customInstructions}` : ''}

**Knowledge Base** (${knowledgeEntries.length} total entries):

MACRO-LEVEL PRINCIPLES (${macroEntries.length} entries):
${macroEntries.map(k => `• ${k.refinedContent || k.originalContent}`).join('\n') || '(none)'}

MESO-LEVEL PATTERNS (${mesoEntries.length} entries):
${mesoEntries.map(k => `• ${k.refinedContent || k.originalContent}`).join('\n') || '(none)'}

MICRO-LEVEL TECHNIQUES (${microEntries.length} entries):
${microEntries.map(k => `• ${k.refinedContent || k.originalContent}`).join('\n') || '(none)'}

${documentBackgrounds?.length ? `
**Source Document Context**:
${documentBackgrounds.map((bg, i) => `${i + 1}. ${bg}`).join('\n')}
` : ''}

Generate a comprehensive, well-structured System Prompt based on this expert knowledge.`;

  const response = await chatCompletion(
    [
      { role: 'system', content: GENERATION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.7, maxTokens: 3000 }
  );

  return response;
}

/**
 * Get template info for UI
 */
export function getTemplateInfo() {
  return Object.entries(PROMPT_TEMPLATES).map(([key, value]) => ({
    id: key,
    ...value,
  }));
}
