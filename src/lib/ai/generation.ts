// System prompt generation agent

import { chatCompletion } from './openrouter';
import { KnowledgeEntryWithAnnotations, KnowledgeAnnotation, AnnotationLevel } from '@/types';
import { getDefaultTemplate } from '@/lib/db/queries/promptTemplates';

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
  templateName?: string;
  templateBaseInstructions?: string;
  knowledgeEntries: KnowledgeEntryWithAnnotations[];
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
 * Get the system prompt for generation
 * PRIORITY:
 * 1. Use provided template content (from API route) if available
 * 2. Load from database using templateType
 * 3. Fallback to hardcoded default
 *
 * This ensures alignment between API route template selection and generation logic
 */
async function getGenerationSystemPrompt(
  templateType?: string,
  providedTemplateContent?: string
): Promise<string> {
  // PRIORITY 1: Use provided template content (from API route)
  if (providedTemplateContent?.trim()) {
    console.log('[Generation] ✓ Using template content provided by API route');
    return providedTemplateContent;
  }

  // PRIORITY 2: Try to load from database
  let systemPrompt = GENERATION_SYSTEM_PROMPT; // Fallback

  try {
    const template = await getDefaultTemplate('generation', templateType || undefined);
    if (template?.content) {
      systemPrompt = template.content;
      console.log(`[Generation] ✓ Using database template (type: ${templateType || 'default'}, name: ${template.name})`);
    } else {
      console.log('[Generation] ⚠ No database template found, using hardcoded default');
    }
  } catch (error) {
    console.warn('[Generation] ⚠ Failed to load template from database, using hardcoded default:', error);
  }

  return systemPrompt;
}

/**
 * Generate a system prompt from knowledge entries
 */
export async function generateSystemPrompt(input: GenerationInput): Promise<string> {
  const {
    purpose,
    templateType,
    templateName,
    templateBaseInstructions,
    knowledgeEntries,
    documentBackgrounds,
    customInstructions,
  } = input;

  // Extract all annotations from knowledge entries and group by level
  const allAnnotations: KnowledgeAnnotation[] = knowledgeEntries.flatMap(
    entry => entry.annotations || []
  );

  const groupByLevel = (level: AnnotationLevel): KnowledgeAnnotation[] =>
    allAnnotations.filter(a => a.level === level);

  const macroAnnotations = groupByLevel('MACRO');
  const mesoAnnotations = groupByLevel('MESO');
  const microAnnotations = groupByLevel('MICRO');

  // Use provided template info, or fall back to hardcoded templates for backward compatibility
  const hardcodedTemplate = PROMPT_TEMPLATES[templateType as TemplateType];
  const displayName = templateName || hardcodedTemplate?.name || templateType || 'Custom';
  const baseInstructions = templateBaseInstructions || hardcodedTemplate?.baseInstructions || '';

  // Format annotation content (prefer refined comment over original comment)
  const formatAnnotation = (a: KnowledgeAnnotation): string =>
    a.refinedComment || a.comment || a.originalText;

  const userPrompt = `Generate a System Prompt for the following purpose:

**Purpose**: ${purpose}
**Template Type**: ${displayName}
${baseInstructions ? `**Template Focus**: ${baseInstructions}` : ''}
${customInstructions ? `**Additional Instructions**: ${customInstructions}` : ''}

**Knowledge Base** (${allAnnotations.length} total annotations from ${knowledgeEntries.length} entries):

MACRO-LEVEL PRINCIPLES (${macroAnnotations.length} annotations):
${macroAnnotations.map(a => `• ${formatAnnotation(a)}`).join('\n') || '(none)'}

MESO-LEVEL PATTERNS (${mesoAnnotations.length} annotations):
${mesoAnnotations.map(a => `• ${formatAnnotation(a)}`).join('\n') || '(none)'}

MICRO-LEVEL TECHNIQUES (${microAnnotations.length} annotations):
${microAnnotations.map(a => `• ${formatAnnotation(a)}`).join('\n') || '(none)'}

${documentBackgrounds?.length ? `
**Source Document Context**:
${documentBackgrounds.map((bg, i) => `${i + 1}. ${bg}`).join('\n')}
` : ''}

Generate a comprehensive, well-structured System Prompt based on this expert knowledge.`;

  // Get system prompt
  // CRITICAL: Pass templateBaseInstructions to ensure we use the same template
  // that the API route loaded (aligns template selection logic)
  const systemPrompt = await getGenerationSystemPrompt(
    templateType,
    templateBaseInstructions // Use template content from API route if provided
  );

  console.log('[Generation] System prompt details:', {
    source: templateBaseInstructions ? 'API route template' : 'Database/hardcoded',
    length: systemPrompt.length,
    templateType,
  });

  const response = await chatCompletion(
    [
      { role: 'system', content: systemPrompt },
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
