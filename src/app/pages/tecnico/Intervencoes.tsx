import { Search, Filter, Loader, CheckCircle, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { intervencoesAPI } from "../../services/api";
import { maskId } from "../../services/MaskId";

const API_BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:8001"
  : "https://clacs-backend.onrender.com";

export default function TecnicoIntervencoes() {
  const navigate = useNavigate();
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [intervencoes, setIntervencoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const tecnicoId = localStorage.getItem('tecnicoId') || localStorage.getItem('userId') || '';
  const nomeTecnico = localStorage.getItem('userName') || 'Técnico';

  useEffect(() => { carregarIntervencoes(); }, []);

  const carregarIntervencoes = async () => {
    try {
      setLoading(true);
      if (!tecnicoId) {
        setErro('Técnico não identificado. Faça login novamente.');
        setLoading(false);
        return;
      }
      const response = await intervencoesAPI.listarPorTecnico(tecnicoId);
      if (response.success) {
        setIntervencoes(response.data);
      } else {
        setErro('Erro ao carregar intervenções');
      }
    } catch (error) {
      setErro('Erro ao carregar intervenções');
    } finally {
      setLoading(false);
    }
  };

  const handleResolver = (intervencao: any) => {
    // Guardar no sessionStorage e navegar para Horas
    sessionStorage.setItem('resolver_intervencao_id', intervencao.id);
    navigate('/tecnico/horas');
  };

  const handleVisualizarPDF = (intervencaoId: string) => {
    window.open(`${API_BASE_URL}/relatorios/intervencao/${intervencaoId}/visualizar`, '_blank');
  };

  const handleBaixarPDF = (intervencaoId: string) => {
    const dataAgora = new Date().toLocaleString('pt-AO');
    const url = `${API_BASE_URL}/relatorios/intervencao/${intervencaoId}/download` +
      `?tecnico=${encodeURIComponent(nomeTecnico)}&data=${encodeURIComponent(dataAgora)}`;
    window.open(url, '_blank');
  };

  const intervencoesFiltradas = (intervencoes || []).filter(intervencao => {
    const matchStatus = filtroStatus === "Todos" || intervencao.status === filtroStatus;
    const matchSearch = (intervencao.titulo || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando intervenções...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Intervenções</h1>
          <p className="text-gray-600 mt-1">Gerencie todas as suas intervenções atribuídas</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold text-red-900 mb-2">Erro ao Carregar Dados</h2>
          <p className="text-red-700 mb-4">{erro}</p>
          <div className="bg-white rounded-lg p-4 text-left max-w-md mx-auto mb-6">
            <p className="text-sm text-gray-700 mb-2 font-semibold">Diagnóstico:</p>
            <div className="space-y-1 text-xs font-mono text-gray-600">
              <p>userId: {maskId(localStorage.getItem('userId')) || 'NÃO DEFINIDO'}</p>
              <p>tecnicoId: {maskId(localStorage.getItem('tecnicoId')) || 'NÃO DEFINIDO'}</p>
              <p>userType: {localStorage.getItem('userType') || 'NÃO DEFINIDO'}</p>
            </div>
          </div>
          <button onClick={() => window.location.href = '/'} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Minhas Intervenções</h1>
        <p className="text-gray-600 mt-1">Gerencie todas as suas intervenções atribuídas</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", valor: intervencoes.length, cor: "text-gray-900" },
          { label: "Abertas", valor: intervencoes.filter(i => i.status === "Aberto").length, cor: "text-blue-600" },
          { label: "Em Andamento", valor: intervencoes.filter(i => i.status === "Em Andamento").length, cor: "text-yellow-600" },
          { label: "Concluídas", valor: intervencoes.filter(i => i.status === "Concluído").length, cor: "text-green-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.cor}`}>{stat.valor}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar intervenções..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
            <option>Todos</option>
            <option>Aberto</option>
            <option>Em Andamento</option>
            <option>Aguardando Cliente</option>
            <option>Concluído</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-4">
        {intervencoesFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Nenhuma intervenção encontrada</p>
          </div>
        ) : (
          intervencoesFiltradas.map(intervencao => (
            <div key={intervencao.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-sm font-mono text-gray-500 mt-1">{intervencao.numero}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{intervencao.titulo}</h3>
                      <p className="text-sm text-gray-600 mb-3">{intervencao.descricao}</p>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Cliente:</span>
                          <span className="font-medium text-gray-900">{intervencao.clienteNome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Categoria:</span>
                          <span className="font-medium text-gray-900">{intervencao.categoria}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Criado:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(intervencao.dataCriacao).toLocaleDateString('pt-AO')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${intervencao.prioridade === "Alta" ? "bg-red-100 text-red-700" :
                      intervencao.prioridade === "Média" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                      {intervencao.prioridade} Prioridade
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${intervencao.status === "Concluído" ? "bg-green-100 text-green-700" :
                      intervencao.status === "Em Andamento" ? "bg-blue-100 text-blue-700" :
                        intervencao.status === "Aguardando Cliente" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
                      {intervencao.status}
                    </span>
                  </div>
                </div>

                <div className="lg:text-right space-y-2 min-w-[180px]">
                  <div className="bg-green-50 px-4 py-2 rounded-lg">
                    <p className="text-xs text-green-600 mb-1">Horas Gastas</p>
                    <p className="text-2xl font-bold text-green-700">
                      {Number(intervencao.horasGastas || intervencao.horas_gastas || 0).toFixed(2)}h
                    </p>
                  </div>

                  <button onClick={() => handleVisualizarPDF(intervencao.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                    <FileText className="w-4 h-4" /> Visualizar PDF
                  </button>

                  <button onClick={() => handleBaixarPDF(intervencao.id)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                    <FileText className="w-4 h-4" /> Baixar PDF
                  </button>

                  {!["Resolvido", "Fechado", "Concluído"].includes(intervencao.status) && (
                    <button
                      onClick={() => handleResolver(intervencao)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Resolver
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
