import { FileText, Plus, AlertCircle, TrendingUp, Clock, Loader, X, Calendar, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { contratosAPI, clientesAPI, intervencoesAPI } from "../../services/api";



export default function AdminContratos() {
  const [contratos, setContratos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [contratoEditando, setContratoEditando] = useState<any>(null);
  const [formData, setFormData] = useState({
    clienteId: "",
    tipo: "Mensal",
    horasContratadas: "",
    valorMensal: "",
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: ""
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [contratosRes, clientesRes] = await Promise.all([
        contratosAPI.listar(),
        clientesAPI.listar()
      ]);

      if (contratosRes.success) {
        setContratos(contratosRes.data);
      }
      if (clientesRes.success) {
        setClientes(clientesRes.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = () => {
    setContratoEditando(null);
    setFormData({
      clienteId: "",
      tipo: "Mensal",
      horasContratadas: "",
      valorMensal: "",
      dataInicio: new Date().toISOString().split('T')[0],
      dataFim: ""
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setContratoEditando(null);
  };


  const editarContrato = (contrato: any) => {
    setContratoEditando(contrato);
    setFormData({
      clienteId: contrato.clienteId || contrato.cliente_id || "",
      tipo: contrato.tipo || "Mensal",
      horasContratadas: String(contrato.horasContratadas ?? contrato.horas_contratadas ?? ""),
      valorMensal: String(contrato.valorMensal ?? contrato.valor_mensal ?? ""),
      dataInicio: (contrato.dataInicio || contrato.data_inicio || "").split('T')[0] || new Date().toISOString().split('T')[0],
      dataFim: (contrato.dataFim || contrato.data_fim || "").split('T')[0] || ""
    });
    setModalAberto(true);
  };

  const deletarContrato = async (id: number) => {
    const confirmar = window.confirm("Tem certeza que deseja eliminar este contrato?");
    if (!confirmar) return;

    try {
      const response = await contratosAPI.deletar(id.toString());

      if (!response.success) {
        const erro = response.error || '';

        if (erro.includes('intervenções associadas')) {
          const contrato = contratos.find(c => c.id === id);
          const clienteId = contrato?.clienteId || contrato?.cliente_id;

          const confirmarTudo = confirm(
            erro + '\n\nDeseja eliminar TODAS as intervenções deste cliente agora?'
          );

          if (confirmarTudo && clienteId) {
            await intervencoesAPI.deletarPorCliente(clienteId);
            const retry = await contratosAPI.deletar(id.toString());
            if (retry.success) {
              setContratos(prev => prev.filter(c => c.id !== id));
              alert('Intervenções e contrato eliminados com sucesso!');
            } else {
              alert(retry.error || 'Erro ao eliminar contrato');
            }
          }
          return;
        }

        alert(erro || 'Erro ao eliminar contrato');
        return;
      }

      setContratos(prev => prev.filter(c => c.id !== id));
      alert("Contrato eliminado com sucesso!");
    } catch (error: any) {
      console.error("ERRO COMPLETO:", error);
      alert(error?.message || JSON.stringify(error) || "Erro ao eliminar contrato");
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const contratoData = {
        clienteId: formData.clienteId,
        tipo: formData.tipo,
        horasContratadas: formData.horasContratadas ? parseInt(formData.horasContratadas) : 0,
        valorMensal: formData.valorMensal ? parseFloat(formData.valorMensal) : 0,
        dataInicio: formData.dataInicio,
        dataFim: formData.dataFim || null
      };

      const response = contratoEditando
        ? await contratosAPI.atualizar(contratoEditando.id, contratoData)
        : await contratosAPI.criar(contratoData);

      if (response.success) {
        // Recarregar todos os dados do servidor para garantir sincronização completa
        await carregarDados();
        fecharModal();
        alert(contratoEditando ? 'Contrato atualizado com sucesso!' : 'Contrato criado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro ao salvar contrato:', error);
      alert(error.message || 'Erro ao salvar contrato');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando contratos...</p>
        </div>
      </div>
    );
  }

  const contratosAtivos = contratos.filter(c => c.status === "Ativo");
  const faturamentoMensal = contratos.reduce((acc, c) => acc + (c.valorMensal !== undefined ? c.valorMensal : (c.valor_mensal || 0)), 0);
  const horasDisponiveis = contratos.reduce((acc, c) => {
    const horasContratadas = c.horasContratadas !== undefined ? c.horasContratadas : (c.horas_contratadas || 0);
    const horasUsadas = c.horasUsadas !== undefined ? c.horasUsadas : (c.horas_usadas || 0);
    return acc + (horasContratadas - horasUsadas);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Contratos</h1>
          <p className="text-gray-600 mt-1">Acompanhe horas e valores dos contratos</p>
        </div>
        <button
          onClick={abrirModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Contrato
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Contratos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{contratosAtivos.length}</p>
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
              <p className="text-2xl font-bold text-gray-900">
                Kz {faturamentoMensal.toLocaleString('pt-AO')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Horas Disponíveis</p>
              <p className="text-2xl font-bold text-gray-900">{horasDisponiveis.toFixed(2)}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Contratos */}
      {contratos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Nenhum contrato cadastrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contratos.map(contrato => {
            const horasContratadas = contrato.horasContratadas !== undefined ? contrato.horasContratadas : (contrato.horas_contratadas || 0);
            const horasUsadas = contrato.horasUsadas !== undefined ? contrato.horasUsadas : (contrato.horas_usadas || 0);
            const percentualUsado = horasContratadas > 0 && contrato.tipo !== "Por Hora"
              ? (horasUsadas / horasContratadas) * 100
              : 0;
            const alertaNivel = percentualUsado > 90 ? "danger" : percentualUsado > 70 ? "warning" : "safe";

            return (
              <div key={contrato.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                {/* Cabeçalho do Card */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">


                      <div className="flex items-start justify-between w-full gap-4">

                        <div className="flex items-center gap-3 flex-wrap">

                          <h3 className="text-lg font-semibold text-gray-900">
                            {contrato.clienteNome || contrato.cliente?.nome || contrato.clientes?.nome || 'Cliente não encontrado'}
                          </h3>

                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${contrato.status === "Ativo"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                            }`}>
                            {contrato.status}
                          </span>

                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${contrato.tipo === "Mensal"
                            ? "bg-blue-100 text-blue-700"
                            : contrato.tipo === "Anual"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-orange-100 text-orange-700"
                            }`}>
                            {contrato.tipo}
                          </span>

                        </div>

                        {/* BOTÕES CRUD */}
                        <div className="flex items-center gap-2">

                          <button
                            onClick={() => editarContrato(contrato)}
                            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => deletarContrato(contrato.id)}
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                          >
                            Eliminar
                          </button>

                        </div>

                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                      {(contrato.dataInicio || contrato.data_inicio) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-gray-500">Início:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {new Date(contrato.dataInicio || contrato.data_inicio).toLocaleDateString('pt-AO')}
                            </span>
                          </div>
                        </div>
                      )}

                      {(contrato.dataFim || contrato.data_fim) && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-gray-500">Fim:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {new Date(contrato.dataFim || contrato.data_fim).toLocaleDateString('pt-AO')}
                            </span>
                          </div>
                        </div>
                      )}

                      {(contrato.valorMensal !== undefined ? contrato.valorMensal : contrato.valor_mensal) > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <div>
                            <span className="text-gray-500">Valor:</span>
                            <span className="ml-1 font-semibold text-green-600">
                              Kz {(contrato.valorMensal !== undefined ? contrato.valorMensal : contrato.valor_mensal).toLocaleString('pt-AO')}/mês
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {contrato.tipo !== "Por Hora" && (
                    <div className="bg-blue-50 rounded-lg p-4 min-w-[180px]">
                      <div className="text-center">
                        <p className="text-xs text-blue-600 font-medium mb-1">Horas Utilizadas</p>
                        <p className="text-3xl font-bold text-blue-700 mb-1">
                          {Math.round(percentualUsado)}%
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">{horasUsadas.toFixed(2)}h de {horasContratadas.toFixed(2)}h</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <p className="text-xs text-blue-600">
                            <span className="font-semibold">{(horasContratadas - horasUsadas).toFixed(2)}h</span> restantes
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
                      <p className="text-lg font-bold text-green-600">{(horasContratadas - horasUsadas).toFixed(2)}h</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Total Contrato</p>
                      <p className="text-lg font-bold text-blue-600">{horasContratadas.toFixed(2)}h</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Média/Dia</p>
                      <p className="text-lg font-bold text-purple-600">
                        {(contrato.dataInicio || contrato.data_inicio) ?
                          (horasUsadas / Math.max(1, Math.ceil((Date.now() - new Date(contrato.dataInicio || contrato.data_inicio).getTime()) / (1000 * 60 * 60 * 24)))).toFixed(2)
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
                          className={`h-3 rounded-full transition-all ${alertaNivel === "danger" ? "bg-gradient-to-r from-red-500 to-red-600" :
                            alertaNivel === "warning" ? "bg-gradient-to-r from-yellow-500 to-yellow-600" :
                              "bg-gradient-to-r from-green-500 to-green-600"
                            }`}
                          style={{ width: `${Math.min(percentualUsado, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Alertas */}
                    {alertaNivel !== "safe" && (
                      <div className={`flex items-start gap-3 p-4 rounded-lg ${alertaNivel === "danger"
                        ? "bg-red-50 border border-red-200"
                        : "bg-yellow-50 border border-yellow-200"
                        }`}>
                        <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${alertaNivel === "danger" ? "text-red-600" : "text-yellow-600"
                          }`} />
                        <div className="flex-1">
                          <p className={`text-sm font-semibold mb-1 ${alertaNivel === "danger" ? "text-red-800" : "text-yellow-800"
                            }`}>
                            {alertaNivel === "danger"
                              ? "Alerta Crítico: Limite de Horas Próximo!"
                              : "Atenção: Uso Elevado de Horas"}
                          </p>
                          <p className={`text-xs ${alertaNivel === "danger" ? "text-red-700" : "text-yellow-700"
                            }`}>
                            {alertaNivel === "danger"
                              ? `Restam apenas ${horasContratadas - horasUsadas}h disponíveis. Entre em contato com o cliente para renovação ou upgrade do contrato.`
                              : `${Math.round(percentualUsado)}% das horas foram utilizadas. Monitore o uso para evitar exceder o limite contratado.`}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criar/Editar Contrato */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{contratoEditando ? 'Editar Contrato' : 'Novo Contrato'}</h2>
              <button onClick={fecharModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <select
                  required
                  value={formData.clienteId}
                  onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.filter(c => c.status === "Ativo").map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Contrato *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Mensal</option>
                  <option>Anual</option>
                  <option>Por Hora</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horas Contratadas
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.horasContratadas}
                  onChange={(e) => setFormData({ ...formData, horasContratadas: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Mensal (Kz)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.valorMensal}
                  onChange={(e) => setFormData({ ...formData, valorMensal: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="250000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Fim
                  </label>
                  <input
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {contratoEditando ? 'Salvar Alterações' : 'Criar Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
