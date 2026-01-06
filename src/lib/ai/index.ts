// AI module exports

export { chatCompletion, parseJsonResponse, getModels } from './openrouter';
export { extractKnowledge, refineAnnotation, type ExtractionInput, type ExtractionResult } from './extraction';
export { generateSystemPrompt, getTemplateInfo, PROMPT_TEMPLATES, type GenerationInput, type TemplateType } from './generation';
