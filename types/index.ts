// ============================================================
// Tipos principais do aplicativo VendaFácil Mobile
// Usa tipos do shared que incluem tagIds, sku, minStock, supplier
// ============================================================

// Exports explícitos dos tipos do shared
export type { PaymentType, SaleStatus, InstallmentStatus } from "../shared/types";
export type { Tag } from "../shared/types";
export type { Product } from "../shared/types";
export type { Client } from "../shared/types";
export type { SaleItem } from "../shared/types";
export type { InstallmentHistory } from "../shared/types";
export type { Installment } from "../shared/types";
export type { Sale } from "../shared/types";
export type { MonthSummary } from "../shared/types";
export type { SummaryItem } from "../shared/types";
export type { SaleFilters } from "../shared/types";
export type { ReportData } from "../shared/types";

// Configurações do app
export interface AppSettings {
  askReturnStockOnDelete: boolean;
}
