import { type Transaction, type InsertTransaction, type Company, type User, type UserPublic, users } from "@shared/schema";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { db } from "./db";
import { eq, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction, userId?: number, userName?: string): Promise<Transaction>;
  getCompanies(): Promise<Company[]>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserById(id: number): Promise<User | null>;
  createUser(username: string, password: string, displayName: string, role?: string): Promise<User>;
  updateUser(id: number, data: { username?: string; password?: string; display_name?: string; role?: string }): Promise<UserPublic | null>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(): Promise<UserPublic[]>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
}

export class GoogleSheetsStorage implements IStorage {
  private doc: GoogleSpreadsheet | null = null;
  private sheetId: string;
  private serviceAccountEmail: string;
  private privateKey: string;

  constructor() {
    this.sheetId = process.env.GOOGLE_SHEET_ID || "";
    this.serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
    // Handle various private key formats
    let key = process.env.GOOGLE_PRIVATE_KEY || "";
    // Replace literal \n with actual newlines
    key = key.replace(/\\n/g, "\n");
    // If the key is JSON-escaped, unescape it
    if (key.startsWith('"') && key.endsWith('"')) {
      try {
        key = JSON.parse(key);
      } catch (e) {
        // If parsing fails, use as-is
      }
    }
    this.privateKey = key;
  }

