-- Expert Note System - Seed Data
-- Run after schema.sql

-- 10 Hardcoded Users for MVP
-- Password: "password123" for all users (bcrypt hash)
-- Hash generated with: bcrypt.hashSync('password123', 10)
INSERT INTO users (username, password_hash, display_name) VALUES
  ('admin', '$2b$10$nKSHx8ybouym2En4D.aBj.ZC6zqzchUOpsyp6G0fo56nSIdR6tJDC', 'Administrator'),
  ('ning', '$2b$10$nKSHx8ybouym2En4D.aBj.ZC6zqzchUOpsyp6G0fo56nSIdR6tJDC', 'Ning Li'),
  ('expert1', '$2b$10$nKSHx8ybouym2En4D.aBj.ZC6zqzchUOpsyp6G0fo56nSIdR6tJDC', 'Expert One'),
  ('expert2', '$2b$10$nKSHx8ybouym2En4D.aBj.ZC6zqzchUOpsyp6G0fo56nSIdR6tJDC', 'Expert Two'),
  ('student1', '$2b$10$nKSHx8ybouym2En4D.aBj.ZC6zqzchUOpsyp6G0fo56nSIdR6tJDC', 'Student One'),
  ('student2', '$2b$10$nKSHx8ybouym2En4D.aBj.ZC6zqzchUOpsyp6G0fo56nSIdR6tJDC', 'Student Two'),
  ('student3', '$2b$10$nKSHx8ybouym2En4D.aBj.ZC6zqzchUOpsyp6G0fo56nSIdR6tJDC', 'Student Three'),
  ('researcher1', '$2b$10$nKSHx8ybouym2En4D.aBj.ZC6zqzchUOpsyp6G0fo56nSIdR6tJDC', 'Researcher One'),
  ('researcher2', '$2b$10$nKSHx8ybouym2En4D.aBj.ZC6zqzchUOpsyp6G0fo56nSIdR6tJDC', 'Researcher Two'),
  ('guest', '$2b$10$nKSHx8ybouym2En4D.aBj.ZC6zqzchUOpsyp6G0fo56nSIdR6tJDC', 'Guest User');

-- Default Tags for Academic Writing Domain
INSERT INTO tags (name, color) VALUES
  ('introduction', '#EF4444'),      -- Red
  ('literature-review', '#F97316'),  -- Orange
  ('methodology', '#EAB308'),        -- Yellow
  ('results', '#22C55E'),            -- Green
  ('discussion', '#06B6D4'),         -- Cyan
  ('conclusion', '#3B82F6'),         -- Blue
  ('abstract', '#8B5CF6'),           -- Violet
  ('references', '#EC4899'),         -- Pink
  ('academic-writing', '#6B7280'),   -- Gray
  ('AI-research', '#14B8A6');        -- Teal
