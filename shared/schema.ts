
import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  amount: text("amount").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  date: true,
  amount: true,
  description: true,
  category: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
