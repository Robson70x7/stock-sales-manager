-- ============================================================
-- Migration: Add type to installments
-- Version: 011
-- Date: 2026-06-02
-- Purpose: Add type column ('normal' | 'entry') for compatibility with desktop
-- ============================================================

ALTER TABLE installments ADD COLUMN type TEXT NOT NULL DEFAULT 'normal';
