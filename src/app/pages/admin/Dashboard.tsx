import {
  Users,
  FileText,
  ClipboardList,
  TrendingUp,
  AlertCircle,
  Clock,
  Trophy,
  Loader
} from "lucide-react";
import { useState, useEffect } from "react";
import { statsAPI, intervencoesAPI, contratosAPI, tecnicosAPI } from "../../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [intervencoes, setIntervencoes] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);

      const [statsRes, intervencoesRes, contratosRes, tecnicosRes] = await Promise.all([
        statsAPI.dashboard(),
        intervencoesAPI.listar(),
        contratosAPI.listar(),
        tecnicosAPI.listar()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (intervencoesRes.success) setIntervencoes(intervencoesRes.data);
      if (contratosRes.success) setContratos(contratosRes.data);
      if (tecnicosRes.success) setTecnicos(tecnicosRes.data);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const intervencoesUrgentes = intervencoes.filter(i => i.prioridade === "Alta" && i.status !== "Concluído");
  const contratosProximoLimite = contratos.filter(c => {
    if (c.tipo === "Por Hora" || !c.horasContratadas) return false;
    const percentual = (c.horasUsadas / c.horasContratadas) * 100;
    return percentual > 80;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="text-gray-600 mt-1">Visão geral do sistema CLACS</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Clientes</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalClientes || 0}</p>
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {stats?.clientesAtivos || 0} ativos
              </p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Contratos Ativos</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.contratosAtivos || 0}</p>
              <p className="text-sm text-gray-500 mt-2">
                Kz {((stats?.receitaMensal || 0) / 1000).toFixed(0)}k/mês
              </p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Intervenções Abertas</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.intervencoesAbertas || 0}</p>
              <p className="text-sm text-yellow-600 mt-2">{intervencoesUrgentes.length} urgentes</p>
            </div>
            <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Técnicos Ativos</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalTecnicos || 0}</p>
              <p className="text-sm text-gray-500 mt-2">
                {tecnicos.reduce((acc, t) => acc + (t.intervencoesAtivas || 0), 0)} intervenções
              </p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Alertas e Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Alertas Críticos</h2>
          </div>
          <div className="space-y-3">
            {intervencoesUrgentes.length === 0 && contratosProximoLimite.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum alerta no momento</p>
            ) : (
              <>
                {intervencoesUrgentes.map(intervencao => (
                  <div key={intervencao.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{intervencao.titulo}</p>
                      <p className="text-sm text-gray-600">ID: ...{intervencao.clienteId?.slice(-4)}</p>
                    </div>
                    <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">Alta</span>
                  </div>
                ))}

                {contratosProximoLimite.map(contrato => (
                  <div key={contrato.id} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Horas próximas do limite</p>
                      <p className="text-sm text-gray-600">
                        Cliente {contrato.clienteId?.slice(-4)} - {contrato.horasUsadas}/{contrato.horasContratadas}h
                      </p>
                    </div>
                    <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">
                      {Math.round((contrato.horasUsadas / contrato.horasContratadas) * 100)}%
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Ranking Técnicos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-gray-900">Ranking Técnicos (Este Mês)</h2>
          </div>
          <div className="space-y-3">
            {tecnicos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum técnico cadastrado</p>
            ) : (
              [...tecnicos].sort((a, b) => (b.horasMes || 0) - (a.horasMes || 0)).map((tecnico, index) => (
                <div key={tecnico.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-400 text-white' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-400 text-white' :
                          'bg-gray-200 text-gray-600'
                    }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{tecnico.nome}</p>
                    <p className="text-sm text-gray-600">{tecnico.horasMes || 0}h trabalhadas</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-600">
                      <span className="text-lg font-bold">{tecnico.avaliacaoMedia || 5.0}</span>
                    </div>
                    <p className="text-xs text-gray-500">{tecnico.intervencoesAtivas || 0} intervenções</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Intervenções Recentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Intervenções Recentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Título</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cliente ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Técnico ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Prioridade</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {intervencoes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Nenhuma intervenção cadastrada
                  </td>
                </tr>
              ) : (
                intervencoes.slice(0, 5).map(intervencao => (
                  <tr key={intervencao.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">{intervencao.numero}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{intervencao.titulo}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">...{intervencao.clienteId?.slice(-4)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{intervencao.tecnicoId ? `...${intervencao.tecnicoId.slice(-4)}` : '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded ${intervencao.prioridade === "Alta" ? "bg-red-100 text-red-700" :
                          intervencao.prioridade === "Média" ? "bg-yellow-100 text-yellow-700" :
                            "bg-green-100 text-green-700"
                        }`}>
                        {intervencao.prioridade}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded ${intervencao.status === "Concluído" ? "bg-green-100 text-green-700" :
                          intervencao.status === "Em Andamento" ? "bg-blue-100 text-blue-700" :
                            intervencao.status === "Aguardando Cliente" ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-700"
                        }`}>
                        {intervencao.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}