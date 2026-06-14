import { ClipboardList, Clock, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { intervencoesAPI, registrosHorasAPI, tecnicosAPI } from "../../services/api";
import { maskId } from "../../services/MaskId";


export default function TecnicoDashboard() {
  const [intervencoes, setIntervencoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tecnicoId, setTecnicoId] = useState<string | null>(null);
  const usuarioId = localStorage.getItem('userId');

  useEffect(() => {
    carregarTecnicoId();
  }, []);

  useEffect(() => {
    if (tecnicoId) {
      carregarDados();
    }
  }, [tecnicoId]);

  const carregarTecnicoId = async () => {
    try {
      if (!usuarioId) {
        console.error('Usuario ID não encontrado');
        setLoading(false);
        return;
      }

      const tecnicoRes = await tecnicosAPI.buscarPorUsuarioId(usuarioId);
      if (tecnicoRes.success && tecnicoRes.data) {
        setTecnicoId(tecnicoRes.data.id);
      } else {
        console.error('Técnico não encontrado para este usuário');
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao carregar ID do técnico:', error);
      setLoading(false);
    }
  };

  const carregarDados = async () => {
    try {
      setLoading(true);

      console.log('=== CARREGANDO DASHBOARD TÉCNICO ===');
      console.log('TecnicoId:', tecnicoId);

      const response = await intervencoesAPI.listarPorTecnico(tecnicoId!);

      console.log('Resposta intervenções:', response);

      if (response.success) {
        setIntervencoes(response.data);
        console.log('✅ Intervenções carregadas:', response.data.length);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const intervencoesAbertas = intervencoes.filter(i => i.status === "Aberto" || i.status === "Em Andamento").length;
  const intervencoesConcluidas = intervencoes.filter(i => i.status === "Concluído").length;
  const horasTrabalhadas = intervencoes.reduce((acc, i) => acc + (i.horasGastas || 0), 0);
  const intervencoesUrgentes = intervencoes.filter(i => i.prioridade === "Alta" && i.status !== "Concluído");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard do Técnico</h1>
        <p className="text-gray-600 mt-1">Bem-vindo, {localStorage.getItem('userName')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Intervenções Ativas</p>
              <p className="text-3xl font-bold text-gray-900">{intervencoesAbertas}</p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Concluídas</p>
              <p className="text-3xl font-bold text-gray-900">{intervencoesConcluidas}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Horas Trabalhadas</p>
              <p className="text-3xl font-bold text-gray-900">{horasTrabalhadas.toFixed(2)}h</p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
              <Clock className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Urgentes</p>
              <p className="text-3xl font-bold text-gray-900">{intervencoesUrgentes.length}</p>
            </div>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Intervenções Urgentes</h2>
          </div>
          <div className="space-y-3">
            {intervencoesUrgentes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma intervenção urgente</p>
            ) : (
              intervencoesUrgentes.map(intervencao => (
                <div key={intervencao.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{intervencao.titulo}</p>
                    <p className="text-sm text-gray-600">Cliente: {intervencao.clienteNome}</p>
                  </div>
                  <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">Alta</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Últimos Registros</h2>
          </div>
          <div className="space-y-3">
            {intervencoes.slice(0, 5).map(intervencao => (
              <div key={intervencao.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{intervencao.titulo}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(intervencao.dataCriacao).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <span className="text-sm font-semibold text-green-600">{(intervencao.horasGastas || 0).toFixed(2)}h</span>
              </div>
            ))}
            {intervencoes.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhum registro encontrado</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Minhas Intervenções Ativas</h2>
        <div className="space-y-3">
          {intervencoes.filter(i => i.status !== "Concluído").length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhuma intervenção ativa</p>
          ) : (
            intervencoes.filter(i => i.status !== "Concluído").map(intervencao => (
              <div key={intervencao.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-gray-500">{intervencao.numero}</span>
                    <h3 className="font-semibold text-gray-900">{intervencao.titulo}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Cliente: {intervencao.clienteNome}</span>
                    <span className={`px-2 py-1 rounded text-xs ${intervencao.prioridade === "Alta" ? "bg-red-100 text-red-700" :
                      intervencao.prioridade === "Média" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                      {intervencao.prioridade}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${intervencao.status === "Em Andamento" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                      }`}>
                      {intervencao.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 mb-1">{(intervencao.horasGastas || 0).toFixed(2)}h</div>
                  <p className="text-xs text-gray-500">trabalhadas</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}