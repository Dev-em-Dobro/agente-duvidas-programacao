import { createClient } from '@supabase/supabase-js';
import { users, conversations, type User, type UpsertUser, type Conversation, type InsertConversation } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Debug - Supabase URL:', supabaseUrl ? 'Configurado' : 'Não configurado');
console.log('Debug - Supabase Key:', supabaseKey ? 'Configurado' : 'Não configurado');

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getConversationsByEmail(email: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  testSupabaseConnection(): Promise<any>;
  getAllConversations(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getConversationsByEmail(email: string): Promise<any[]> {
    if (!supabase) {
      console.error('Supabase não configurado. Verifique as variáveis SUPABASE_URL e SUPABASE_ANON_KEY');
      return [];
    }

    try {
      // Buscar conversas pelo student_id 5 (roberto.rhd@gmail.com)
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('student_id', 5)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar conversas do Supabase:', error);
        return [];
      }

      // Agrupar conversas por thread_id e pegar a primeira mensagem de cada thread
      const conversationsMap = new Map();
      (data || []).forEach((conversation: any) => {
        const threadId = conversation.thread_id || `single_${conversation.id}`;
        if (!conversationsMap.has(threadId)) {
          conversationsMap.set(threadId, {
            id: threadId,
            title: conversation.message.length > 50 
              ? conversation.message.substring(0, 50) + '...' 
              : conversation.message,
            lastMessage: conversation.message,
            created_at: conversation.created_at,
            student_id: conversation.student_id
          });
        }
      });

      return Array.from(conversationsMap.values()).slice(0, 10);
    } catch (error) {
      console.error('Erro na conexão com Supabase:', error);
      return [];
    }
  }

  async createConversation(conversationData: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(conversationData)
      .returning();
    return conversation;
  }

  async getAllConversationsByUser(userId:String): Promise<any> {
    try {
      if (!supabase) {
        return {
          success: false,
          message: 'Supabase não configurado',
          data: []
        };
      }

      const { data, error } = await supabase
        .from('conversations')
        .select("*")
        .eq('student_id', userId) // AQUI está a correção
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Erro ao buscar conversas do Supabase:', error);
        return {
          success: false,
          message: 'Erro ao buscar conversas',
          error: error.message,
          data: []
        };
      }

      console.log('Dados encontrados no Supabase:', data?.length || 0, 'registros');
      return {
        success: true,
        message: `${data?.length || 0} conversas encontradas`,
        data: data || []
      };

    } catch (error: any) {
      return {
        success: false,
        message: 'Erro na consulta',
        error: error.message,
        data: []
      };
    }
  }

  async getAllConversations(): Promise<any> {
    try {
      if (!supabase) {
        return {
          success: false,
          message: 'Supabase não configurado',
          data: []
        };
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Erro ao buscar conversas do Supabase:', error);
        return {
          success: false,
          message: 'Erro ao buscar conversas',
          error: error.message,
          data: []
        };
      }

      console.log('Dados encontrados no Supabase:', data?.length || 0, 'registros');
      return {
        success: true,
        message: `${data?.length || 0} conversas encontradas`,
        data: data || []
      };

    } catch (error: any) {
      return {
        success: false,
        message: 'Erro na consulta',
        error: error.message,
        data: []
      };
    }
  }

  async testSupabaseConnection(): Promise<any> {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase não configurado. Verifique as variáveis SUPABASE_URL e SUPABASE_ANON_KEY',
        config: {
          url: process.env.SUPABASE_URL ? 'Configurado' : 'Não configurado',
          key: process.env.SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado'
        }
      };
    }

    try {
      // Teste simples: listar tabelas ou fazer uma query básica
      const { data, error } = await supabase
        .from('conversations')
        .select('count', { count: 'exact', head: true });

      if (error) {
        return {
          success: false,
          message: 'Erro ao conectar com Supabase',
          error: error.message,
          config: {
            url: process.env.SUPABASE_URL ? 'Configurado' : 'Não configurado',
            key: process.env.SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado'
          }
        };
      }

      return {
        success: true,
        message: 'Conexão com Supabase funcionando!',
        tableExists: true,
        config: {
          url: process.env.SUPABASE_URL ? 'Configurado' : 'Não configurado',
          key: process.env.SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado'
        }
      };

    } catch (error: any) {
      return {
        success: false,
        message: 'Erro na conexão com Supabase',
        error: error.message,
        config: {
          url: process.env.SUPABASE_URL ? 'Configurado' : 'Não configurado',
          key: process.env.SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado'
        }
      };
    }
  }
}

export const storage = new DatabaseStorage();
