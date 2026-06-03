-- ============================================================
-- Migration: Add sync columns to sales table
-- Version: 006
-- Date: 2026-06-02
-- Purpose: Add syncStatus, syncError, syncWarnings columns for sale ingestion sync
-- ============================================================

ALTER TABLE sales ADD COLUMN syncStatus TEXT DEFAULT 'pending';
ALTER TABLE sales ADD COLUMN syncError TEXT;
ALTER TABLE sales ADD COLUMN syncWarnings TEXT;
