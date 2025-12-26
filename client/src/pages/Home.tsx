import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { Wallet } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with gradient background */}
      <div className="w-full h-64 bg-gradient-to-br from-primary/10 via-primary/5 to-background absolute top-0 left-0 z-0" />
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
        <header className="mb-12 pt-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <Wallet className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Ledger.io</h1>
            <p className="text-muted-foreground">Smart bookkeeping for your daily life</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-8">
              <TransactionForm />
            </div>
          </div>
          
          <div className="lg:col-span-7">
            <TransactionList />
          </div>
        </div>
      </div>
    </div>
  );
}
