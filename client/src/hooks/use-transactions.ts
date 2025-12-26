import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type TransactionInput } from "@shared/routes";
import { z } from "zod";

export function useTransactions() {
  return useQuery({
    queryKey: [api.transactions.list.path],
    queryFn: async () => {
      const res = await fetch(api.transactions.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return api.transactions.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TransactionInput) => {
      // Validate before sending
      const validated = api.transactions.create.input.parse(data);
      
      const res = await fetch(api.transactions.create.path, {
        method: api.transactions.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        // Handle validation errors from backend
        if (res.status === 400) {
          const error = api.transactions.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error('Failed to create transaction');
      }

      return api.transactions.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transactions.list.path] });
    },
  });
}
