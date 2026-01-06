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

export interface User {
  userId: number;
  username: string;
  displayName: string;
  isActive: boolean;
  lastLogin: Date | null;
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

export interface Document {
  id: string;
  filename: string;
  content: string;
  status: 'raw' | 'annotated' | 'refined';
  createdBy: number | null;
  updatedBy: number | null;
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
}

// Session type for auth module
export interface Session {
  userId: number;
  username: string;
  displayName: string | null;
}

// Knowledge Entry type for AI processing
export interface KnowledgeEntry {
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

// Template types for system prompts
export type TemplateType = 'introduction' | 'methodology' | 'discussion' | 'academicCoach' | 'custom';

// System Prompt type for AI prompt generation
export interface SystemPrompt {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  content: string;
  templateType: string | null;
  sourceKnowledgeIds: string[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// Version history entry for system prompts
export interface PromptVersion {
  id: number;
  promptId: string;
  version: number;
  content: string;
  createdAt: Date;
}
