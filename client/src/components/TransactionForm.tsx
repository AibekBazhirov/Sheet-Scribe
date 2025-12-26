import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema } from "@shared/schema";
import { useCreateTransaction } from "@/hooks/use-transactions";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, DollarSign, Calendar, Tag, FileText } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Housing",
  "Utilities",
  "Entertainment",
  "Health",
  "Shopping",
  "Income",
  "Other"
];

export function TransactionForm() {
  const { toast } = useToast();
  const createTransaction = useCreateTransaction();
  
  const form = useForm({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: "",
      description: "",
      category: "Food & Dining",
    },
  });

  const onSubmit = (data: any) => {
    createTransaction.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Transaction added",
          description: "Your transaction has been recorded successfully.",
        });
        form.reset({
          date: new Date().toISOString().split('T')[0],
          amount: "",
          description: "",
          category: "Food & Dining",
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      },
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card rounded-2xl p-6 shadow-sm border border-border/50"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">New Transaction</h2>
        <p className="text-muted-foreground text-sm">Enter the details of your expense or income.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="date" className="pl-9 h-11 bg-muted/30 border-transparent focus:border-primary focus:bg-background transition-all" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="0.00" 
                        className="pl-9 h-11 font-mono bg-muted/30 border-transparent focus:border-primary focus:bg-background transition-all" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 bg-muted/30 border-transparent focus:border-primary focus:bg-background transition-all">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Select category" />
                        </div>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="What was this for?" 
                        className="pl-9 h-11 bg-muted/30 border-transparent focus:border-primary focus:bg-background transition-all" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              disabled={createTransaction.isPending}
            >
              {createTransaction.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Add Transaction
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
