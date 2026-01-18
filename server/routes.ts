import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { createUserSchema, updateUserSchema } from "@shared/schema";
import { z } from "zod";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Необходима авторизация" });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Необходима авторизация" });
  }
  if (req.session.userRole !== "admin") {
    return res.status(403).json({ message: "Доступ запрещён" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByUsername(input.username);
      
      if (!user) {
        return res.status(401).json({ message: "Неверный логин или пароль" });
      }
      
      const isValid = await storage.verifyPassword(input.password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ message: "Неверный логин или пароль" });
      }
      
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ message: "Ошибка сессии" });
        }
        
        req.session.userId = user.id;
        req.session.userName = user.display_name;
        req.session.userRole = user.role;
        
        req.session.save((err) => {
          if (err) {
            return res.status(500).json({ message: "Ошибка сохранения сессии" });
          }
          
          res.json({
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            role: user.role,
          });
        });
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Ошибка авторизации" });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Ошибка выхода" });
      }
      res.json({ message: "Вы вышли из системы" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Не авторизован" });
    }
    res.json({
      id: req.session.userId,
      display_name: req.session.userName,
      role: req.session.userRole,
    });
  });

  app.get(api.transactions.list.path, async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post(api.transactions.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.transactions.create.input.parse(req.body);
      const transaction = await storage.createTransaction(
        input,
        req.session.userId,
        req.session.userName
      );
      res.status(201).json(transaction);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.get(api.companies.list.path, async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get(api.bankAccounts.list.path, async (req, res) => {
    try {
      const bankAccounts = await storage.getBankAccounts();
      res.json(bankAccounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bank accounts" });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Ошибка загрузки пользователей" });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const input = createUserSchema.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Пользователь с таким логином уже существует" });
      }
      const user = await storage.createUser(input.username, input.password, input.display_name, input.role);
      const { password_hash, ...userPublic } = user;
      res.status(201).json(userPublic);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Ошибка создания пользователя" });
    }
  });

  app.patch("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Неверный ID" });
      }
      const input = updateUserSchema.parse(req.body);
      if (input.username) {
        const existing = await storage.getUserByUsername(input.username);
        if (existing && existing.id !== id) {
          return res.status(400).json({ message: "Пользователь с таким логином уже существует" });
        }
      }
      const user = await storage.updateUser(id, {
        username: input.username,
        password: input.password,
        display_name: input.display_name,
        role: input.role,
      });
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Ошибка обновления пользователя" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Неверный ID" });
      }
      if (id === req.session.userId) {
        return res.status(400).json({ message: "Нельзя удалить самого себя" });
      }
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      res.json({ message: "Пользователь удалён" });
    } catch (error) {
      res.status(500).json({ message: "Ошибка удаления пользователя" });
    }
  });

  return httpServer;
}
