import { FileText, Clock, Calendar, AlertCircle, Download, Loader, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { contratosAPI, intervencoesAPI, clientesAPI } from "../../services/api";
const API_BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:8001"
  : "https://clacs-backend.onrender.com";


export default function ClienteContratos() {
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

      const [contratosRes, intervencoesRes] = await Promise.all([
        contratosAPI.listarPorCliente(clienteId!),
        intervencoesAPI.listarPorCliente(clienteId!)
      ]);

      if (contratosRes.success) setContratos(contratosRes.data);
      if (intervencoesRes.success) setIntervencoes(intervencoesRes.data);
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportarRelatorio = (contratoId: string) => {
    window.open(`${API_BASE_URL}/relatorios/contrato/${contratoId}/cliente`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meus Contratos</h1>
        <p className="text-gray-600 mt-1">Acompanhe seus contratos e utilização de horas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Contratos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">
                {contratos.filter(c => c.status === "Ativo").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Horas Disponíveis</p>
              <p className="text-2xl font-bold text-gray-900">
                {contratos.reduce((acc, c) =>
                  acc + ((c.horas_contratadas || 0) - (c.horas_usadas || 0)), 0
                ).toFixed(2)}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Intervenções</p>
              <p className="text-2xl font-bold text-gray-900">{intervencoes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {contratos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Nenhum contrato encontrado</p>
        </div>
      ) : (
        <div className="space-y-6">
          {contratos.map(contrato => {
            const horasContratadas = contrato.horas_contratadas || 0;
            const horasUsadas = contrato.horas_usadas || 0;
            const percentualUsado = horasContratadas > 0 && contrato.tipo !== "Por Hora"
              ? (horasUsadas / horasContratadas) * 100
              : 0;
            const horasRestantes = horasContratadas - horasUsadas;

            const intervencoesDoContrato = intervencoes.filter(i =>
              i.cliente_id === clienteId || i.clienteId === clienteId
            );

            return (
              <div key={contrato.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                {/* Cabeçalho do Card */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">{contrato.tipo}</h2>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${contrato.status === "Ativo"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                        }`}>
                        {contrato.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                      {contrato.data_inicio && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-gray-500">Início:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {new Date(contrato.data_inicio).toLocaleDateString('pt-AO')}
                            </span>
                          </div>
                        </div>
                      )}

                      {contrato.data_fim && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-gray-500">Fim:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {new Date(contrato.data_fim).toLocaleDateString('pt-AO')}
                            </span>
                          </div>
                        </div>
                      )}

                      {contrato.valor_mensal > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-purple-600" />
                          <div>
                            <span className="text-gray-500">Valor:</span>
                            <span className="ml-1 font-semibold text-purple-600">
                              Kz {contrato.valor_mensal.toLocaleString('pt-AO')}/mês
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {contrato.tipo !== "Por Hora" && (
                    <div className="bg-purple-50 rounded-lg p-4 min-w-[180px]">
                      <div className="text-center">
                        <p className="text-xs text-purple-600 font-medium mb-1">Horas Utilizadas</p>
                        <p className="text-3xl font-bold text-purple-700 mb-1">
                          {Math.round(percentualUsado)}%
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs text-purple-600">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">{horasUsadas.toFixed(2)}h de {horasContratadas.toFixed(2)}h</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-purple-200">
                          <p className="text-xs text-purple-600">
                            <span className="font-semibold">{horasRestantes.toFixed(2)}h</span> restantes
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Estatísticas Adicionais */}
                {contrato.tipo !== "Por Hora" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Total Gasto</p>
                      <p className="text-lg font-bold text-gray-900">{horasUsadas.toFixed(2)}h</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Disponível</p>
                      <p className="text-lg font-bold text-green-600">{horasRestantes.toFixed(2)}h</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Total Contrato</p>
                      <p className="text-lg font-bold text-purple-600">{horasContratadas.toFixed(2)}h</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Média/Dia</p>
                      <p className="text-lg font-bold text-blue-600">
                        {contrato.data_inicio
                          ? (horasUsadas / Math.max(1, Math.ceil((Date.now() - new Date(contrato.data_inicio).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(2)
                          : '0.00'}h
                      </p>
                    </div>
                  </div>
                )}

                {/* Barra de Progresso */}
                {contrato.tipo !== "Por Hora" && (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Progresso do Contrato</span>
                        <span className="text-xs font-semibold text-gray-900">{Math.round(percentualUsado)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all ${percentualUsado > 90 ? "bg-gradient-to-r from-red-500 to-red-600" :
                            percentualUsado > 70 ? "bg-gradient-to-r from-yellow-500 to-yellow-600" :
                              "bg-gradient-to-r from-green-500 to-green-600"
                            }`}
                          style={{ width: `${Math.min(percentualUsado, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {percentualUsado > 80 && (
                      <div className={`flex items-start gap-3 p-4 rounded-lg mb-4 ${percentualUsado > 90
                        ? "bg-red-50 border border-red-200"
                        : "bg-yellow-50 border border-yellow-200"
                        }`}>
                        <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${percentualUsado > 90 ? "text-red-600" : "text-yellow-600"}`} />
                        <div className="flex-1">
                          <p className={`text-sm font-semibold mb-1 ${percentualUsado > 90 ? "text-red-800" : "text-yellow-800"}`}>
                            {percentualUsado > 90 ? "Atencao! Limite de Horas Proximo!" : "Atencao: Uso Elevado de Horas"}
                          </p>
                          <p className={`text-xs ${percentualUsado > 90 ? "text-red-700" : "text-yellow-700"}`}>
                            {percentualUsado > 90
                              ? `Voce esta proximo do limite de horas contratadas. Restam apenas ${horasRestantes.toFixed(2)}h disponiveis.`
                              : `${Math.round(percentualUsado)}% das horas foram utilizadas. Considere solicitar mais horas se necessario.`}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Intervenções Recentes */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Intervenções Recentes
                    </h3>
                    <button
                      onClick={() => handleExportarRelatorio(contrato.id)}
                      className="flex items-center gap-2 text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Exportar Relatório
                    </button>
                  </div>

                  {intervencoesDoContrato.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhuma intervenção registrada</p>
                  ) : (
                    <div className="space-y-3">
                      {intervencoesDoContrato.slice(0, 5).map(intervencao => (
                        <div key={intervencao.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{intervencao.titulo}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(intervencao.dataCriacao).toLocaleDateString('pt-AO')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${intervencao.status === "Concluído" ? "bg-green-100 text-green-700" :
                              intervencao.status === "Em Andamento" ? "bg-blue-100 text-blue-700" :
                                intervencao.status === "Resolvido" ? "bg-purple-100 text-purple-700" :
                                  "bg-gray-100 text-gray-700"
                              }`}>
                              {intervencao.status}
                            </span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-purple-600" />
                              <span className="text-sm font-semibold text-purple-600">
                                {(intervencao.horasGastas || 0).toFixed(2)}h
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
