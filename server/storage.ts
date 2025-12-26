
import { type Transaction, type InsertTransaction } from "@shared/schema";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

export interface IStorage {
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
}

export class GoogleSheetsStorage implements IStorage {
  private doc: GoogleSpreadsheet | null = null;
  private sheetId: string;
  private serviceAccountEmail: string;
  private privateKey: string;

  constructor() {
    this.sheetId = process.env.GOOGLE_SHEET_ID || "";
    this.serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "";
    this.privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
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
    // Ensure header row
    await sheet.loadHeaderRow();
    if (sheet.headerValues.length === 0) {
        await sheet.setHeaderRow(['id', 'date', 'amount', 'description', 'category']);
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
        description: row.get('description'),
        category: row.get('category'),
      }));
    } catch (error) {
      console.error("Error fetching transactions from Google Sheets:", error);
      // Fallback or rethrow depending on desired behavior. 
      // For now returning empty array if config is missing to avoid crashing app loop if user hasn't set env vars yet
      if (error instanceof Error && error.message.includes("Missing Google Sheets credentials")) {
        return []; 
      }
      throw error;
    }
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    try {
      const sheet = await this.getSheet();
      const newId = (await sheet.getRows()).length + 1;
      
      const rowData = {
        id: newId,
        date: transaction.date,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category
      };

      await sheet.addRow(rowData);

      return {
        ...rowData,
        id: newId
      };
    } catch (error) {
      console.error("Error creating transaction in Google Sheets:", error);
      throw error;
    }
  }
}

// Fallback to in-memory storage if credentials aren't set, to allow app to start
export class MemStorage implements IStorage {
    private transactions: Transaction[] = [];
    private idCounter = 1;
  
    async getTransactions(): Promise<Transaction[]> {
      return this.transactions;
    }
  
    async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
      const transaction: Transaction = { ...insertTransaction, id: this.idCounter++ };
      this.transactions.push(transaction);
      return transaction;
    }
}

// Export a factory that chooses the right storage
function createStorage(): IStorage {
    if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        console.log("Using Google Sheets Storage");
        return new GoogleSheetsStorage();
    }
    console.log("Using Memory Storage (Google Sheets credentials missing)");
    return new MemStorage();
}

export const storage = createStorage();
