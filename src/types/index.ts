/**
 * ═══════════════════════════════════════════════════════════════════
 * TERMINOLOGY GLOSSARY - READ THIS FIRST TO AVOID CONFUSION
 * ═══════════════════════════════════════════════════════════════════
 *
 * This system has terminology that differs between UI and code for historical reasons.
 *
 * ## GENERATION GUIDE vs TEMPLATE
 *
 * **User-Facing Term (UI):** "Generation Guide"
 * **Code/Database Term:** PromptTemplate, prompt_templates table
 *
 * These refer to THE SAME THING:
 * - Guides that tell the AI HOW to generate system prompts
 * - Input to the generation process (not the output)
 * - Example: "Introduction Review Guide" contains rules for generating intro prompts
 *
 * WHY THE MISMATCH?
 * - Original database schema used "template" terminology
 * - Users found this confusing (Jan 2026)
 * - Changed UI to "Generation Guide" for clarity
 * - Kept code/database names to avoid breaking changes
 *
 * ## COMPLETE TERMINOLOGY MAP
 *
 * | UI Label | Code/DB Name | Table | What It Is |
 * |----------|--------------|-------|------------|
 * | Generation Guide | PromptTemplate | prompt_templates | Guide for generating prompts |
 * | System Prompt | SystemPrompt | system_prompts | Generated prompt (output) |
 * | Document | Document | documents | Annotated markdown files |
 * | Knowledge Entry | KnowledgeEntry | knowledge_entries | Extracted knowledge |
 * | Annotation | Annotation | annotations | [[MACRO/MESO/MICRO: ...]] markers |
 *
 * ## FOR FUTURE AI AGENTS & DEVELOPERS
 *
 * When you see "template" in code:
 * 1. It likely refers to a "Generation Guide"
 * 2. Check if it's in prompt_templates table → definitely a guide
 * 3. Check if it's about "generation" → definitely a guide
 * 4. Check UI labels in the same file → they'll say "guide"
 *
 * When writing new code:
 * 1. UI labels: Use "generation guide" or "guide"
 * 2. Variables: Use existing "template" names for consistency
 * 3. Comments: Explain the mismatch if it could confuse
 *
 * See /docs/GLOSSARY.md for full terminology reference.
 * See CLAUDE.md for project-specific context.
 *
 * ═══════════════════════════════════════════════════════════════════
 */

// Type definitions for Expert Note

// Annotation level type
export type AnnotationLevel = 'MACRO' | 'MESO' | 'MICRO';

// Annotation color configuration
export interface AnnotationColors {
  bg: string;
  text: string;
  border: string;
}

// Annotation level configuration
export interface LevelConfig {
  label: string;
  shortcut: string;
  icon: string;
  description: string;
  prefix: string;
}

// Color configurations for each annotation level
export const ANNOTATION_COLORS: Record<AnnotationLevel, AnnotationColors> = {
  MACRO: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  MESO: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
  MICRO: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
};

// Configuration for each annotation level
export const LEVEL_CONFIG: Record<AnnotationLevel, LevelConfig> = {
  MACRO: {
    label: 'Macro',
    shortcut: 'Cmd+1',
    icon: '🔴',
    description: 'High-level themes, main arguments, or overarching concepts',
    prefix: '[MACRO]',
  },
  MESO: {
    label: 'Meso',
    shortcut: 'Cmd+2',
    icon: '🟡',
    description: 'Supporting ideas, evidence, or intermediate-level insights',
    prefix: '[MESO]',
  },
  MICRO: {
    label: 'Micro',
    shortcut: 'Cmd+3',
    icon: '🟢',
    description: 'Specific details, quotes, or granular observations',
    prefix: '[MICRO]',
  },
};

// User roles in the system
export type UserRole = 'super_admin' | 'owner' | 'member' | 'individual';

export interface User {
  userId: number;
  username: string;
  displayName: string;
  phone: string | null;
  orgId: number | null;
  role: UserRole;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
}

