import { useMutation } from "@tanstack/react-query";
import { listCustomersForExport } from "../../services/adminCustomers";
import { listOrdersForExport } from "../../services/adminOrders";
import { EXPORT_CAP } from "../components/customers/customerRules";
import { CUSTOMER_COLUMNS, ORDER_COLUMNS, downloadCsv, exportFileName, toCsv } from "../components/export/csv";

/** Builds the CSV and downloads it. Resolves to `{ count, capped }`. */
export function useExportOrders() {
  return useMutation({
    mutationFn: async (filters) => {
      const rows = await listOrdersForExport({ ...filters, cap: EXPORT_CAP });
      downloadCsv(exportFileName("orders"), toCsv(ORDER_COLUMNS, rows));
      return { count: rows.length, capped: rows.length >= EXPORT_CAP };
    },
  });
}

export function useExportCustomers() {
  return useMutation({
    mutationFn: async (filters) => {
      const rows = await listCustomersForExport(filters);
      downloadCsv(exportFileName("customers"), toCsv(CUSTOMER_COLUMNS, rows));
      return { count: rows.length, capped: rows.length >= EXPORT_CAP };
    },
  });
}
