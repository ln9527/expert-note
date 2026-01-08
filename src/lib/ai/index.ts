// AI module exports

export { chatCompletion, parseJsonResponse, parseMarkdownExtractionResponse, getModels } from './openrouter';
export { extractKnowledge, type ExtractionInput, type ExtractionResult, type ExtractionResponse } from './extraction';
export { generateSystemPrompt, getTemplateInfo, PROMPT_TEMPLATES, type GenerationInput, type TemplateType } from './generation';
