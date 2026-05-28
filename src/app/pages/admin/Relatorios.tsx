import { Download, BarChart3, PieChart, TrendingUp, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { clientesAPI, contratosAPI, intervencoesAPI, registrosHorasAPI } from "../../services/api";

export default function AdminRelatorios() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [intervencoes, setIntervencoes] = useState<any[]>([]);
  const [registrosHoras, setRegistrosHoras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [clientesRes, contratosRes, intervencoesRes, registrosRes] = await Promise.all([
        clientesAPI.listar(),
        contratosAPI.listar(),
        intervencoesAPI.listar(),
        registrosHorasAPI.listar()
      ]);

      if (clientesRes.success) setClientes(clientesRes.data);
      if (contratosRes.success) setContratos(contratosRes.data);
      if (intervencoesRes.success) setIntervencoes(intervencoesRes.data);
      if (registrosRes.success) setRegistrosHoras(registrosRes.data);
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
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  // Cálculos para os relatórios
  const totalClientes = clientes.length;
  const totalContratos = contratos.length;
  const totalIntervencoes = intervencoes.length;
  const totalHoras = registrosHoras.reduce((acc, r) => acc + (r.horas || 0), 0);
  const faturamentoTotal = contratos.reduce((acc, c) => acc + (c.valorMensal || 0), 0);

  const intervencoesPorStatus = {
    Aberto: intervencoes.filter(i => i.status === "Aberto").length,
    "Em Andamento": intervencoes.filter(i => i.status === "Em Andamento").length,
    "Aguardando Cliente": intervencoes.filter(i => i.status === "Aguardando Cliente").length,
    Concluído: intervencoes.filter(i => i.status === "Concluído").length
  };

  const intervencoesPorPrioridade = {
    Baixa: intervencoes.filter(i => i.prioridade === "Baixa").length,
    Média: intervencoes.filter(i => i.prioridade === "Média").length,
    Alta: intervencoes.filter(i => i.prioridade === "Alta").length
  };

  const intervencoesPorCategoria: Record<string, number> = {};
  intervencoes.forEach(i => {
    const cat = i.categoria || "Outros";
    intervencoesPorCategoria[cat] = (intervencoesPorCategoria[cat] || 0) + 1;
  });

  const clientesAtivos = clientes.filter(c => c.status === "Ativo").length;
  const contratosAtivos = contratos.filter(c => c.status === "Ativo").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios e Análises</h1>
          <p className="text-gray-600 mt-1">Visualize métricas e indicadores de desempenho</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Download className="w-5 h-5" />
          Exportar Relatório
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{totalClientes}</p>
              <p className="text-xs text-green-600 mt-1">{clientesAtivos} ativos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Faturamento Mensal</p>
              <p className="text-2xl font-bold text-gray-900">Kz {faturamentoTotal.toLocaleString('pt-AO')}</p>
              <p className="text-xs text-gray-600 mt-1">{contratosAtivos} contratos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <PieChart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Intervenções</p>
              <p className="text-2xl font-bold text-gray-900">{totalIntervencoes}</p>
              <p className="text-xs text-blue-600 mt-1">{intervencoesPorStatus["Em Andamento"]} em andamento</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Horas Totais</p>
              <p className="text-2xl font-bold text-gray-900">{totalHoras.toFixed(1)}h</p>
              <p className="text-xs text-gray-600 mt-1">Registradas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Intervenções por Status</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(intervencoesPorStatus).map(([status, count]) => {
              const total = totalIntervencoes || 1;
              const percentual = (count / total) * 100;
              
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{status}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        status === "Concluído" ? "bg-green-500" :
                        status === "Em Andamento" ? "bg-blue-500" :
                        status === "Aguardando Cliente" ? "bg-yellow-500" :
                        "bg-gray-500"
                      }`}
                      style={{ width: `${percentual}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Intervenções por Prioridade</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(intervencoesPorPrioridade).map(([prioridade, count]) => {
              const total = totalIntervencoes || 1;
              const percentual = (count / total) * 100;
              
              return (
                <div key={prioridade}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{prioridade}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        prioridade === "Alta" ? "bg-red-500" :
                        prioridade === "Média" ? "bg-yellow-500" :
                        "bg-green-500"
                      }`}
                      style={{ width: `${percentual}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">Intervenções por Categoria</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(intervencoesPorCategoria).map(([categoria, count]) => (
            <div key={categoria} className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">{categoria}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-500">
                  ({((count / totalIntervencoes) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Top Clientes por Intervenções</h2>
        </div>
        <div className="space-y-3">
          {clientes
            .map(cliente => ({
              ...cliente,
              totalIntervencoes: intervencoes.filter(i => i.clienteId === cliente.id).length
            }))
            .sort((a, b) => b.totalIntervencoes - a.totalIntervencoes)
            .slice(0, 5)
            .map((cliente, index) => (
              <div key={cliente.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{cliente.nome}</p>
                    <p className="text-sm text-gray-600">{cliente.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{cliente.totalIntervencoes}</p>
                  <p className="text-xs text-gray-500">intervenções</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
