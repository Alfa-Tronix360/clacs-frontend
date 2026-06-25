import { Clock, Pause, Save, Calendar, Loader, Play } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { intervencoesAPI, registrosHorasAPI, tecnicosAPI } from "../../services/api";

interface Intervencao {
  id: string;
  numero: string;
  titulo: string;
  status: string;
}

interface RegistroHoras {
  id: string;
  intervencaoId: string;
  data: string;
  horas: number;
  horaInicio: string;
  horaFim: string;
  descricao?: string;
}

const formatarTempo = (segundos: number): string => {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
};

const timestampParaHoraLocal = (ts: number): string => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const STATUS_FECHADOS = ["Resolvido", "Fechado", "Concluído"];

export default function TecnicoHoras() {
  const location = useLocation();
  const navigate = useNavigate();

  const [intervencoes, setIntervencoes] = useState<Intervencao[]>([]);
  const [registrosHoras, setRegistrosHoras] = useState<RegistroHoras[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  const tsInicio = useRef<number | null>(null);
  const primeiroInicio = useRef<number | null>(null);
  const tempoAcumulado = useRef<number>(0);
  const [cronometroAtivo, setCronometroAtivo] = useState(false);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [iniciado, setIniciado] = useState(false); // já começou alguma vez?

  const [intervencaoSelecionada, setIntervencaoSelecionada] = useState("");
  const [intervencaoVeioDeResolver, setIntervencaoVeioDeResolver] = useState(false);
  const [descricaoTarefa, setDescricaoTarefa] = useState("");
  const [tecnicoId, setTecnicoId] = useState<string | null>(null);

  const usuarioId = localStorage.getItem("userId");

  // Intervalo do cronómetro
  useEffect(() => {
    if (!cronometroAtivo) return;
    const intervalo = setInterval(() => {
      if (tsInicio.current !== null) {
        const s = Math.floor((Date.now() - tsInicio.current) / 1000);
        setTempoDecorrido(tempoAcumulado.current + s);
      }
    }, 1000);
    return () => clearInterval(intervalo);
  }, [cronometroAtivo]);

  const carregarDados = useCallback(async (idTecnico: string) => {
    try {
      setLoading(true);
      const [intervencoesRes, registrosRes] = await Promise.all([
        intervencoesAPI.listarPorTecnico(idTecnico),
        registrosHorasAPI.listarPorTecnico(idTecnico),
      ]);
      if (intervencoesRes.success) setIntervencoes(intervencoesRes.data);
      if (registrosRes.success) setRegistrosHoras(registrosRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!usuarioId) { setLoading(false); return; }
    (async () => {
      try {
        const tecnicoRes = await tecnicosAPI.buscarPorUsuarioId(usuarioId);
        if (tecnicoRes.success && tecnicoRes.data) {
          const id: string = tecnicoRes.data.id;
          setTecnicoId(id);
          await carregarDados(id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Erro ao carregar ID do técnico:", error);
        setLoading(false);
      }
    })();
  }, [usuarioId, carregarDados]);

  // Iniciar cronómetro automaticamente se veio de "Resolver"
  useEffect(() => {
    if (location.state?.intervencaoId && intervencoes.length > 0) {
      const id = location.state.intervencaoId;
      setIntervencaoSelecionada(id);
      setIntervencaoVeioDeResolver(true);

      tsInicio.current = Date.now();
      primeiroInicio.current = Date.now();
      tempoAcumulado.current = 0;
      setCronometroAtivo(true);
      setPausado(false);
      setIniciado(true);

      intervencoesAPI.atualizarStatus(id, "Em Andamento").catch(console.error);
    }
  }, [location.state, intervencoes]);

  const mostrarMensagem = (tipo: "sucesso" | "erro", texto: string) => {
    setMensagem({ tipo, texto });
    setTimeout(() => setMensagem(null), 4000);
  };

  const toggleCronometro = async () => {
    if (!intervencaoSelecionada) {
      mostrarMensagem("erro", "Selecione uma intervenção primeiro.");
      return;
    }

    if (!cronometroAtivo) {
      // INICIAR ou RETOMAR
      tsInicio.current = Date.now();
      if (primeiroInicio.current === null) primeiroInicio.current = Date.now();

      try {
        const intervencao = intervencoes.find((i) => i.id === intervencaoSelecionada);
        if (intervencao?.status === "Aberto") {
          await intervencoesAPI.atualizarStatus(intervencaoSelecionada, "Em Andamento");
          if (tecnicoId) await carregarDados(tecnicoId);
        }
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
      }

      setCronometroAtivo(true);
      setPausado(false);
      setIniciado(true);
    } else {
      // PAUSAR
      if (tsInicio.current !== null) {
        tempoAcumulado.current += Math.floor((Date.now() - tsInicio.current) / 1000);
        setTempoDecorrido(tempoAcumulado.current);
      }
      tsInicio.current = null;
      setCronometroAtivo(false);
      setPausado(true);
    }
  };

  const salvarTempo = async () => {
    if (!intervencaoSelecionada) {
      mostrarMensagem("erro", "Selecione uma intervenção primeiro.");
      return;
    }

    // Se ainda está a contar, parar primeiro para calcular tempo total
    let totalSegundos = tempoAcumulado.current;
    if (cronometroAtivo && tsInicio.current !== null) {
      totalSegundos += Math.floor((Date.now() - tsInicio.current) / 1000);
    }

    if (totalSegundos === 0) {
      mostrarMensagem("erro", "Inicie o cronómetro antes de salvar.");
      return;
    }
    if (!descricaoTarefa.trim()) {
      mostrarMensagem("erro", "A descrição da solução é obrigatória. Pause o cronómetro para preencher.");
      return;
    }
    if (!tecnicoId) {
      mostrarMensagem("erro", "Técnico não identificado. Recarregue a página.");
      return;
    }

    const tsInicioMs = primeiroInicio.current ?? (Date.now() - totalSegundos * 1000);
    const tsFimMs = Date.now();
    const horaInicio = timestampParaHoraLocal(tsInicioMs);
    const horaFim = timestampParaHoraLocal(tsFimMs);
    const horas = totalSegundos / 3600;

    try {
      await registrosHorasAPI.criar({
        intervencao_id: intervencaoSelecionada,
        tecnico_id: tecnicoId,
        horas,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        data: new Date().toISOString(),
        descricao: descricaoTarefa.trim(),
      });

      await intervencoesAPI.atualizarStatus(intervencaoSelecionada, "Resolvido");

      mostrarMensagem("sucesso", `Tempo registado (${horaInicio} – ${horaFim}). Intervenção marcada como resolvida.`);

      // Reset completo
      setCronometroAtivo(false);
      setPausado(false);
      setIniciado(false);
      setTempoDecorrido(0);
      tsInicio.current = null;
      primeiroInicio.current = null;
      tempoAcumulado.current = 0;
      setIntervencaoSelecionada("");
      setIntervencaoVeioDeResolver(false);
      setDescricaoTarefa("");

      // Redirecionar para Minhas Intervenções após 1.5s
      setTimeout(() => {
        navigate('/tecnico/intervencoes');
      }, 1500);

    } catch (error) {
      console.error("Erro ao salvar registo:", error);
      mostrarMensagem("erro", "Erro ao salvar registo de horas. Tente novamente.");
    }
  };

  const calcularHoras = (filtro: (r: RegistroHoras) => boolean) =>
    registrosHoras.filter(filtro).reduce((acc, r) => acc + (r.horas ?? 0), 0);

  const hoje = new Date();
  const horasHoje = calcularHoras((r) => new Date(r.data).toDateString() === hoje.toDateString());
  const horasSemana = calcularHoras((r) => (hoje.getTime() - new Date(r.data).getTime()) / 86_400_000 < 7);
  const horasMes = calcularHoras((r) => {
    const d = new Date(r.data);
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  });

  const intervencaoActual = intervencoes.find(i => i.id === intervencaoSelecionada);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">A carregar dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Registo de Horas</h1>
        <p className="text-gray-600 mt-1">Controle o seu tempo de trabalho</p>
      </div>

      {mensagem && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${mensagem.tipo === "sucesso"
          ? "bg-green-50 border border-green-200 text-green-800"
          : "bg-red-50 border border-red-200 text-red-800"}`}>
          {mensagem.texto}
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Hoje", valor: horasHoje, cor: "green", Icon: Clock },
          { label: "Esta Semana", valor: horasSemana, cor: "blue", Icon: Calendar },
          { label: "Este Mês", valor: horasMes, cor: "purple", Icon: Clock },
        ].map(({ label, valor, cor, Icon }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-${cor}-100 rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 text-${cor}-600`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{valor.toFixed(1)}h</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cronómetro */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cronómetro</h2>
        <div className="space-y-4">

          {/* Intervenção */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Intervenção</label>
            {intervencaoVeioDeResolver && intervencaoActual ? (
              <div className="w-full px-4 py-2 border border-green-300 bg-green-50 rounded-lg text-green-800 font-medium">
                {intervencaoActual.numero} — {intervencaoActual.titulo}
              </div>
            ) : (
              <select
                value={intervencaoSelecionada}
                onChange={(e) => setIntervencaoSelecionada(e.target.value)}
                disabled={cronometroAtivo || tempoAcumulado.current > 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              >
                <option value="">
                  {intervencoes.length === 0 ? "Nenhuma intervenção atribuída..." : "Escolha uma intervenção..."}
                </option>
                {intervencoes
                  .filter((i) => !STATUS_FECHADOS.includes(i.status))
                  .map((intervencao) => (
                    <option key={intervencao.id} value={intervencao.id}>
                      {intervencao.numero} — {intervencao.titulo}
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Descrição — desabilitada enquanto cronómetro activo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição da Solução <span className="text-red-500">*</span>
              {cronometroAtivo && (
                <span className="ml-2 text-xs text-gray-400">(pause para preencher)</span>
              )}
            </label>
            <textarea
              value={descricaoTarefa}
              onChange={(e) => setDescricaoTarefa(e.target.value)}
              placeholder={cronometroAtivo
                ? "⏸ Pause o cronómetro para escrever a descrição..."
                : "Descreva o que foi feito para resolver o problema..."}
              rows={4}
              disabled={cronometroAtivo}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${cronometroAtivo
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white border-gray-300 text-gray-900"}`}
            />
          </div>

          {/* Display do tempo */}
          <div className="text-center py-8">
            <div className={`text-6xl font-bold mb-2 font-mono transition-colors ${cronometroAtivo ? "text-green-600" : pausado ? "text-yellow-600" : "text-gray-400"}`}>
              {formatarTempo(tempoDecorrido)}
            </div>

            {primeiroInicio.current ? (
              <p className="text-sm text-gray-500 mb-4">
                Iniciado às <span className="font-semibold">{timestampParaHoraLocal(primeiroInicio.current)}</span>
                {cronometroAtivo
                  ? <span className="ml-2 text-green-600 font-medium">● A contar</span>
                  : <span className="ml-2 text-yellow-600 font-medium">⏸ Pausado</span>}
              </p>
            ) : (
              <p className="text-sm text-gray-400 mb-4">Pronto para iniciar</p>
            )}

            {pausado && (
              <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 inline-block mb-4">
                Preencha a descrição e clique em Salvar
              </p>
            )}

            {/* BOTÕES */}
            <div className="flex gap-3 justify-center mt-2">

              {/* Pausar / Retomar / Iniciar */}
              <button
                onClick={toggleCronometro}
                disabled={!intervencaoSelecionada && !cronometroAtivo}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${cronometroAtivo
                  ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                  : iniciado
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"}`}
              >
                {cronometroAtivo ? (
                  <><Pause className="w-5 h-5" /> Pausar</>
                ) : iniciado ? (
                  <><Play className="w-5 h-5" /> Retomar</>
                ) : (
                  <><Play className="w-5 h-5" /> Iniciar</>
                )}
              </button>

              {/* Salvar — aparece sempre que já iniciou (ativo ou pausado) */}
              {iniciado && (
                <button
                  onClick={salvarTempo}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-5 h-5" />
                  Salvar
                </button>
              )}
            </div>

            {cronometroAtivo && iniciado && (
              <p className="text-xs text-gray-400 mt-3">
                Pause o cronómetro para preencher a descrição antes de salvar
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Histórico */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Registos</h2>
        {registrosHoras.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nenhum registo de horas encontrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Intervenção</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Período</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Descrição</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Horas</th>
                </tr>
              </thead>
              <tbody>
                {registrosHoras.map((registro) => (
                  <tr key={registro.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(registro.data).toLocaleDateString("pt-AO")}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">#{registro.intervencaoId}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                      {registro.horaInicio && registro.horaFim ? `${registro.horaInicio} – ${registro.horaFim}` : "—"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{registro.descricao || "—"}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-green-600 text-right">
                      {registro.horas.toFixed(2)}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
