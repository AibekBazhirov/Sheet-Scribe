import { useTransactions } from "@/hooks/use-transactions";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter,
  Inbox
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function TransactionList() {
  const { data: transactions, isLoading, isError } = useTransactions();
  const [searchTerm, setSearchTerm] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted/50 rounded-lg w-1/4 animate-pulse"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-destructive/5 rounded-2xl border border-destructive/10">
        <h3 className="text-lg font-semibold text-destructive">Unable to load transactions</h3>
        <p className="text-muted-foreground mt-2">Could not connect to the transaction service.</p>
      </div>
    );
  }

  const filteredTransactions = transactions?.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recent Activity</h2>
          <p className="text-muted-foreground text-sm">Your financial history at a glance</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search transactions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background border-border/50 focus:border-primary shadow-sm"
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b border-border/50">
                <TableHead className="w-[180px]">Date</TableHead>
                <TableHead className="w-[200px]">Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Inbox className="h-12 w-12 mb-4 opacity-20" />
                      <p>No transactions found</p>
                      {searchTerm && <p className="text-sm">Try adjusting your search</p>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction, index) => {
                  const isPositive = parseFloat(transaction.amount) > 0 && transaction.category === 'Income';
                  
                  return (
                    <motion.tr 
                      key={transaction.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0"
                    >
                      <TableCell className="font-medium text-muted-foreground">
                        {format(new Date(transaction.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal bg-muted/50 hover:bg-muted">
                          {transaction.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground/90">
                        {transaction.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-mono font-medium flex items-center justify-end gap-1 ${
                          isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                        }`}>
                          {isPositive ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span>
                            {isPositive ? "+" : ""}
                            ${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                          </span>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
  );
}
