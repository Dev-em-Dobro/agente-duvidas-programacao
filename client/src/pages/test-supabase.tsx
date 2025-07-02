
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function TestSupabase() {
  const [testResult, setTestResult] = useState<any>(null);
  const [conversationsData, setConversationsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-supabase');
      const result = await response.json();
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: 'Erro ao fazer requisição para o servidor',
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const response = await fetch('/api/conversations-all');
      console.log('Status da resposta:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Resposta da API:', result);
      setConversationsData(result);
    } catch (error: any) {
      console.error('Erro ao buscar conversas:', error);
      setConversationsData({
        success: false,
        message: 'Erro ao buscar conversas',
        error: error.message || 'Erro desconhecido'
      });
    } finally {
      setIsLoadingConversations(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Teste de Conexão Supabase</h1>
          <p className="text-muted-foreground mt-2">
            Verifique se a conexão com o banco de dados Supabase está funcionando
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status da Conexão</CardTitle>
            <CardDescription>
              Clique no botão para testar a conexão com o Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testConnection} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                'Testar Conexão'
              )}
            </Button>

            {testResult && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className={testResult.success ? "text-green-600" : "text-red-600"}>
                    {testResult.message}
                  </span>
                </div>

                {testResult.config && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Configuração:</h4>
                    <div className="flex gap-2">
                      <Badge variant={testResult.config.url === 'Configurado' ? 'default' : 'destructive'}>
                        SUPABASE_URL: {testResult.config.url}
                      </Badge>
                      <Badge variant={testResult.config.key === 'Configurado' ? 'default' : 'destructive'}>
                        SUPABASE_ANON_KEY: {testResult.config.key}
                      </Badge>
                    </div>
                  </div>
                )}

                {testResult.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <h4 className="font-medium text-red-800">Erro:</h4>
                    <p className="text-red-600 text-sm mt-1">{testResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tabela Conversations</CardTitle>
            <CardDescription>Visualizar dados da tabela conversations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={loadConversations} disabled={isLoadingConversations} className="w-full">
              {isLoadingConversations ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                'Buscar Conversas'
              )}
            </Button>

            {conversationsData && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {conversationsData.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className={conversationsData.success ? "text-green-600" : "text-red-600"}>
                    {conversationsData.message || 'Dados carregados'}
                  </span>
                </div>

                {conversationsData.data && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Registros encontrados: {conversationsData.data.length}</h4>
                    {conversationsData.data.length > 0 ? (
                      <div className="bg-gray-50 border rounded p-3 max-h-64 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(conversationsData.data, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm">Nenhuma conversa encontrada na tabela.</p>
                    )}
                  </div>
                )}

                {conversationsData.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <h4 className="font-medium text-red-800">Erro:</h4>
                    <p className="text-red-600 text-sm mt-1">{conversationsData.error}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como configurar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. Acesse seu projeto no Supabase (https://supabase.com)</p>
            <p>2. Vá em Settings → API</p>
            <p>3. Copie a URL do projeto e a chave anônima</p>
            <p>4. Configure as variáveis no arquivo .env:</p>
            <div className="bg-gray-100 p-2 rounded font-mono text-xs">
              SUPABASE_URL=https://seu-projeto.supabase.co<br/>
              SUPABASE_ANON_KEY=sua-chave-aqui
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
