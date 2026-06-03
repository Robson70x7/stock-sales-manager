-- ============================================================
-- Migration: Add cost/profit fields to sale_items
-- Version: 010
-- Date: 2026-06-02
-- Purpose: Add costAtSale, profitAmount, status columns
-- ============================================================

ALTER TABLE sale_items ADD COLUMN costAtSale REAL;
ALTER TABLE sale_items ADD COLUMN profitAmount REAL;
ALTER TABLE sale_items ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
