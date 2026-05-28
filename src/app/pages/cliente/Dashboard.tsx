import { FileText, ClipboardList, Clock, TrendingUp, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { contratosAPI, intervencoesAPI, clientesAPI } from "../../services/api";

export default function ClienteDashboard() {
  const [contratos, setContratos] = useState<any[]>([]);
  const [intervencoes, setIntervencoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const usuarioId = localStorage.getItem('userId');

  useEffect(() => {
    carregarClienteId();
  }, []);

  useEffect(() => {
    if (clienteId) {
      carregarDados();
    }
  }, [clienteId]);

  const carregarClienteId = async () => {
    try {
      if (!usuarioId) {
        console.error('Usuario ID não encontrado');
        setLoading(false);
        return;
      }

      const clienteRes = await clientesAPI.buscarPorUsuarioId(usuarioId);
      if (clienteRes.success && clienteRes.data) {
        setClienteId(clienteRes.data.id);
      } else {
        console.error('Cliente não encontrado para este usuário');
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao carregar ID do cliente:', error);
      setLoading(false);
    }
  };

  const carregarDados = async () => {
    try {
      setLoading(true);

      console.log('=== CARREGANDO DASHBOARD CLIENTE ===');
      console.log('ClienteId:', clienteId);

      const [contratosRes, intervencoesRes] = await Promise.all([
        contratosAPI.listarPorCliente(clienteId!),
        intervencoesAPI.listarPorCliente(clienteId!)
      ]);

      console.log('Resposta contratos:', contratosRes);
      console.log('Resposta intervenções:', intervencoesRes);

      if (contratosRes.success) {
        setContratos(contratosRes.data);
        console.log('✅ Contratos carregados:', contratosRes.data.length);
      }

      if (intervencoesRes.success) {
        setIntervencoes(intervencoesRes.data);
        console.log('✅ Intervenções carregadas:', intervencoesRes.data.length);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const contratosAtivos = contratos.filter(c => c.status === "Ativo");
  const intervencoesAbertas = intervencoes.filter(i => i.status !== "Concluído");
  const totalHorasUsadas = contratos.reduce((acc, c) => acc + (c.horasUsadas || 0), 0);
  const totalHorasContratadas = contratos.reduce((acc, c) => acc + (c.horasContratadas || 0), 0);
  const totalHorasDisponiveis = totalHorasContratadas - totalHorasUsadas;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard do Cliente</h1>
        <p className="text-gray-600 mt-1">Bem-vindo, {localStorage.getItem('userName')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Contratos Ativos</p>
              <p className="text-3xl font-bold text-gray-900">{contratosAtivos.length}</p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
              <FileText className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Intervenções Abertas</p>
              <p className="text-3xl font-bold text-gray-900">{intervencoesAbertas.length}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Horas Usadas</p>
              <p className="text-3xl font-bold text-gray-900">{totalHorasUsadas.toFixed(2)}h</p>
            </div>
            <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-7 h-7 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Horas Disponíveis</p>
              <p className="text-3xl font-bold text-gray-900">{totalHorasDisponiveis.toFixed(2)}h</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Meus Contratos</h2>
          <div className="space-y-3">
            {contratos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum contrato encontrado</p>
            ) : (
              contratos.map(contrato => {
                const horasUsadas = contrato.horasUsadas || 0;
                const horasContratadas = contrato.horasContratadas || 0;
                const percentual = horasContratadas > 0
                  ? (horasUsadas / horasContratadas) * 100
                  : 0;

                return (
                  <div key={contrato.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{contrato.tipo}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${contrato.status === "Ativo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}>
                        {contrato.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Horas:</span>
                        <span className="font-medium text-gray-900">
                          {horasUsadas.toFixed(2)}/{horasContratadas.toFixed(2)}h
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${percentual > 80 ? 'bg-red-500' :
                              percentual > 60 ? 'bg-yellow-500' :
                                'bg-green-500'
                            }`}
                          style={{ width: `${Math.min(percentual, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valor Mensal:</span>
                      <span className="font-semibold text-purple-600">
                        Kz {contrato.valorMensal?.toLocaleString('pt-AO') || 'N/A'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Intervenções Recentes</h2>
          <div className="space-y-3">
            {intervencoes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma intervenção registrada</p>
            ) : (
              intervencoes.slice(0, 5).map(intervencao => (
                <div key={intervencao.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{intervencao.titulo}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(intervencao.dataCriacao).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${intervencao.status === "Concluído" ? "bg-green-100 text-green-700" :
                        intervencao.status === "Em Andamento" ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-gray-700"
                      }`}>
                      {intervencao.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${intervencao.prioridade === "Alta" ? "bg-red-100 text-red-700" :
                        intervencao.prioridade === "Média" ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                      }`}>
                      {intervencao.prioridade}
                    </span>
                    <span className="text-xs text-gray-500">{(intervencao.horasGastas || 0).toFixed(2)}h gastas</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
