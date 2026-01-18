import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@shared/routes";
import { insertTransactionSchema, type InsertTransaction, type Transaction, type Company, type BankAccount } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Laptop, LogOut, User, Settings } from "lucide-react";

const transactionTypes = [
  "Продажи",
  "Приход",
  "Расход",
  "Кассовые операции",
  "Погашение долга",
];

const menuItems = [
  { name: "Операции", id: "operations" },
  { name: "Аналитика", id: "analytics" },
  { name: "Долги", id: "debts" },
  { name: "Склад", id: "warehouse" },
];

export default function Bookkeeping() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedType, setSelectedType] = useState(transactionTypes[0]);
  const [activeMenu, setActiveMenu] = useState(menuItems[0].id);
  const [selectedCompany, setSelectedCompany] = useState<string>("");

  const { data: user } = useQuery<{ id: number; display_name: string; role: string } | null>({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", api.auth.logout.path, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      setLocation("/login");
    },
  });

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: [api.companies.list.path],
    queryFn: async () => {
      const res = await fetch(api.companies.list.path);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: [api.bankAccounts.list.path],
    queryFn: async () => {
      const res = await fetch(api.bankAccounts.list.path);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

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

  const today = new Date().toISOString().split('T')[0];
  
  const form = useForm<InsertTransaction>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: {
      date: today,
      amount: "",
      brand: "",
      bank_account: "",
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

  const onSubmit = async (data: InsertTransaction) => {
    await createMutation.mutateAsync({
      ...data,
      debit_id: "1210",
      credit_id: "6010",
    });
    createMutation.mutate({
      ...data,
      debit_id: "7010",
      credit_id: "1310",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-orange-500 text-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-1.5">
              <Laptop className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-wide" data-testid="text-app-title">
              Учетная система Ноутшоп
            </span>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm">
                <User className="h-4 w-4" />
                <span data-testid="text-user-name">{user.display_name}</span>
              </div>
              {user.role === "admin" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation("/admin")}
                  className="text-white hover:bg-white/20"
                  data-testid="button-admin"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logoutMutation.mutate()}
                className="text-white hover:bg-white/20"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <header className="border-b bg-background sticky top-[52px] z-40">
        <div className="max-w-4xl mx-auto px-4 md:px-6 flex items-center justify-between gap-2">
          <nav className="flex overflow-x-auto scrollbar-hide">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`px-3 md:px-4 py-3 text-sm font-medium transition-colors hover-elevate whitespace-nowrap ${
                  activeMenu === item.id
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground"
                }`}
                data-testid={`menu-${item.id}`}
              >
                {item.name}
              </button>
            ))}
          </nav>
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-auto min-w-0 shrink-0" data-testid="select-company">
              <SelectValue placeholder="Компания" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.name} data-testid={`select-company-${company.id}`}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-auto text-3xl font-bold border-none shadow-none p-0 h-auto" data-testid="select-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transactionTypes.map((type) => (
                  <SelectItem key={type} value={type} data-testid={`select-item-${type}`}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                <FormField
                  control={form.control}
                  name="bank_account"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Банковский счёт</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-bank">
                            <SelectValue placeholder="Выберите банк" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bankAccounts.map((bank) => (
                            <SelectItem key={bank.id} value={bank.name} data-testid={`select-bank-${bank.id}`}>
                              {bank.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

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
                    <TableHead>Банк</TableHead>
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
                      <TableCell data-testid={`text-bank-${tx.id}`}>{tx.bank_account || "-"}</TableCell>
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
    </div>
  );
}
