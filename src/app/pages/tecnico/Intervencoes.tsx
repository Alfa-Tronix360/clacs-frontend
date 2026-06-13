import { Search, Filter, Loader, CheckCircle, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { intervencoesAPI } from "../../services/api";
import { maskId } from "../../services/MaskId";

export default function TecnicoIntervencoes() {
  const navigate = useNavigate();
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [intervencoes, setIntervencoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");


  const tecnicoId = localStorage.getItem('tecnicoId') || localStorage.getItem('userId') || '1';
  const nomeTecnico = localStorage.getItem('userName') || 'Técnico';

  useEffect(() => {
    carregarIntervencoes();
  }, []);

  const carregarIntervencoes = async () => {
    try {
      setLoading(true);
      console.log('=== TÉCNICO: Carregando intervenções ===');
      console.log('Técnico ID do localStorage:', tecnicoId);

      console.log('Todos os dados do localStorage:');
      console.log('- userId:', localStorage.getItem('userId'));
      console.log('- tecnicoId:', localStorage.getItem('tecnicoId'));
      console.log('- userName:', localStorage.getItem('userName'));
      console.log('- userEmail:', localStorage.getItem('userEmail'));
      console.log('- userType:', localStorage.getItem('userType'));

      if (!tecnicoId) {
        console.error(' ERRO: tecnicoId não está definido no localStorage!');
        setErro('Técnico não identificado. Faça login novamente.');
        setLoading(false);
        return;
      }

      const response = await intervencoesAPI.listarPorTecnico(tecnicoId);
      console.log('Resposta da API:', response);

      if (response.success) {
        console.log('✅ Intervenções carregadas:', response.data.length);
        setIntervencoes(response.data);

        if (response.data.length === 0) {
          console.warn('⚠️ Nenhuma intervenção encontrada para o técnico:', tecnicoId);
        }
      } else {
        console.error('❌ Erro ao carregar intervenções:', response);
        setErro('Erro ao carregar intervenções');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar intervenções:', error);
      setErro('Erro ao carregar intervenções');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Passa o nome do técnico e a data para o backend assinar o PDF
  const handleVisualizarPDF = (intervencaoId: string) => {
    const dataAgora = new Date().toLocaleString('pt-AO');
    const url = `http://clacs-backend.onrender.com/relatorios/intervencao/${intervencaoId}/visualizar`;;

    window.open(url, '_blank');
  };

  const handleBaixarPDF = (intervencaoId: string) => {
    const dataAgora = new Date().toLocaleString('pt-AO');

    const url =
      `http://clacs-backend.onrender.com/relatorios/intervencao/${intervencaoId}/download` +
      `?tecnico=${encodeURIComponent(nomeTecnico)}` +
      `&data=${encodeURIComponent(dataAgora)}`;

    window.open(url, '_blank');
  };

  const intervencoesFiltradas = (intervencoes || []).filter(intervencao => {
    const matchStatus = filtroStatus === "Todos" || intervencao.status === filtroStatus;
    const titulo = intervencao.titulo || "";
    const matchSearch = titulo.toLowerCase().includes(searchTerm.toLowerCase());
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-900 mb-2">Erro ao Carregar Dados</h2>
          <p className="text-red-700 mb-4">{erro}</p>
          <div className="bg-white rounded-lg p-4 text-left max-w-md mx-auto">
            <p className="text-sm text-gray-700 mb-2 font-semibold">Informações de Diagnóstico:</p>
            <div className="space-y-1 text-xs font-mono text-gray-600">
              <p>userId: {maskId(localStorage.getItem('userId')) || 'NÃO DEFINIDO'}</p>
              <p>tecnicoId: {maskId(localStorage.getItem('tecnicoId')) || 'NÃO DEFINIDO'}</p>
              <p>userType: {localStorage.getItem('userType') || 'NÃO DEFINIDO'}</p>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Voltar ao Login
            </button>
            <p className="text-sm text-red-600">Faça login novamente para resolver o problema</p>
          </div>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{intervencoes.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Abertas</p>
          <p className="text-2xl font-bold text-blue-600">
            {intervencoes.filter(c => c.status === "Aberto").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Em Andamento</p>
          <p className="text-2xl font-bold text-yellow-600">
            {intervencoes.filter(c => c.status === "Em Andamento").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Concluídas</p>
          <p className="text-2xl font-bold text-green-600">
            {intervencoes.filter(c => c.status === "Concluído").length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar intervenções..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option>Todos</option>
            <option>Aberto</option>
            <option>Em Andamento</option>
            <option>Aguardando Cliente</option>
            <option>Concluído</option>
          </select>
        </div>
      </div>

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
                      intervencao.prioridade === "Média" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                      {intervencao.prioridade} Prioridade
                    </span>

                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${intervencao.status === "Concluído" ? "bg-green-100 text-green-700" :
                      intervencao.status === "Em Andamento" ? "bg-blue-100 text-blue-700" :
                        intervencao.status === "Aguardando Cliente" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                      }`}>
                      {intervencao.status}
                    </span>
                  </div>
                </div>

                <div className="lg:text-right space-y-2">
                  <div className="bg-green-50 px-4 py-2 rounded-lg">
                    <p className="text-xs text-green-600 mb-1">Horas Gastas</p>

                    <p className="text-2xl font-bold text-green-700">
                      {Number(intervencao.horasGastas || intervencao.horas_gastas || 0).toFixed(2)}h
                    </p>
                  </div>

                  <button
                    onClick={() => handleVisualizarPDF(intervencao.id)}
                    className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Visualizar PDF
                  </button>

                  <button
                    onClick={() => handleBaixarPDF(intervencao.id)}
                    className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >

                    <FileText className="w-4 h-4" />
                    Baixar PDF

                  </button>

                  {!["Resolvido", "Fechado", "Concluído"].includes(intervencao.status) && (
                    <button
                      onClick={() => navigate('/tecnico/horas', { state: { intervencaoId: intervencao.id } })}
                      className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
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