  private async getDoc() {
    if (this.doc) return this.doc;

    if (!this.sheetId || !this.serviceAccountEmail || !this.privateKey) {
      throw new Error("Missing Google Sheets credentials. Please check your environment variables.");
    }

    const serviceAccountAuth = new JWT({
      email: this.serviceAccountEmail,
      key: this.privateKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    const doc = new GoogleSpreadsheet(this.sheetId, serviceAccountAuth);
    await doc.loadInfo();
    this.doc = doc;
    return doc;
  }

  private async getSheet() {
    const doc = await this.getDoc();
    const sheet = doc.sheetsByIndex[0];
    const headers = ['id', 'date', 'amount', 'debit_id', 'credit_id', 'brand', 'created_by_user_id', 'created_by_name', 'created_at', 'updated_at'];
    
    try {
      await sheet.loadHeaderRow();
      if (!sheet.headerValues || sheet.headerValues.length === 0) {
        await sheet.setHeaderRow(headers);
      }
    } catch (error) {
      await sheet.setHeaderRow(headers);
      await sheet.loadHeaderRow();
    }
    return sheet;
  }

  async getTransactions(): Promise<Transaction[]> {
    try {
      const sheet = await this.getSheet();
      const rows = await sheet.getRows();
      return rows.map((row, index) => ({
        id: parseInt(row.get('id')) || index + 1,
        date: row.get('date'),
        amount: row.get('amount'),
        debit_id: row.get('debit_id') || null,
        credit_id: row.get('credit_id') || null,
        brand: row.get('brand') || null,
        created_by_user_id: row.get('created_by_user_id') ? parseInt(row.get('created_by_user_id')) : null,
        created_by_name: row.get('created_by_name') || null,
        created_at: row.get('created_at') ? new Date(row.get('created_at')) : new Date(),
        updated_at: row.get('updated_at') ? new Date(row.get('updated_at')) : new Date(),
      })) as Transaction[];
    } catch (error) {
      console.error("Error fetching transactions from Google Sheets:", error);
      return [];
    }
  }

  async createTransaction(transaction: InsertTransaction, userId?: number, userName?: string): Promise<Transaction> {
    try {
      const sheet = await this.getSheet();
      const rows = await sheet.getRows();
      const newId = rows.length + 1;
      
      const rowData = {
        id: newId,
        date: transaction.date,
        amount: transaction.amount,
        debit_id: transaction.debit_id || '',
        credit_id: transaction.credit_id || '',
        brand: transaction.brand || '',
        created_by_user_id: userId?.toString() || '',
        created_by_name: userName || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await sheet.addRow(rowData);

      return {
        id: newId,
        date: transaction.date,
        amount: transaction.amount,
        debit_id: transaction.debit_id || null,
        credit_id: transaction.credit_id || null,
        brand: transaction.brand || null,
        created_by_user_id: userId || null,
        created_by_name: userName || null,
        created_at: new Date(),
        updated_at: new Date(),
      };
    } catch (error) {
      console.error("Error creating transaction in Google Sheets:", error);
      throw error;
    }
  }

  private async getSheetByTitle(title: string) {
    const doc = await this.getDoc();
    const sheet = doc.sheetsByTitle[title];
    if (!sheet) {
      console.warn(`Sheet "${title}" not found in spreadsheet`);
      return null;
    }
    try {
      await sheet.loadHeaderRow();
    } catch (error) {
      console.warn(`Could not load header row for sheet "${title}":`, error);
      return null;
    }
    return sheet;
  }

  async getCompanies(): Promise<Company[]> {
    try {
      const sheet = await this.getSheetByTitle("Company");
      if (!sheet) {
        return [];
      }
      const rows = await sheet.getRows();
      return rows.map((row, index) => {
        const name = row.get('ID_Company') || row.get('name') || row.get('Name') || row.get('company') || '';
        return {
          id: index + 1,
          name: name.toString().trim(),
        };
      }).filter(c => c.name);
    } catch (error) {
      console.error("Error fetching companies from Google Sheets:", error);
      return [];
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0] || null;
  }

  async getUserById(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  }

  async createUser(username: string, password: string, displayName: string, role: string = "manager"): Promise<User> {
    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.insert(users).values({
      username,
      password_hash,
      display_name: displayName,
      role,
    }).returning();
    return result[0];
  }

  async updateUser(id: number, data: { username?: string; password?: string; display_name?: string; role?: string }): Promise<UserPublic | null> {
    const updateData: Partial<{ username: string; password_hash: string; display_name: string; role: string }> = {};
    if (data.username) updateData.username = data.username;
    if (data.display_name) updateData.display_name = data.display_name;
    if (data.role) updateData.role = data.role;
    if (data.password) updateData.password_hash = await bcrypt.hash(data.password, 10);
    
    if (Object.keys(updateData).length === 0) return null;
    
    const result = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    if (!result[0]) return null;
    const { password_hash, ...userPublic } = result[0];
    return userPublic;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async listUsers(): Promise<UserPublic[]> {
    const result = await db.select({
      id: users.id,
      username: users.username,
      display_name: users.display_name,
      role: users.role,
      created_at: users.created_at,
    }).from(users);
    return result;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

export class MemStorage implements IStorage {
    private transactions: Transaction[] = [];
    private memUsers: User[] = [];
    private idCounter = 1;
    private userIdCounter = 1;
  
    async getTransactions(): Promise<Transaction[]> {
      return this.transactions;
    }
  
    async createTransaction(insertTransaction: InsertTransaction, userId?: number, userName?: string): Promise<Transaction> {
      const now = new Date();
      const transaction: Transaction = {
        id: this.idCounter++,
        date: insertTransaction.date,
        amount: insertTransaction.amount,
        debit_id: insertTransaction.debit_id || null,
        credit_id: insertTransaction.credit_id || null,
        brand: insertTransaction.brand || null,
        created_by_user_id: userId || null,
        created_by_name: userName || null,
        created_at: now,
        updated_at: now,
      };
      this.transactions.push(transaction);
      return transaction;
    }

    async getCompanies(): Promise<Company[]> {
      return [
        { id: 1, name: "Noutshop" },
        { id: 2, name: "Onepoint" },
      ];
    }

    async getUserByUsername(username: string): Promise<User | null> {
      return this.memUsers.find(u => u.username === username) || null;
    }

    async getUserById(id: number): Promise<User | null> {
      return this.memUsers.find(u => u.id === id) || null;
    }

    async createUser(username: string, password: string, displayName: string, role: string = "manager"): Promise<User> {
      const password_hash = await bcrypt.hash(password, 10);
      const user: User = {
        id: this.userIdCounter++,
        username,
        password_hash,
        display_name: displayName,
        role,
        created_at: new Date(),
      };
      this.memUsers.push(user);
      return user;
    }

    async updateUser(id: number, data: { username?: string; password?: string; display_name?: string; role?: string }): Promise<UserPublic | null> {
      const user = this.memUsers.find(u => u.id === id);
      if (!user) return null;
      if (data.username) user.username = data.username;
      if (data.display_name) user.display_name = data.display_name;
      if (data.role) user.role = data.role;
      if (data.password) user.password_hash = await bcrypt.hash(data.password, 10);
      const { password_hash, ...userPublic } = user;
      return userPublic;
    }

    async deleteUser(id: number): Promise<boolean> {
      const index = this.memUsers.findIndex(u => u.id === id);
      if (index === -1) return false;
      this.memUsers.splice(index, 1);
      return true;
    }

    async listUsers(): Promise<UserPublic[]> {
      return this.memUsers.map(({ password_hash, ...rest }) => rest);
    }

    async verifyPassword(password: string, hash: string): Promise<boolean> {
      return bcrypt.compare(password, hash);
    }
}

function createStorage(): IStorage {
    if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        console.log("Using Google Sheets Storage");
        return new GoogleSheetsStorage();
    }
    console.log("Using Memory Storage (Google Sheets credentials missing)");
    return new MemStorage();
}

export const storage = createStorage();
