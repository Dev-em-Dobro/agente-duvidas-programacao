import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

const webhookMessageSchema = z.object({
  message: z.string(),
  timestamp: z.string(),
  user_id: z.string(),
  session_id: z.string(),
  metadata: z.object({
    platform: z.string(),
    language: z.string(),
  }),
});

export async function registerRoutes(app: Express): Promise<Server> {

  // Test Supabase connection
  app.get('/api/test-supabase', async (req, res) => {
    try {
      const testResult = await storage.testSupabaseConnection();
      res.json(testResult);
    } catch (error: any) {
      console.error("Error testing Supabase:", error);
      res.status(500).json({ message: "Failed to test Supabase connection", error: error.message });
    }
  });

  // Get all conversations for testing
  app.get('/api/conversations-all', async (req, res) => {
    try {
      const result = await storage.getAllConversations();
      console.log('Enviando resposta para frontend:', result);
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching all conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get all conversations for testing
  app.post('/api/initial-conversations-by-user', async (req, res) => {
    try {
      const userId = req.body.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId é obrigatório'
        });
      }
      
      const result = await storage.getAllConversationsByUser(userId);
      console.log('Enviando resposta para frontend:', result);
      res.json(result);
    } catch (error: any) {
      console.error("Error fetching all conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Conversations routes (no auth required)
  app.get('/api/conversations', async (req: any, res) => {
    try {
      // Buscar conversas por student_id 5 (roberto.rhd@gmail.com)
      const conversations = await storage.getConversationsByEmail("roberto.rhd@gmail.com");
      res.json(conversations);
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Webhook endpoint to send messages to n8n (no auth required)
  app.post("/api/webhook/send", async (req, res) => {
    try {
      // Validate request body
      const messageData = webhookMessageSchema.parse(req.body);
      
      // Get webhook URL from environment variables or use default
      const webhookUrl = process.env.N8N_WEBHOOK_URL || process.env.WEBHOOK_URL || "https://n8n.srv830193.hstgr.cloud/webhook/94af18df-b62f-455e-85eb-8d97e91fcb7f";
      
      if (!webhookUrl) {
        return res.status(500).json({ 
          message: "Webhook URL not configured." 
        });
      }

      // Send to n8n webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch {
        // If response is not JSON, create a default response
        result = { response: "Mensagem processada com sucesso!" };
      }

      res.json(result);
    } catch (error) {
      console.error('Webhook error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
