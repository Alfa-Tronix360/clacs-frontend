import { Plus, Star, Clock, ClipboardList, TrendingUp, Loader, X, Link } from "lucide-react";
import { useState, useEffect } from "react";
import { intervencoesAPI, tecnicosAPI } from "../../services/api";

export default function AdminTecnicos() {
  const [intervencoes, setIntervencoes] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalVincularAberto, setModalVincularAberto] = useState(false);
  const [tecnicoSelecionado, setTecnicoSelecionado] = useState<any>(null);
  const [userIdParaVincular, setUserIdParaVincular] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    nivel: "Júnior",
    especialidade: "Geral"
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [intervencoesRes, tecnicosRes] = await Promise.all([
        intervencoesAPI.listar(),
        tecnicosAPI.listar()
      ]);

      if (intervencoesRes.success) {
        setIntervencoes(intervencoesRes.data);
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

  const abrirModal = () => {
    setFormData({
      nome: "",
      email: "",
      senha: "",
      nivel: "Júnior",
      especialidade: "Geral"
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setFormData({
      nome: "",
      email: "",
      senha: "",
      nivel: "Júnior",
      especialidade: "Geral"
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await tecnicosAPI.criar(formData);

      if (response.success) {
        setTecnicos([...tecnicos, response.data]);
        fecharModal();
        alert('Técnico criado com sucesso!');
        carregarDados();
      }
    } catch (error: any) {
      console.error('Erro ao criar técnico:', error);
      alert(error.message || 'Erro ao criar técnico');
    }
  };

  const abrirModalVincular = (tecnico: any) => {
    setTecnicoSelecionado(tecnico);
    setUserIdParaVincular(tecnico.userId || "");
    setModalVincularAberto(true);
  };

  const fecharModalVincular = () => {
    setModalVincularAberto(false);
    setTecnicoSelecionado(null);
    setUserIdParaVincular("");
  };

  const handleVincular = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userIdParaVincular.trim()) {
      alert('Por favor, insira um userId válido');
      return;
    }

    try {
      const response = await tecnicosAPI.vincularUsuario(tecnicoSelecionado.id, userIdParaVincular);

      if (response.success) {
        alert('Técnico vinculado com sucesso! O técnico precisa fazer logout e login novamente.');
        fecharModalVincular();
        carregarDados();
      }
    } catch (error: any) {
      console.error('Erro ao vincular técnico:', error);
      alert(error.message || 'Erro ao vincular técnico');
    }
  };

  {/* deletar tecnico */ }

  const handleDeletar = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este Tecnico?')) {
      return;
    }

    try {
      await tecnicosAPI.deletar(id);
      setTecnicos(tecnicos.filter(c => c.id !== id));
      alert('Tecnico deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar tecnico:', error);
      alert('Erro ao deletar tecnico');
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




  const totalTecnicos = tecnicos.length;
  const totalIntervencoes = intervencoes.length;
  const totalHoras = intervencoes.reduce((acc, i) => acc + (i.horasGastas || 0), 0);
  const mediaAvaliacao = tecnicos.length > 0
    ? tecnicos.reduce((acc, t) => acc + (t.avaliacaoMedia || t.avaliacao_media || 0), 0) / tecnicos.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Técnicos</h1>
          <p className="text-gray-600 mt-1">Monitore o desempenho da equipe</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors" onClick={abrirModal}>
          <Plus className="w-5 h-5" />
          Novo Técnico
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Técnicos</p>
              <p className="text-2xl font-bold text-gray-900">{totalTecnicos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Intervenções</p>
              <p className="text-2xl font-bold text-gray-900">{totalIntervencoes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Horas Trabalhadas</p>
              <p className="text-2xl font-bold text-gray-900">{totalHoras.toFixed(2)}h</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avaliação Média</p>
              <p className="text-2xl font-bold text-gray-900">{mediaAvaliacao.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tecnicos.map(tecnico => (
          <div key={tecnico.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {tecnico.nome.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{tecnico.nome}</h3>
                  <p className="text-sm text-gray-600">{tecnico.especialidade}</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">ID: {tecnico.id}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${tecnico.status === "Ativo" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}>
                {tecnico.status}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Email:</span>
                <span className="text-gray-900">{tecnico.email}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Avaliação:</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-gray-900">{(tecnico.avaliacaoMedia || tecnico.avaliacao_media || 0).toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{tecnico.intervencoesAtivas}</p>
                <p className="text-xs text-gray-600 mt-1">Ativas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{tecnico.intervencoesConcluidas}</p>
                <p className="text-xs text-gray-600 mt-1">Concluídas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{tecnico.horasTrabalhadas}h</p>
                <p className="text-xs text-gray-600 mt-1">Horas</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">


              <button
                onClick={() => handleDeletar(tecnico.id)}
                className="flex-1 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors">

                Deletar
              </button>


              <button
                onClick={() => abrirModalVincular(tecnico)}
                className="flex items-center gap-1 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Link className="w-4 h-4" />
                Vincular
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para adicionar novo técnico */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${modalAberto ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-lg shadow-lg p-6 w-96">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Novo Técnico</h2>
            <button className="text-gray-500 hover:text-gray-700" onClick={fecharModal}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <input
                  type="password"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nível</label>
                <select
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.nivel}
                  onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                >
                  <option value="Júnior">Júnior</option>
                  <option value="Pleno">Pleno</option>
                  <option value="Sênior">Sênior</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Especialidade</label>
                <select
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.especialidade}
                  onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                >
                  <option value="Geral">Geral</option>
                  <option value="Infraestrutura">Infraestrutura</option>
                  <option value="Aplicações">Aplicações</option>
                </select>
              </div>
            </div>
            <div className="mt-6">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Adicionar Técnico
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal para vincular técnico a um usuário */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${modalVincularAberto ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-lg shadow-lg p-6 w-96">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Vincular Técnico a Usuário</h2>
            <button className="text-gray-500 hover:text-gray-700" onClick={fecharModalVincular}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleVincular}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Técnico</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={tecnicoSelecionado?.nome || ""}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email do Técnico</label>
                <input
                  type="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={tecnicoSelecionado?.email || ""}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">UserId do Usuário</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={userIdParaVincular}
                  onChange={(e) => setUserIdParaVincular(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="mt-6">
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Vincular Técnico
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}