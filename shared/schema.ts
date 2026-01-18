import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  display_name: text("display_name").notNull(),
  role: text("role").notNull().default("manager"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertTransactionSchema = z.object({
  date: z.string().min(1),
  amount: z.string().min(1),
  debit_id: z.string().optional(),
  credit_id: z.string().optional(),
  brand: z.string().optional(),
  bank_account: z.string().optional(),
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Transaction = {
  id: number;
  date: string;
  amount: string;
  debit_id: string | null;
  credit_id: string | null;
  brand: string | null;
  bank_account: string | null;
  created_by_user_id: number | null;
  created_by_name: string | null;
  created_at: Date;
  updated_at: Date;
};

export type Company = {
  id: number;
  name: string;
};

export type BankAccount = {
  id: number;
  name: string;
};

export const loginSchema = z.object({
  username: z.string().min(1, "Введите логин"),
  password: z.string().min(1, "Введите пароль"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  username: z.string().min(1, "Введите логин"),
  password: z.string().min(4, "Пароль должен быть минимум 4 символа"),
  display_name: z.string().min(1, "Введите имя"),
  role: z.enum(["admin", "manager"]).default("manager"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  username: z.string().min(1).optional(),
  password: z.string().min(4).optional(),
  display_name: z.string().min(1).optional(),
  role: z.enum(["admin", "manager"]).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export type UserPublic = Omit<User, 'password_hash'>;
