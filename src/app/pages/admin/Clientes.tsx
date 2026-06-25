import { Search, Plus, Edit, Trash2, CheckCircle, XCircle, Loader, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { clientesAPI } from "../../services/api";

export default function AdminClientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    senha: "",
    status: "Ativo"
  });

  useEffect(() => { carregarClientes(); }, []);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const response = await clientesAPI.listar();
      if (response.success) setClientes(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (cliente?: any) => {
    if (cliente) {
      setClienteEditando(cliente);
      setFormData({ nome: cliente.nome, email: cliente.email, telefone: cliente.telefone || "", senha: "", status: cliente.status });
    } else {
      setClienteEditando(null);
      setFormData({ nome: "", email: "", telefone: "", senha: "", status: "Ativo" });
    }
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setClienteEditando(null);
    setFormData({ nome: "", email: "", telefone: "", senha: "", status: "Ativo" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (clienteEditando) {
        const response = await clientesAPI.atualizar(clienteEditando.id, formData);
        if (response.success) {
          setClientes(clientes.map(c => c.id === clienteEditando.id ? { ...c, ...response.data } : c));
          alert('Cliente actualizado com sucesso!');
          fecharModal();
        } else {
          alert(response.error || 'Erro ao actualizar cliente');
        }
      } else {
        const response = await clientesAPI.criar(formData);
        if (response.success) {
          setClientes([...clientes, response.data]);
          alert('Cliente criado com sucesso!');
          fecharModal();
        } else {
          alert(response.error || 'Erro ao criar cliente');
        }
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar cliente');
    }
  };

  const handleEliminar = async (cliente: any) => {
    if (!confirm(`Tem certeza que deseja eliminar o cliente "${cliente.nome}"?`)) return;

    try {
      const response = await clientesAPI.deletar(cliente.id);
      if (response.success) {
        setClientes(clientes.filter(c => c.id !== cliente.id));
        alert('Cliente eliminado com sucesso!');
      } else {
        // Mostrar mensagem de erro com a regra de negócio
        alert(response.error || 'Erro ao eliminar cliente');
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao eliminar cliente');
    }
  };

  const handleToggleStatus = async (cliente: any) => {
    const novoStatus = cliente.status === "Ativo" ? "Inativo" : "Ativo";
    try {
      const response = await clientesAPI.atualizar(cliente.id, { status: novoStatus });
      if (response.success) {
        setClientes(clientes.map(c => c.id === cliente.id ? { ...c, status: novoStatus } : c));
      } else {
        alert(response.error || 'Erro ao actualizar status');
      }
    } catch (error) {
      alert('Erro ao actualizar status do cliente');
    }
  };

  const filteredClientes = clientes.filter(cliente => {
    const matchSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filtroStatus === "Todos" || cliente.status === filtroStatus;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Clientes</h1>
          <p className="text-gray-600 mt-1">Administre todos os clientes cadastrados</p>
        </div>
        <button onClick={() => abrirModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-5 h-5" /> Novo Cliente
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar por nome ou email..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Todos</option>
            <option>Ativo</option>
            <option>Inativo</option>
          </select>
        </div>
      </div>

      {/* Cards */}
      {filteredClientes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredClientes.map(cliente => (
            <div key={cliente.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{cliente.nome}</h3>
                  <p className="text-sm text-gray-600">{cliente.email}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${cliente.status === "Ativo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {cliente.status === "Ativo" ? <><CheckCircle className="w-3 h-3" /> Ativo</> : <><XCircle className="w-3 h-3" /> Inativo</>}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Telefone:</span>
                  <span className="font-medium text-gray-900">{cliente.telefone || 'Não informado'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Contratos Activos:</span>
                  <span className="font-medium text-gray-900">{cliente.contratosAtivos || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Data de Cadastro:</span>
                  <span className="font-medium text-gray-900">
                    {cliente.dataCriacao ? new Date(cliente.dataCriacao).toLocaleDateString('pt-AO') : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button onClick={() => abrirModal(cliente)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors">
                  <Edit className="w-4 h-4" /> Editar
                </button>
                <button onClick={() => handleToggleStatus(cliente)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${cliente.status === "Ativo" ? "bg-orange-50 hover:bg-orange-100 text-orange-600" : "bg-green-50 hover:bg-green-100 text-green-600"}`}>
                  {cliente.status === "Ativo" ? <><XCircle className="w-4 h-4" /> Desativar</> : <><CheckCircle className="w-4 h-4" /> Ativar</>}
                </button>
                <button onClick={() => handleEliminar(cliente)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors">
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{clienteEditando ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={fecharModal} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                <input type="text" required value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome do cliente" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input type="email" required value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                <input type="tel" value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+244 923 123 456" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senha {!clienteEditando && '*'}</label>
                <input type="password" required={!clienteEditando} value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={clienteEditando ? "Deixe em branco para não alterar" : "Senha de acesso"} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Ativo</option>
                  <option>Inativo</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={fecharModal}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium">Cancelar</button>
                <button type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                  {clienteEditando ? 'Actualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
