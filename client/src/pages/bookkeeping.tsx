import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { api } from "@shared/routes";
import { insertTransactionSchema, type InsertTransaction, type Transaction } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Bookkeeping() {
  const { toast } = useToast();

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: [api.transactions.list.path],
    queryFn: async () => {
      const res = await fetch(api.transactions.list.path);
      return res.json();
    },
  });

  const form = useForm<InsertTransaction>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      date: "",
      amount: "",
      month: "",
      debit_id: "",
      credit_id: "",
      quantity: "",
      curr: "",
      worker_id: "",
      counterparty_id: "",
      division_id: "",
      store_id: "",
      sales_type: "",
      brand: "",
      model: "",
      serial_number: "",
      db_account_id: "",
      cr_account_id: "",
      description: "",
      accrued_for: "",
      created_by: "",
      party_number: "",
      status: "",
      rec_price: "",
      discount: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const res = await apiRequest("POST", api.transactions.create.path, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add transaction",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTransaction) => {
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8" data-testid="heading-title">Bookkeeping</h1>

        {/* Form */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6" data-testid="heading-form">Add Transaction</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-date" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., January 2024" {...field} data-testid="input-month" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-amount" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Accounts */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="debit_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Debit ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Debit account" {...field} data-testid="input-debit" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="credit_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Credit account" {...field} data-testid="input-credit" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="db_account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DB Account ID</FormLabel>
                      <FormControl>
                        <Input placeholder="DB account" {...field} data-testid="input-db-account" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cr_account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CR Account ID</FormLabel>
                      <FormControl>
                        <Input placeholder="CR account" {...field} data-testid="input-cr-account" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input placeholder="Brand name" {...field} data-testid="input-brand" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="Model number" {...field} data-testid="input-model" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serial_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Serial number" {...field} data-testid="input-serial" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Organization Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="worker_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Worker ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Worker ID" {...field} data-testid="input-worker" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="counterparty_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Counterparty ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Counterparty ID" {...field} data-testid="input-counterparty" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="party_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Party Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Party number" {...field} data-testid="input-party" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Division & Store */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="division_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Division ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Division ID" {...field} data-testid="input-division" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="store_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Store ID" {...field} data-testid="input-store" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sales_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Sales type" {...field} data-testid="input-sales-type" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Pricing & Quantity */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0" {...field} data-testid="input-quantity" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rec_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recommended Price</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-rec-price" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-discount" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="curr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input placeholder="USD" {...field} data-testid="input-curr" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Status & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., active, pending" {...field} data-testid="input-status" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="created_by"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Created By</FormLabel>
                      <FormControl>
                        <Input placeholder="User name" {...field} data-testid="input-created-by" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="accrued_for"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accrued For</FormLabel>
                      <FormControl>
                        <Input placeholder="Accrued period" {...field} data-testid="input-accrued" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Transaction description" {...field} data-testid="input-description" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={createMutation.isPending} 
                className="w-full md:w-auto"
                data-testid="button-submit"
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {createMutation.isPending ? "Adding..." : "Add Transaction"}
              </Button>
            </form>
          </Form>
        </Card>

        {/* Transactions Table */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4" data-testid="heading-transactions">Transactions</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Store</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.map((tx) => (
                    <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                      <TableCell data-testid={`text-id-${tx.id}`}>{tx.id}</TableCell>
                      <TableCell data-testid={`text-date-${tx.id}`}>{tx.date}</TableCell>
                      <TableCell data-testid={`text-amount-${tx.id}`}>{tx.amount}</TableCell>
                      <TableCell data-testid={`text-curr-${tx.id}`}>{tx.curr || "-"}</TableCell>
                      <TableCell data-testid={`text-description-${tx.id}`}>{tx.description || "-"}</TableCell>
                      <TableCell data-testid={`text-status-${tx.id}`}>{tx.status || "-"}</TableCell>
                      <TableCell data-testid={`text-brand-${tx.id}`}>{tx.brand || "-"}</TableCell>
                      <TableCell data-testid={`text-model-${tx.id}`}>{tx.model || "-"}</TableCell>
                      <TableCell data-testid={`text-worker-${tx.id}`}>{tx.worker_id || "-"}</TableCell>
                      <TableCell data-testid={`text-store-${tx.id}`}>{tx.store_id || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(!transactions || transactions.length === 0) && (
                <p className="text-center py-8 text-muted-foreground" data-testid="text-empty">
                  No transactions yet. Add one to get started.
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