// Organization type
export interface Organization {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Organization with metadata (for admin UI)
export interface OrganizationWithMeta extends Organization {
  ownerCodeUsed: boolean;
  memberCount: number;
}

// Invitation code types
export type InvitationCodeType = 'individual' | 'org_owner' | 'org_member';

export interface InvitationCode {
  id: number;
  code: string;
  type: InvitationCodeType;
  orgId: number | null;       // For org_member/org_owner: existing org to join
  createdBy: number | null;
  usedBy: number | null;
  usedAt: Date | null;
  createdAt: Date;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface AnnotationCounts {
  macro: number;
  meso: number;
  micro: number;
}

// Creator info for documents
export interface CreatorInfo {
  id: number;
  username: string;
  displayName: string | null;
  orgId: number | null;
}

export interface Document {
  id: string;
  filename: string;
  content: string;
  status: 'raw' | 'annotated' | 'refined';
  createdBy: number | null;
  updatedBy: number | null;
  creator: CreatorInfo | null;
  isShared: boolean;
  allowEdit: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
  annotationCounts: AnnotationCounts;
}

export interface Annotation {
  id: number;
  documentId: string;
  level: 'MACRO' | 'MESO' | 'MICRO';
  content: string;
  positionLine: number;
  positionChar: number;
  rawText: string;
  createdBy: number | null;
  createdAt: Date;
}

export interface ParsedAnnotation {
  level: 'MACRO' | 'MESO' | 'MICRO';
  content: string;
  line: number;
  char: number;
  rawText: string;
}

export interface SessionUser {
  userId: number;
  username: string;
  displayName: string;
  orgId: number | null;
  role: UserRole;
}

// Session type for auth module
export interface Session {
  userId: number;
  username: string;
  displayName: string | null;
  orgId: number | null;
  role: UserRole;
}

// Knowledge Entry type - matches database schema
// A knowledge entry contains a background/context and multiple annotations
export interface KnowledgeEntry {
  id: string;
  sourceDocumentId: string | null;
  background: string | null;
  createdBy: number | null;
  isShared: boolean;
  allowEdit: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
  annotationCount: number;
  sourceDocumentName?: string;
  creator?: CreatorInfo | null;
}

// Knowledge Annotation type - individual annotations within a knowledge entry
export interface KnowledgeAnnotation {
  id: string;
  knowledgeId: string;
  level: AnnotationLevel;
  originalText: string;       // Original verbatim annotation text from the document
  comment: string;            // The annotation content (may be same as originalText)
  refinedComment: string | null;  // AI-refined version that preserves meaning but is clearer
  location: string | null;    // Human-readable location (e.g., "Chapter 7, Section 1")
  backgroundContext: string | null; // AI-extracted context around this annotation
  positionLine: number | null;
  positionChar: number | null;
  createdAt: Date;
}

// Extraction result from AI in Markdown format
export interface MarkdownExtractionItem {
  level: AnnotationLevel;
  location: string;
  background: string;         // Context surrounding the annotation
  originalComment: string;    // Verbatim annotation text
  refinedComment: string;     // AI-improved version
}

// Knowledge Entry with annotations included
export interface KnowledgeEntryWithAnnotations extends KnowledgeEntry {
  annotations: KnowledgeAnnotation[];
}

// Legacy Knowledge Entry format for AI generation
// Used by prompt generation to create flat annotation-level entries
export interface KnowledgeEntryFlat {
  id: number;
  userId: number;
  originalContent: string;
  refinedContent: string | null;
  level: AnnotationLevel;
  isUniversal: boolean;
  tags: string[];
  sourceDocumentId: string | null;
  sourceAnnotationId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Template types for system prompts (now dynamically defined by users in Settings)
// Legacy type kept for backward compatibility - new templates are user-defined strings
export type TemplateType = string;

// System Prompt type for AI prompt generation
export interface SystemPrompt {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  content: string;
  templateType: string | null;
  sourceKnowledgeIds: string[];
  sourceDocumentIds: string[];  // Direct document references (bypass knowledge extraction)
  basePromptId: string | null;  // Reference to base prompt for versioning chain
  version: number;
  isShared: boolean;
  allowEdit: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];  // Tags for filtering and organization
  creator?: CreatorInfo | null;
}

// Version history entry for system prompts
export interface PromptVersion {
  id: number;
  promptId: string;
  version: number;
  content: string;
  createdAt: Date;
}

// Generation Guide (user-facing term) / Prompt Template (code term) for extraction/generation
export type PromptTemplateCategory = 'extraction' | 'generation';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string | null;
  category: PromptTemplateCategory;
  templateType: string | null;
  content: string;
  isDefault: boolean;
  isActive: boolean;
  createdBy: number | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
