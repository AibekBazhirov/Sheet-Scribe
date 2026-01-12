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
    await sheet.loadHeaderRow();
    const headers = ['id', 'date', 'amount', 'debit_id', 'credit_id', 'brand', 'created_at', 'updated_at'];
    if (sheet.headerValues.length === 0) {
      await sheet.setHeaderRow(headers);
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
        created_at: row.get('created_at') ? new Date(row.get('created_at')) : new Date(),
        updated_at: row.get('updated_at') ? new Date(row.get('updated_at')) : new Date(),
      })) as Transaction[];
    } catch (error) {
      console.error("Error fetching transactions from Google Sheets:", error);
      // Return empty array for credential/auth errors so the app still works
      return [];
    }
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
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
        created_at: new Date(),
        updated_at: new Date(),
      };
    } catch (error) {
      console.error("Error creating transaction in Google Sheets:", error);
      throw error;
    }
  }
}

export class MemStorage implements IStorage {
    private transactions: Transaction[] = [];
    private idCounter = 1;
  
    async getTransactions(): Promise<Transaction[]> {
      return this.transactions;
    }
  
    async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
      const now = new Date();
      const transaction: Transaction = {
        id: this.idCounter++,
        date: insertTransaction.date,
        amount: insertTransaction.amount,
        debit_id: insertTransaction.debit_id || null,
        credit_id: insertTransaction.credit_id || null,
        brand: insertTransaction.brand || null,
        created_at: now,
        updated_at: now,
      };
      this.transactions.push(transaction);
      return transaction;
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
