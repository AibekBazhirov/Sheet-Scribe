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

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: [api.transactions.list.path],
    queryFn: async () => {
      const res = await fetch(api.transactions.list.path);
      if (!res.ok) {
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const form = useForm<InsertTransaction>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      date: "",
      amount: "",
      debit_id: "",
      credit_id: "",
      brand: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      const res = await apiRequest("POST", api.transactions.create.path, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Транзакция добавлена",
      });
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить транзакцию",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertTransaction) => {
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8" data-testid="heading-title">Продажи</h1>

        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6" data-testid="heading-form">Добавить транзакцию</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дата *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-date" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Сумма *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-amount" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="debit_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID дебета</FormLabel>
                      <FormControl>
                        <Input placeholder="Дебетовый счёт" {...field} value={field.value || ""} data-testid="input-debit" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="credit_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID кредита</FormLabel>
                      <FormControl>
                        <Input placeholder="Кредитовый счёт" {...field} value={field.value || ""} data-testid="input-credit" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Бренд</FormLabel>
                    <FormControl>
                      <Input placeholder="Название бренда" {...field} value={field.value || ""} data-testid="input-brand" />
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
                {createMutation.isPending ? "Добавление..." : "Добавить транзакцию"}
              </Button>
            </form>
          </Form>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4" data-testid="heading-transactions">Транзакции</h2>
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
                    <TableHead>Дата</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>ID дебета</TableHead>
                    <TableHead>ID кредита</TableHead>
                    <TableHead>Бренд</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.map((tx) => (
                    <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                      <TableCell data-testid={`text-id-${tx.id}`}>{tx.id}</TableCell>
                      <TableCell data-testid={`text-date-${tx.id}`}>{tx.date}</TableCell>
                      <TableCell data-testid={`text-amount-${tx.id}`}>{tx.amount}</TableCell>
                      <TableCell data-testid={`text-debit-${tx.id}`}>{tx.debit_id || "-"}</TableCell>
                      <TableCell data-testid={`text-credit-${tx.id}`}>{tx.credit_id || "-"}</TableCell>
                      <TableCell data-testid={`text-brand-${tx.id}`}>{tx.brand || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(!transactions || transactions.length === 0) && (
                <p className="text-center py-8 text-muted-foreground" data-testid="text-empty">
                  Транзакций пока нет. Добавьте первую запись.
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
