-- ============================================================
-- Migration: Add entryPaymentType to sales
-- Version: 005
-- Date: 2026-05-08
-- ============================================================

ALTER TABLE sales ADD COLUMN entryPaymentType TEXT;
