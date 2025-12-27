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
    await sheet.loadHeaderRow();
    const headers = ['id', 'month', 'date', 'debit_id', 'credit_id', 'quantity', 'amount', 'curr', 'worker_id', 'counterparty_id', 'division_id', 'store_id', 'sales_type', 'brand', 'model', 'serial_number', 'db_account_id', 'cr_account_id', 'description', 'created_at', 'accrued_for', 'created_by', 'updated_at', 'party_number', 'status', 'rec_price', 'discount'];
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
        month: row.get('month') || null,
        date: row.get('date'),
        debit_id: row.get('debit_id') || null,
        credit_id: row.get('credit_id') || null,
        quantity: row.get('quantity') || null,
        amount: row.get('amount'),
        curr: row.get('curr') || null,
        worker_id: row.get('worker_id') || null,
        counterparty_id: row.get('counterparty_id') || null,
        division_id: row.get('division_id') || null,
        store_id: row.get('store_id') || null,
        sales_type: row.get('sales_type') || null,
        brand: row.get('brand') || null,
        model: row.get('model') || null,
        serial_number: row.get('serial_number') || null,
        db_account_id: row.get('db_account_id') || null,
        cr_account_id: row.get('cr_account_id') || null,
        description: row.get('description') || null,
        created_at: row.get('created_at') ? new Date(row.get('created_at')) : new Date(),
        accrued_for: row.get('accrued_for') || null,
        created_by: row.get('created_by') || null,
        updated_at: row.get('updated_at') ? new Date(row.get('updated_at')) : new Date(),
        party_number: row.get('party_number') || null,
        status: row.get('status') || null,
        rec_price: row.get('rec_price') || null,
        discount: row.get('discount') || null,
      })) as Transaction[];
    } catch (error) {
      console.error("Error fetching transactions from Google Sheets:", error);
      if (error instanceof Error && error.message.includes("Missing Google Sheets credentials")) {
        return []; 
      }
      throw error;
    }
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    try {
      const sheet = await this.getSheet();
      const rows = await sheet.getRows();
      const newId = rows.length + 1;
      
      const rowData = {
        id: newId,
        month: transaction.month || '',
        date: transaction.date,
        debit_id: transaction.debit_id || '',
        credit_id: transaction.credit_id || '',
        quantity: transaction.quantity || '',
        amount: transaction.amount,
        curr: transaction.curr || '',
        worker_id: transaction.worker_id || '',
        counterparty_id: transaction.counterparty_id || '',
        division_id: transaction.division_id || '',
        store_id: transaction.store_id || '',
        sales_type: transaction.sales_type || '',
        brand: transaction.brand || '',
        model: transaction.model || '',
        serial_number: transaction.serial_number || '',
        db_account_id: transaction.db_account_id || '',
        cr_account_id: transaction.cr_account_id || '',
        description: transaction.description || '',
        created_at: new Date().toISOString(),
        accrued_for: transaction.accrued_for || '',
        created_by: transaction.created_by || '',
        updated_at: new Date().toISOString(),
        party_number: transaction.party_number || '',
        status: transaction.status || '',
        rec_price: transaction.rec_price || '',
        discount: transaction.discount || '',
      };

      await sheet.addRow(rowData);

      return {
        ...transaction,
        id: newId,
        created_at: new Date(),
        updated_at: new Date(),
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
      const now = new Date();
      const transaction: Transaction = {
        ...insertTransaction,
        id: this.idCounter++,
        created_at: now,
        updated_at: now,
      };
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
