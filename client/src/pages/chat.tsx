import { useState, useEffect } from "react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatMessages } from "@/components/chat-messages";
import { ChatInput } from "@/components/chat-input";
import { log } from "console";
import DotGrid from "@/components/DotGrid";
// import Particles from "@/components/Particles";

const N8N_WEBHOOK_URL = import.meta.env.N8N_WEBHOOK_URL;

interface Message {
  id: string,
  content: string;
  isUser: boolean;
}

export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
const containerRef = useRef(null);

useEffect(() => {
  const el = containerRef.current;
  if (el) {
    el.scrollTop = el.scrollHeight;
  }
}, [messages]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [sessionId] = useState(() => `session_${Date.now()}`);

  const addMessage = (content: string, isUser: boolean) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random()}`,
      content,
      isUser: isUser
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleSendMessage = async (message: string) => {
    setError("");

    // Add user message
    addMessage(message, true);

    setIsLoading(true);

    try {
      // Send to backend webhook endpoint using fetch
      const response = await fetch("https://n8n.srv830193.hstgr.cloud/webhook/95894a5c-de0d-4933-836e-9e89d0efad15", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          assistant_id: 'jarvis',
          email: 'roberto.rhd@gmail.com'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Recebe como texto simples
      const resultText = await response.text();

      // Adiciona resposta do assistente
      const assistantMessage = resultText || "Mensagem recebida com sucesso!";
      addMessage(assistantMessage, false);

    } catch (err) {
      setError("Erro ao enviar mensagem. Tente novamente.");
      console.error("Error sending message:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setError("");
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen relative">
      {/* Animação de fundo */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10" style={{height:"90vh"}}>
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border bg-background theme-transition flex-shrink-0" style={{backgroundColor: "#8A35C8"}}>
          {/* Logo/Imagem à esquerda */}
          <img src="/293bd586-7dd2-487c-9785-393da036e1a9.png" alt="Logo Ana" className="h-10 w-10 rounded-full object-cover mr-3" />
          <h2 className="text-lg font-medium">
            <a href="/" className="hover:underline" style={{color: "white"}}>Ana - Assistente em programação</a>
          </h2>
          <div className="w-8"></div>
        </header>

        {/* Messages with integrated input */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto" ref={containerRef}>
          <div className="flex-1 flex flex-col">
            <ChatMessages 
              messages={messages} 
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              error={error}
            />
          </div>
          {/* Input fixo no final quando há mensagens */}
          {messages.length > 0 && (
            <div className="flex-shrink-0" style={{ "position":"fixed", "bottom": 0, "left": 0, "right": 0, "zIndex": 10, "width": "100%" }}>
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                error={error}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
