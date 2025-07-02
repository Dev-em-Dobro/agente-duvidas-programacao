import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "./theme-provider";
import { Plus, X, Sun, Moon, User, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
}

export function ChatSidebar({ isOpen, onToggle, onNewChat }: ChatSidebarProps) {
  const { theme, toggleTheme } = useTheme();
  
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [displayedConversations, setDisplayedConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const conversationsPerPage = 20;

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/conversations-all');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      const conversationsData = result?.data || [];
      
      setAllConversations(conversationsData);
      
      // Mostrar apenas as primeiras conversas
      const firstPage = conversationsData.slice(0, conversationsPerPage);
      setDisplayedConversations(firstPage);
      setCurrentPage(0);
      
      console.log(`Carregadas ${conversationsData.length} conversas, mostrando ${firstPage.length}`);

    } catch (error: any) {
      console.error('Erro ao buscar conversas:', error);
      setAllConversations([]);
      setDisplayedConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreConversations = () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const startIndex = nextPage * conversationsPerPage;
      const endIndex = startIndex + conversationsPerPage;
      const newConversations = allConversations.slice(startIndex, endIndex);
      
      if (newConversations.length > 0) {
        setDisplayedConversations(prev => [...prev, ...newConversations]);
        setCurrentPage(nextPage);
        console.log(`Carregadas mais ${newConversations.length} conversas`);
      }
      
      setIsLoadingMore(false);
    }, 500);
  };

  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-muted/30 border-r border-border z-50 sidebar-transition theme-transition",
          "transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-semibold">ChatGPT Clone</h1>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={onToggle}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* New Chat Button */}
            <Button
              onClick={onNewChat}
              className="w-full justify-start gap-3 bg-background hover:bg-accent border border-border"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Nova conversa
            </Button>
          </div>
          
          {/* Chat History */}
          <div className="flex-1 px-4">
            <div 
              className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-muted/10 hover:scrollbar-thumb-muted-foreground/50"
              style={{ 
                maxHeight: 'calc(100vh - 300px)',
                minHeight: '300px'
              }}
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                // Quando chegar próximo ao final (20px antes), carrega mais conversas
                if (scrollHeight - scrollTop <= clientHeight + 20) {
                  if (displayedConversations.length < allConversations.length && !isLoadingMore) {
                    loadMoreConversations();
                  }
                }
              }}
            >
              <div className="space-y-2 pb-4">
                <h3 className="text-sm font-medium text-muted-foreground px-3 py-2">
                  Conversas recentes ({displayedConversations.length}/{allConversations.length})
                </h3>
                
                {isLoading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Carregando conversas...
                  </div>
                ) : displayedConversations.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Nenhuma conversa encontrada
                  </div>
                ) : (
                  <>
                    {displayedConversations.map((conversation: any) => (
                      <div
                        key={conversation.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer theme-transition group"
                      >
                        <span className="text-sm truncate flex-1">
                          {conversation.title?.substring(0, 50) || `Conversa ${conversation.id}`}
                          {conversation.title?.length > 50 && '...'}
                        </span>
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                    
                    {/* Indicador de carregamento automático */}
                    {isLoadingMore && (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        Carregando mais conversas...
                      </div>
                    )}
                    
                    {/* Indicador de fim da lista */}
                    {displayedConversations.length >= allConversations.length && allConversations.length > 0 && (
                      <div className="px-3 py-2 text-center text-xs text-muted-foreground">
                        Todas as conversas foram carregadas
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="p-4 border-t border-border">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 mb-2"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {theme === "dark" ? "Modo claro" : "Modo escuro"}
            </Button>
            
            {/* User Profile */}
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent theme-transition">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm">Usuário</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}