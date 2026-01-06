-- Migration: Add location column to annotations table
-- This stores human-readable location information like "Chapter 7, Section 1"

ALTER TABLE annotations
ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Also add a background_context column for AI-extracted context
-- This stores the background/context around the annotation
ALTER TABLE annotations
ADD COLUMN IF NOT EXISTS background_context TEXT;

-- Add comment explaining the columns
COMMENT ON COLUMN annotations.location IS 'Human-readable location in document (e.g., "Chapter 7, Section 1")';
COMMENT ON COLUMN annotations.background_context IS 'AI-extracted context/background around this annotation';
