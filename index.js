var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import { config } from "dotenv";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { createClient } from "@supabase/supabase-js";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  chatMessages: () => chatMessages,
  conversations: () => conversations,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertUserSchema: () => insertUserSchema,
  sessions: () => sessions,
  users: () => users,
  webhookMessageSchema: () => webhookMessageSchema
});
import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  userEmail: varchar("user_email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  sessionId: text("session_id").notNull(),
  message: text("message").notNull(),
  isUser: boolean("is_user").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true
});
var insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  message: true,
  isUser: true
});
var webhookMessageSchema = z.object({
  message: z.string(),
  timestamp: z.string(),
  user_id: z.string(),
  session_id: z.string(),
  metadata: z.object({
    platform: z.string(),
    language: z.string()
  })
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_ANON_KEY;
console.log("Debug - Supabase URL:", supabaseUrl ? "Configurado" : "N\xE3o configurado");
console.log("Debug - Supabase Key:", supabaseKey ? "Configurado" : "N\xE3o configurado");
var supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async getConversationsByEmail(email) {
    if (!supabase) {
      console.error("Supabase n\xE3o configurado. Verifique as vari\xE1veis SUPABASE_URL e SUPABASE_ANON_KEY");
      return [];
    }
    try {
      const { data, error } = await supabase.from("conversations").select("*").eq("student_id", 5).order("created_at", { ascending: false });
      if (error) {
        console.error("Erro ao buscar conversas do Supabase:", error);
        return [];
      }
      const conversationsMap = /* @__PURE__ */ new Map();
      (data || []).forEach((conversation) => {
        const threadId = conversation.thread_id || `single_${conversation.id}`;
        if (!conversationsMap.has(threadId)) {
          conversationsMap.set(threadId, {
            id: threadId,
            title: conversation.message.length > 50 ? conversation.message.substring(0, 50) + "..." : conversation.message,
            lastMessage: conversation.message,
            created_at: conversation.created_at,
            student_id: conversation.student_id
          });
        }
      });
      return Array.from(conversationsMap.values()).slice(0, 10);
    } catch (error) {
      console.error("Erro na conex\xE3o com Supabase:", error);
      return [];
    }
  }
  async createConversation(conversationData) {
    const [conversation] = await db.insert(conversations).values(conversationData).returning();
    return conversation;
  }
  async getAllConversationsByUser(userId) {
    try {
      if (!supabase) {
        return {
          success: false,
          message: "Supabase n\xE3o configurado",
          data: []
        };
      }
      const { data, error } = await supabase.from("conversations").select("*").eq("student_id", userId).order("created_at", { ascending: false });
      if (error) {
        console.log("Erro ao buscar conversas do Supabase:", error);
        return {
          success: false,
          message: "Erro ao buscar conversas",
          error: error.message,
          data: []
        };
      }
      console.log("Dados encontrados no Supabase:", data?.length || 0, "registros");
      return {
        success: true,
        message: `${data?.length || 0} conversas encontradas`,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro na consulta",
        error: error.message,
        data: []
      };
    }
  }
  async getAllConversations() {
    try {
      if (!supabase) {
        return {
          success: false,
          message: "Supabase n\xE3o configurado",
          data: []
        };
      }
      const { data, error } = await supabase.from("conversations").select("*").order("created_at", { ascending: false });
      if (error) {
        console.log("Erro ao buscar conversas do Supabase:", error);
        return {
          success: false,
          message: "Erro ao buscar conversas",
          error: error.message,
          data: []
        };
      }
      console.log("Dados encontrados no Supabase:", data?.length || 0, "registros");
      return {
        success: true,
        message: `${data?.length || 0} conversas encontradas`,
        data: data || []
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro na consulta",
        error: error.message,
        data: []
      };
    }
  }
  async testSupabaseConnection() {
    if (!supabase) {
      return {
        success: false,
        message: "Supabase n\xE3o configurado. Verifique as vari\xE1veis SUPABASE_URL e SUPABASE_ANON_KEY",
        config: {
          url: process.env.SUPABASE_URL ? "Configurado" : "N\xE3o configurado",
          key: process.env.SUPABASE_ANON_KEY ? "Configurado" : "N\xE3o configurado"
        }
      };
    }
    try {
      const { data, error } = await supabase.from("conversations").select("count", { count: "exact", head: true });
      if (error) {
        return {
          success: false,
          message: "Erro ao conectar com Supabase",
          error: error.message,
          config: {
            url: process.env.SUPABASE_URL ? "Configurado" : "N\xE3o configurado",
            key: process.env.SUPABASE_ANON_KEY ? "Configurado" : "N\xE3o configurado"
          }
        };
      }
      return {
        success: true,
        message: "Conex\xE3o com Supabase funcionando!",
        tableExists: true,
        config: {
          url: process.env.SUPABASE_URL ? "Configurado" : "N\xE3o configurado",
          key: process.env.SUPABASE_ANON_KEY ? "Configurado" : "N\xE3o configurado"
        }
      };
    } catch (error) {
      return {
        success: false,
        message: "Erro na conex\xE3o com Supabase",
        error: error.message,
        config: {
          url: process.env.SUPABASE_URL ? "Configurado" : "N\xE3o configurado",
          key: process.env.SUPABASE_ANON_KEY ? "Configurado" : "N\xE3o configurado"
        }
      };
    }
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z as z2 } from "zod";
var webhookMessageSchema2 = z2.object({
  message: z2.string(),
  timestamp: z2.string(),
  user_id: z2.string(),
  session_id: z2.string(),
  metadata: z2.object({
    platform: z2.string(),
    language: z2.string()
  })
});
async function registerRoutes(app2) {
  app2.get("/api/test-supabase", async (req, res) => {
    try {
      const testResult = await storage.testSupabaseConnection();
      res.json(testResult);
    } catch (error) {
      console.error("Error testing Supabase:", error);
      res.status(500).json({ message: "Failed to test Supabase connection", error: error.message });
    }
  });
  app2.get("/api/conversations-all", async (req, res) => {
    try {
      const result = await storage.getAllConversations();
      console.log("Enviando resposta para frontend:", result);
      res.json(result);
    } catch (error) {
      console.error("Error fetching all conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  app2.post("/api/initial-conversations-by-user", async (req, res) => {
    try {
      const userId = req.body.id;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId \xE9 obrigat\xF3rio"
        });
      }
      const result = await storage.getAllConversationsByUser(userId);
      console.log("Enviando resposta para frontend:", result);
      res.json(result);
    } catch (error) {
      console.error("Error fetching all conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  app2.get("/api/conversations", async (req, res) => {
    try {
      const conversations2 = await storage.getConversationsByEmail("roberto.rhd@gmail.com");
      res.json(conversations2);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  app2.post("/api/webhook/send", async (req, res) => {
    try {
      const messageData = webhookMessageSchema2.parse(req.body);
      const webhookUrl = process.env.N8N_WEBHOOK_URL || process.env.WEBHOOK_URL || "https://n8n.srv830193.hstgr.cloud/webhook/94af18df-b62f-455e-85eb-8d97e91fcb7f";
      if (!webhookUrl) {
        return res.status(500).json({
          message: "Webhook URL not configured."
        });
      }
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(messageData)
      });
      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
      }
      let result;
      try {
        result = await response.json();
      } catch {
        result = { response: "Mensagem processada com sucesso!" };
      }
      res.json(result);
    } catch (error) {
      console.error("Webhook error:", error);
      if (error instanceof z2.ZodError) {
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  base: "/agente-duvidas-programacao"
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
config();
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 8002;
  server.listen({
    port,
    host: "0.0.0.0"
  }, () => {
    log(`serving on port ${port}`);
  });
})();
