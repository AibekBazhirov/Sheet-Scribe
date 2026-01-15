import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Необходима авторизация" });
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

  return httpServer;
}
