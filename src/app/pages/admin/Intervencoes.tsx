import { Search, Plus, Filter, Upload, File, X, Loader, Edit, CheckCircle, FileText } from "lucide-react";
import React, { useState, useEffect } from "react";
import { intervencoesAPI, clientesAPI, tecnicosAPI } from "../../services/api";
const API_BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:8001"
  : "https://clacs-backend.onrender.com";

export default function AdminIntervencoes() {
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarEdicao, setMostrarEdicao] = useState(false);
  const [intervencaoEditando, setIntervencaoEditando] = useState<any>(null);
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState(""); // ✅ estado controlado
  const [arquivosAnexados, setArquivosAnexados] = useState<Array<{ nome: string, tipo: string, tamanho: number, preview?: string }>>([]);
  const [intervencoes, setIntervencoes] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarPDF, setMostrarPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  const [formData, setFormData] = useState({
    clienteId: "",
    tecnicoId: "",
    titulo: "",
    descricao: "",
    categoria: "Geral",
    prioridade: "Média",
    status: "Aberto"
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [intervencoesRes, clientesRes, tecnicosRes] = await Promise.all([
        intervencoesAPI.listar(),
        clientesAPI.listar(),
        tecnicosAPI.listar()
      ]);

      if (intervencoesRes.success) {
        setIntervencoes(intervencoesRes.data);
      }
      if (clientesRes.success) {
        setClientes(clientesRes.data);
      }
      if (tecnicosRes.success) {
        setTecnicos(tecnicosRes.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log('=== ADMIN CRIANDO INTERVENÇÃO ===');
      console.log('Dados do formulário:', formData);

      const response = await intervencoesAPI.criar({
        titulo: formData.titulo,
        descricao: formData.descricao,
        categoria: formData.categoria,
        prioridade: formData.prioridade,
        clienteId: formData.clienteId,
        tecnicoId: formData.tecnicoId || null,
        anexos: arquivosAnexados
      });

      console.log('Resposta da API:', response);

      if (response.success) {
        setMostrarFormulario(false);
        setFormData({
          clienteId: "",
          tecnicoId: "",
          titulo: "",
          descricao: "",
          categoria: "Geral",
          prioridade: "Média",
          status: "Aberto"
        });
        setArquivosAnexados([]);
        carregarDados();
        alert('Intervenção criada com sucesso!');
      } else {
        console.error('Erro na resposta:', response);
        alert('Erro ao criar intervenção: ' + (response.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('❌ Erro ao criar intervenção:', error);
      alert('Erro ao criar intervenção');
    }
  };

  // ✅ Corrigido: inicializa o estado tecnicoSelecionado ao abrir o modal
  const abrirEdicaoTecnico = (intervencao: any) => {
    setIntervencaoEditando(intervencao);
    setTecnicoSelecionado(intervencao.tecnicoId || intervencao.tecnico_id || "");
    setMostrarEdicao(true);
  };

  const handleAtualizarTecnico = async (novoTecnicoId: string) => {
    if (!intervencaoEditando) return;

    try {
      console.log('=== ATUALIZANDO TÉCNICO NO FRONTEND ===');
      console.log('ID da intervenção:', intervencaoEditando.id);
      console.log('Novo técnico ID:', novoTecnicoId);
      console.log('Intervenção completa:', intervencaoEditando);

      const payload = {
        tecnico_id: novoTecnicoId
      };

      console.log('Payload enviado:', payload);

      const response = await intervencoesAPI.atualizar(intervencaoEditando.id, payload);

      console.log('Resposta da API:', response);

      if (response.success) {
        setIntervencoes(prev =>
          prev.map(i => i.id === intervencaoEditando.id
            ? { ...i, tecnicoId: novoTecnicoId, tecnico_id: novoTecnicoId }
            : i
          )
        );
        setMostrarEdicao(false);
        setIntervencaoEditando(null);
        setTecnicoSelecionado("");
        alert('Técnico atribuído com sucesso!');
        await carregarDados();
      } else {
        alert('Erro ao atribuir técnico: ' + (response.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao atualizar técnico:', error);
      alert('Erro ao atribuir técnico: ' + error);
    }
  };

  const handleConcluirIntervencao = async (intervencaoId: string) => {
    if (!confirm('Tem certeza que deseja concluir esta intervenção? Esta ação marca a intervenção como finalizada.')) {
      return;
    }

    try {
      console.log('=== ADMIN CONCLUINDO INTERVENÇÃO ===');
      console.log('IntervencaoId:', intervencaoId);

      await intervencoesAPI.atualizarStatus(intervencaoId, "Concluído");
      alert('Intervenção concluída com sucesso!');
      carregarDados();
    } catch (error) {
      console.error('Erro ao concluir intervenção:', error);
      alert('Erro ao concluir intervenção');
    }
  };

  const handleEliminarIntervencao = async (intervencaoId: string) => {
    if (!confirm('Tem certeza que deseja eliminar esta intervenção? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await intervencoesAPI.deletar(intervencaoId);
      if (response.success) {
        alert('Intervenção eliminada com sucesso!');
        carregarDados();
      } else {
        alert('Erro ao eliminar intervenção: ' + (response.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao eliminar intervenção:', error);
      alert('Erro ao eliminar intervenção');
    }
  };




  const handleDownloadPDF = (intervencaoId: string) => {
    if (!intervencaoId) {
      alert('Erro: ID da intervenção não encontrado.');
      return;
    }
    const url = `http://${API_BASE_URL}/relatorios/intervencao/${intervencaoId}/visualizar`;

    setPdfUrl(url);
    setMostrarPDF(true);

  };

  const intervencoesFiltradas = intervencoes.filter(intervencao => {
    const matchStatus = filtroStatus === "Todos" || intervencao.status === filtroStatus;
    const matchPrioridade = filtroPrioridade === "Todos" || intervencao.prioridade === filtroPrioridade;
    const matchSearch = intervencao.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchPrioridade && matchSearch;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const novosArquivos = Array.from(files).map(file => {
      const arquivo = {
        nome: file.name,
        tipo: file.type,
        tamanho: file.size,
        preview: undefined as string | undefined
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          arquivo.preview = reader.result as string;
          setArquivosAnexados(prev => [...prev.filter(a => a.nome !== arquivo.nome), arquivo]);
        };
        reader.readAsDataURL(file);
      }

      return arquivo;
    });

    setArquivosAnexados(prev => [...prev, ...novosArquivos.filter(a => !a.preview)]);
  };

  const removerArquivo = (index: number) => {
    setArquivosAnexados(prev => prev.filter((_, i) => i !== index));
  };

  const formatarTamanho = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando intervenções...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Intervenções</h1>
          <p className="text-gray-600 mt-1">Visualize e gerencie todas as intervenções</p>
        </div>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Intervenção
        </button>
      </div>

      {/* Formulário de Nova Intervenção */}
      {mostrarFormulario && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Nova Intervenção</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
                <select
                  required
                  value={formData.clienteId}
                  onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o cliente...</option>
                  {clientes.filter(c => c.status === "Ativo").map(cliente => (
                    <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Técnico</label>
                <select
                  value={formData.tecnicoId}
                  onChange={(e) => setFormData({ ...formData, tecnicoId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o técnico...</option>
                  {tecnicos.map(tecnico => (
                    <option key={tecnico.id} value={tecnico.id}>{tecnico.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
              <input
                type="text"
                required
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Descreva brevemente o problema..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição Detalhada</label>
              <textarea
                rows={4}
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Forneça mais detalhes sobre o problema ou solicitação..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Geral</option>
                  <option>Hardware</option>
                  <option>Software</option>
                  <option>Rede</option>
                  <option>Segurança</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                <select
                  value={formData.prioridade}
                  onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Baixa</option>
                  <option>Média</option>
                  <option>Alta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Aberto</option>
                  <option>Em Andamento</option>
                  <option>Aguardando Cliente</option>
                  <option>Concluído</option>
                </select>
              </div>
            </div>

            {/* Upload de Arquivos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anexar Imagens ou Documentos
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="admin-file-upload"
                />
                <label
                  htmlFor="admin-file-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Clique para carregar arquivos
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, PDF, DOC (máx. 10MB cada)
                  </p>
                </label>
              </div>

              {arquivosAnexados.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Arquivos anexados ({arquivosAnexados.length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {arquivosAnexados.map((arquivo, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg group hover:bg-gray-100 transition-colors"
                      >
                        {arquivo.preview ? (
                          <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                            <img
                              src={arquivo.preview}
                              alt={arquivo.nome}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 flex-shrink-0 bg-blue-100 rounded flex items-center justify-center">
                            <File className="w-6 h-6 text-blue-600" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {arquivo.nome}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatarTamanho(arquivo.tamanho)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removerArquivo(index)}
                          className="flex-shrink-0 w-6 h-6 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remover arquivo"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Criar Intervenção
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrarFormulario(false);
                  setArquivosAnexados([]);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{intervencoes.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Abertos</p>
          <p className="text-2xl font-bold text-blue-600">{intervencoes.filter(c => c.status === "Aberto").length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Em Andamento</p>
          <p className="text-2xl font-bold text-yellow-600">{intervencoes.filter(c => c.status === "Em Andamento").length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Concluídos</p>
          <p className="text-2xl font-bold text-green-600">{intervencoes.filter(c => c.status === "Concluído").length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar intervenções..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Todos</option>
            <option>Aberto</option>
            <option>Em Andamento</option>
            <option>Resolvido</option>
            <option>Fechado</option>
            <option>Concluído</option>
          </select>
          <select
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Todos</option>
            <option>Baixa</option>
            <option>Média</option>
            <option>Alta</option>
          </select>
        </div>
      </div>

      {/* Lista de Intervenções */}
      {intervencoesFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Nenhuma intervenção encontrada</p>
        </div>




      ) : (
        <div className="space-y-4">
          {intervencoesFiltradas.map(intervencao => {
            const cliente = clientes.find(c => c.id === intervencao.clienteId);
            const tecnico = tecnicos.find(t => t.id === intervencao.tecnicoId);

            return (
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
                            <span className="font-medium text-gray-900">{cliente ? cliente.nome : 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Técnico:</span>
                            <span className="font-medium text-gray-900">{tecnico ? tecnico.nome : 'Não atribuído'}</span>
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
                    <div className="bg-blue-50 px-4 py-2 rounded-lg">
                      <p className="text-xs text-blue-600 mb-1">Horas Gastas</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {Number(intervencao.horasGastas || intervencao.horas_gastas || 0).toFixed(2)}h
                      </p>
                    </div>

                    <button
                      onClick={() => handleDownloadPDF(intervencao.id)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Baixar PDF
                    </button>

                    {/* Botão Eliminar - apenas para intervenções em Aberto */}
                    {intervencao.status === "Aberto" && (
                      <button
                        onClick={() => handleEliminarIntervencao(intervencao.id)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Eliminar
                      </button>)}

                    {/* Botão Atribuir Técnico - apenas para estados não finais */}
                    {intervencao.status !== "Concluído" &&
                      intervencao.status !== "Resolvido" &&
                      intervencao.status !== "Fechado" && (
                        <button
                          onClick={() => abrirEdicaoTecnico(intervencao)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Atribuir Técnico
                        </button>
                      )}

                    {/* Botão Concluir - apenas quando Fechado */}
                    {intervencao.status === "Fechado" && (
                      <button
                        onClick={() => handleConcluirIntervencao(intervencao.id)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Concluir Intervenção
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ Modal de Atribuição de Técnico - corrigido */}
      {mostrarEdicao && intervencaoEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Atribuir Técnico</h3>
            <p className="text-sm text-gray-600 mb-4">
              Intervenção: <strong>{intervencaoEditando.titulo}</strong>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Selecione o Técnico</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={tecnicoSelecionado}
                onChange={(e) => setTecnicoSelecionado(e.target.value)}
              >
                <option value="">Selecione...</option>
                {tecnicos.map(tecnico => (
                  <option key={tecnico.id} value={tecnico.id}>
                    {tecnico.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleAtualizarTecnico(tecnicoSelecionado)}
                disabled={!tecnicoSelecionado}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Confirmar
              </button>
              <button
                onClick={() => {
                  setMostrarEdicao(false);
                  setIntervencaoEditando(null);
                  setTecnicoSelecionado("");
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal PDF */}
      {mostrarPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Relatório da Intervenção
              </h2>

              <button
                onClick={() => {
                  setMostrarPDF(false);
                  setPdfUrl("");
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* PDF */}
            <div className="flex-1 bg-gray-100">
              <iframe
                src={pdfUrl}
                title="PDF"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
