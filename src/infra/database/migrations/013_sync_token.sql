-- ============================================================
-- Migration: Add syncToken to active_session
-- Version: 013
-- Date: 2026-06-05
-- Purpose: Store WebSocket JWT token in session for reauthentication
-- ============================================================

ALTER TABLE active_session ADD COLUMN syncToken TEXT;
