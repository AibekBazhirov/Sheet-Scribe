import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  month: text("month"),
  date: text("date").notNull(),
  debit_id: text("debit_id"),
  credit_id: text("credit_id"),
  quantity: text("quantity"),
  amount: text("amount").notNull(),
  curr: text("curr"),
  worker_id: text("worker_id"),
  counterparty_id: text("counterparty_id"),
  division_id: text("division_id"),
  store_id: text("store_id"),
  sales_type: text("sales_type"),
  brand: text("brand"),
  model: text("model"),
  serial_number: text("serial_number"),
  db_account_id: text("db_account_id"),
  cr_account_id: text("cr_account_id"),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
  accrued_for: text("accrued_for"),
  created_by: text("created_by"),
  updated_at: timestamp("updated_at").defaultNow(),
  party_number: text("party_number"),
  status: text("status"),
  rec_price: text("rec_price"),
  discount: text("discount"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
