import { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Database, User, Search } from 'lucide-react';
import { devAPI, authAPI } from '../services/api';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

export default function DiagnosticoSistema() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const [testLogin, setTestLogin] = useState<any>(null);
  const [verificacaoManual, setVerificacaoManual] = useState<any>(null);

  const verificarTecnicoManualmente = async () => {
    try {
      console.log('=== VERIFICAÇÃO MANUAL ===');
      
      // Buscar o usuário pelo email
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-1eb66b2f/tecnicos`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Todos os técnicos:', data);

      setVerificacaoManual({
        totalTecnicos: data.data?.length || 0,
        tecnicos: data.data || []
      });
    } catch (error) {
      console.error('Erro na verificação manual:', error);
    }
  };

  const executarDiagnostico = async () => {
    setLoading(true);
    setResultado(null);
    setTestLogin(null);
    setVerificacaoManual(null);

    try {
      console.log('=== INICIANDO DIAGNÓSTICO DO SISTEMA ===');
      
      // 1. Executar correção de vínculos
      console.log('1. Executando correção de vínculos...');
      const fixResponse = await devAPI.fixUserLinks();
      console.log('Resposta da correção:', fixResponse);

      setResultado(fixResponse);

      // 2. Verificar técnicos na tabela
      await verificarTecnicoManualmente();

      // 3. Testar login do técnico
      console.log('2. Testando login do técnico...');
      const loginResponse = await authAPI.login({
        email: 'tecnico@clacs.ao',
        password: 'tecnico123'
      });
      console.log('Resposta do login:', loginResponse);

      setTestLogin(loginResponse);

    } catch (error: any) {
      console.error('Erro no diagnóstico:', error);
      setResultado({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Diagnóstico do Sistema</h1>
              <p className="text-sm text-gray-600">Verifica e corrige vínculos de usuários</p>
            </div>
          </div>

          <button
            onClick={executarDiagnostico}
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Executando diagnóstico...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Executar Diagnóstico Completo
              </>
            )}
          </button>

          {verificacaoManual && (
            <div className="mt-6 p-4 rounded-lg border bg-gray-50 border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Verificação da Tabela Técnicos</h3>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Total de técnicos na tabela:</strong> {verificacaoManual.totalTecnicos}
                </p>

                {verificacaoManual.tecnicos.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {verificacaoManual.tecnicos.map((tec: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded border border-gray-200 text-xs font-mono">
                        <p><strong>ID:</strong> {tec.id}</p>
                        <p><strong>Nome:</strong> {tec.nome}</p>
                        <p><strong>Email:</strong> {tec.email}</p>
                        <p className={tec.usuario_id ? 'text-green-600' : 'text-red-600'}>
                          <strong>usuario_id:</strong> {tec.usuario_id || 'NULL'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 font-semibold">
                      NENHUM TÉCNICO ENCONTRADO NA TABELA!
                    </p>
                    <p className="text-red-700 text-xs mt-1">
                      A tabela 'tecnicos' está vazia. Isso explica por que o tecnicoId está NULL.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {resultado && (
            <div className="mt-6 space-y-4">
              <div className={`p-4 rounded-lg border ${
                resultado.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  {resultado.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <h3 className="font-semibold text-gray-900">
                    {resultado.success ? 'Correção Concluída' : 'Erro na Correção'}
                  </h3>
                </div>

                {resultado.success && resultado.data && (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-gray-600">Total de Usuários</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {resultado.data.totalUsuarios}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-gray-600">Técnicos Vinculados</p>
                        <p className="text-2xl font-bold text-green-600">
                          {resultado.data.tecnicosVinculados}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-gray-600">Clientes Vinculados</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {resultado.data.clientesVinculados}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-gray-600">Erros</p>
                        <p className="text-2xl font-bold text-red-600">
                          {resultado.data.erros?.length || 0}
                        </p>
                      </div>
                    </div>

                    {resultado.data.erros && resultado.data.erros.length > 0 && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="font-semibold text-red-900 mb-2">Erros Encontrados:</p>
                        <ul className="list-disc list-inside space-y-1 text-red-800">
                          {resultado.data.erros.map((erro: any, idx: number) => (
                            <li key={idx}>
                              <strong>{erro.email}:</strong> {erro.erro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {!resultado.success && (
                  <p className="text-red-700">{resultado.error}</p>
                )}
              </div>

              {testLogin && (
                <div className="mt-6 p-4 rounded-lg border bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Resultado do Login de Teste</h3>
                  </div>

                  {testLogin.success ? (
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded border border-blue-200">
                        <p className="text-sm font-mono">
                          <strong>User ID (Auth):</strong> {testLogin.data.user.id}
                        </p>
                        <p className="text-sm font-mono">
                          <strong>Email:</strong> {testLogin.data.user.email}
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded border border-blue-200">
                        <p className="text-sm font-mono">
                          <strong>Profile Tipo:</strong> {testLogin.data.profile.tipo}
                        </p>
                        <p className="text-sm font-mono">
                          <strong>Profile Nome:</strong> {testLogin.data.profile.nome}
                        </p>
                      </div>

                      <div className={`bg-white p-3 rounded border ${testLogin.data.tecnicoId ? 'border-green-500' : 'border-red-500'}`}>
                        <p className="text-sm font-mono">
                          <strong>TecnicoId retornado:</strong>{' '}
                          {testLogin.data.tecnicoId ? (
                            <span className="text-green-600">{testLogin.data.tecnicoId}</span>
                          ) : (
                            <span className="text-red-600 font-bold">NULL</span>
                          )}
                        </p>
                      </div>

                      {!testLogin.data.tecnicoId && verificacaoManual && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded">
                          <p className="text-sm font-semibold text-yellow-800 mb-2">
                            DIAGNÓSTICO DO PROBLEMA:
                          </p>
                          <p className="text-xs text-yellow-900 mb-3">
                            O user.id do Auth ({testLogin.data.user.id}) não corresponde ao usuario_id de nenhum técnico:
                          </p>
                          {verificacaoManual.tecnicos.map((tec: any) => (
                            <div key={tec.id} className="mb-2 p-2 bg-white rounded border text-xs">
                              <p><strong>{tec.nome}</strong> ({tec.email})</p>
                              <p className="font-mono text-red-600">usuario_id: {tec.usuario_id}</p>
                              <p className={tec.usuario_id === testLogin.data.user.id ? 'text-green-600 font-bold' : 'text-red-600'}>
                                {tec.usuario_id === testLogin.data.user.id ? '✅ MATCH!' : '❌ Não corresponde'}
                              </p>
                            </div>
                          ))}
                          
                          <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
                            <p className="text-xs font-bold text-red-800">
                              SOLUÇÃO: O usuario_id do técnico precisa ser atualizado para: {testLogin.data.user.id}
                            </p>
                          </div>
                        </div>
                      )}

                      {testLogin.data.tecnicoId && (
                        <div className="flex items-center gap-2 text-green-600 font-semibold">
                          <CheckCircle className="w-5 h-5" />
                          Login funcionando corretamente!
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-5 h-5" />
                      <span>Erro no login: {testLogin.error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">O que este diagnóstico faz:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
              <li>Busca todos os usuários na tabela 'usuarios'</li>
              <li>Para cada técnico, cria registro na tabela 'tecnicos' se não existir</li>
              <li>Para cada cliente, cria registro na tabela 'clientes' se não existir</li>
              <li>Testa o login do técnico para verificar se o tecnicoId é retornado</li>
              <li>Mostra estatísticas detalhadas e erros (se houver)</li>
            </ul>
          </div>

          <div className="mt-4 text-center">
            <a
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Voltar ao Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}