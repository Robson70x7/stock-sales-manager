-- ============================================================
-- Migration: Add cancel fields to sales
-- Version: 015
-- Date: 2026-06-08
-- Purpose: Add refundAmount and returnProductsWithClient columns
--          for sale cancellation flow with desktop sync
-- ============================================================

ALTER TABLE sales ADD COLUMN refundAmount REAL;
ALTER TABLE sales ADD COLUMN returnProductsWithClient INTEGER;
