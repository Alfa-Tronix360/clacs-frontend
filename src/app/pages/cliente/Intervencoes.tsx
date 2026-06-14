import { Plus, Search, Star, MessageCircle, Upload, File, Image, X, Loader, CheckCircle, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { intervencoesAPI, clientesAPI, contratosAPI } from "../../services/api";
const API_BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:8001"
  : "https://clacs-backend.onrender.com";

export default function ClienteIntervencoes() {
  const [intervencoes, setIntervencoes] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [novaIntervencao, setNovaIntervencao] = useState({
    titulo: "",
    descricao: "",
    categoria: "Hardware",
    prioridade: "Média",
    anexos: [] as any[]
  });
  const [clienteId, setClienteId] = useState<string | null>(null);
  const usuarioId = localStorage.getItem('userId');

  // ✅ Nome do cliente do localStorage
  const nomeCliente = localStorage.getItem('userName') || 'Cliente';

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

      const [intervencoesRes, contratosRes] = await Promise.all([
        intervencoesAPI.listarPorCliente(clienteId!),
        contratosAPI.listarPorCliente(clienteId!)
      ]);

      if (intervencoesRes.success) {
        setIntervencoes(intervencoesRes.data);
      }
      if (contratosRes.success) {
        setContratos(contratosRes.data);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const temContratoAtivo = contratos.some(c => c.status === "Ativo");

  const handleAbrirModal = () => {
    if (!temContratoAtivo) return;
    setModalAberto(true);
  };

  const handleCriarIntervencao = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!temContratoAtivo) {
      alert('Não é possível criar intervenções sem um contrato ativo.');
      return;
    }

    try {
      const response = await intervencoesAPI.criar({
        titulo: novaIntervencao.titulo,
        descricao: novaIntervencao.descricao,
        categoria: novaIntervencao.categoria,
        prioridade: novaIntervencao.prioridade,
        clienteId: clienteId ?? "",
        anexos: novaIntervencao.anexos || []
      });

      if (response.success) {
        setModalAberto(false);
        setNovaIntervencao({
          titulo: "",
          descricao: "",
          categoria: "Hardware",
          prioridade: "Média",
          anexos: []
        });
        carregarDados();
        alert('Intervenção criada com sucesso!');
      } else {
        alert('Erro ao criar intervenção: ' + (response.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('❌ Erro ao criar intervenção:', error);
      alert('Erro ao criar intervenção');
    }
  };

  const handleFecharIntervencao = async (intervencaoId: string) => {
    if (!confirm('Tem certeza que deseja fechar esta intervenção? Confirme que o problema foi resolvido.')) {
      return;
    }

    try {
      await intervencoesAPI.atualizarStatus(intervencaoId, "Fechado");
      alert('Intervenção fechada com sucesso!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao fechar intervenção:', error);
      alert('Erro ao fechar intervenção');
    }
  };

  const handleVisualizarPDF = (intervencaoId: string) => {
    if (!intervencaoId) {
      alert('Erro: ID da intervenção não encontrado.');
      return;
    }

    // assinatura do técnico apenas
    const url =
      `${API_BASE_URL}/relatorios/intervencao/${intervencaoId}/visualizar`;

    window.open(url, '_blank');
  };

  // ✅ Passa o nome do cliente e a data para o backend assinar o PDF
  const handleDownloadPDF = (intervencaoId: string) => {
    if (!intervencaoId) {
      alert('Erro: ID da intervenção não encontrado.');
      return;
    }

    const dataAgora = new Date().toLocaleString('pt-AO');

    const url =
      `${API_BASE_URL}/relatorios/intervencao/${intervencaoId}/download` +
      `?cliente=${encodeURIComponent(nomeCliente)}` +
      `&data_cliente=${encodeURIComponent(dataAgora)}`;

    window.open(url, '_blank');
  };

  const intervencoesFiltradas = (intervencoes || []).filter(i => {
    const titulo = i.titulo || "";
    const descricao = i.descricao || "";
    return titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      descricao.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando intervenções...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Intervenções</h1>
          <p className="text-gray-600 mt-1">Crie e acompanhe suas solicitações de suporte</p>
        </div>
        <button
          onClick={handleAbrirModal}
          disabled={!temContratoAtivo}
          title={!temContratoAtivo ? "É necessário ter um contrato ativo para criar intervenções" : ""}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${temContratoAtivo
            ? "bg-purple-600 hover:bg-purple-700 text-white"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
        >
          <Plus className="w-5 h-5" />
          Nova Intervenção
        </button>
      </div>

      {!temContratoAtivo && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <FileText className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">Sem contrato ativo</p>
            <p className="text-sm text-yellow-700 mt-0.5">
              Não é possível criar novas intervenções sem um contrato ativo. Contacte o suporte para regularizar a sua situação.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{intervencoes.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Abertas</p>
          <p className="text-2xl font-bold text-blue-600">
            {intervencoes.filter(i => i.status === "Aberto").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Em Andamento</p>
          <p className="text-2xl font-bold text-yellow-600">
            {intervencoes.filter(i => i.status === "Em Andamento").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Concluídas</p>
          <p className="text-2xl font-bold text-green-600">
            {intervencoes.filter(i => i.status === "Concluído").length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar intervenções..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {intervencoesFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            {searchTerm ? "Nenhuma intervenção encontrada" : "Nenhuma intervenção criada ainda"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {intervencoesFiltradas.map(intervencao => (
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
                          <span className="text-gray-500">Categoria:</span>
                          <span className="font-medium text-gray-900">{intervencao.categoria}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Criado:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(intervencao.dataCriacao).toLocaleDateString('pt-AO')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Técnico:</span>
                          <span className="font-medium text-gray-900">ID {intervencao.tecnicoNome}</span>
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
                  <div className="bg-purple-50 px-4 py-2 rounded-lg">
                    <p className="text-xs text-purple-600 mb-1">Horas Gastas</p>
                    <p className="text-2xl font-bold text-purple-700">{(intervencao.horasGastas || 0).toFixed(2)}h</p>
                  </div>

                  {intervencao.status === "Resolvido" && (
                    <button
                      onClick={() => handleFecharIntervencao(intervencao.id)}
                      className="w-full lg:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Fechar e assinar Intervenção
                    </button>
                  )}

                  {["Resolvido", "Fechado", "Concluído"].includes(intervencao.status) && (
                    <button
                      onClick={() => handleDownloadPDF(intervencao.id)}
                      className="w-full lg:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Baixar Relatório (PDF)
                    </button>
                  )}

                  <button
                    onClick={() => handleVisualizarPDF(intervencao.id)}
                    className="w-full lg:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Visualizar PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Nova Intervenção</h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCriarIntervencao} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título da Intervenção *</label>
                <input
                  type="text"
                  required
                  value={novaIntervencao.titulo}
                  onChange={(e) => setNovaIntervencao({ ...novaIntervencao, titulo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Computador não liga"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
                <textarea
                  required
                  value={novaIntervencao.descricao}
                  onChange={(e) => setNovaIntervencao({ ...novaIntervencao, descricao: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Descreva o problema em detalhes..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
                  <select
                    value={novaIntervencao.categoria}
                    onChange={(e) => setNovaIntervencao({ ...novaIntervencao, categoria: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option>Hardware</option>
                    <option>Software</option>
                    <option>Rede</option>
                    <option>Segurança</option>
                    <option>Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade *</label>
                  <select
                    value={novaIntervencao.prioridade}
                    onChange={(e) => setNovaIntervencao({ ...novaIntervencao, prioridade: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option>Baixa</option>
                    <option>Média</option>
                    <option>Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Anexos (Opcional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Clique para selecionar arquivos ou arraste aqui</p>
                  <p className="text-xs text-gray-500">PDF, PNG, JPG até 10MB</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    id="fileInput"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const novosAnexos = files.map(file => ({
                        nome: file.name,
                        tipo: file.type,
                        tamanho: file.size
                      }));
                      setNovaIntervencao({ ...novaIntervencao, anexos: [...novaIntervencao.anexos, ...novosAnexos] });
                    }}
                  />
                  <label htmlFor="fileInput" className="inline-block mt-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg cursor-pointer transition-colors">
                    Selecionar Arquivos
                  </label>
                </div>

                {novaIntervencao.anexos.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {novaIntervencao.anexos.map((anexo: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-gray-700">{anexo.nome}</span>
                          <span className="text-xs text-gray-500">({(anexo.tamanho / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const novosAnexos = novaIntervencao.anexos.filter((_: any, i: number) => i !== index);
                            setNovaIntervencao({ ...novaIntervencao, anexos: novosAnexos });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Criar Intervenção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}