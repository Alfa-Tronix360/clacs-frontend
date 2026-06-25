import { Clock, Pause, Save, Calendar, Loader, Play } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
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

// Chaves do localStorage
const LS_INTERVENCAO_ID = "cron_intervencao_id";
const LS_INICIO_TS = "cron_inicio_ts";         // timestamp quando iniciou (ms)
const LS_ACUMULADO = "cron_acumulado_s";        // segundos acumulados antes da última pausa
const LS_PAUSADO = "cron_pausado";              // "true" | "false"
const LS_HORA_INICIO = "cron_hora_inicio";      // HH:MM para o registo

export default function TecnicoHoras() {
  const navigate = useNavigate();

  const [intervencoes, setIntervencoes] = useState<Intervencao[]>([]);
  const [registrosHoras, setRegistrosHoras] = useState<RegistroHoras[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  const [cronometroAtivo, setCronometroAtivo] = useState(false);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [iniciado, setIniciado] = useState(false);

  const [intervencaoSelecionada, setIntervencaoSelecionada] = useState("");
  const [intervencaoVeioDeResolver, setIntervencaoVeioDeResolver] = useState(false);
  const [descricaoTarefa, setDescricaoTarefa] = useState("");
  const [tecnicoId, setTecnicoId] = useState<string | null>(null);

  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usuarioId = localStorage.getItem("userId");

  // Calcular tempo total tendo em conta o acumulado + tempo desde último início
  const calcularTempoTotal = (): number => {
    const acumulado = parseInt(localStorage.getItem(LS_ACUMULADO) || "0");
    const inicioTs = localStorage.getItem(LS_INICIO_TS);
    const estaPausado = localStorage.getItem(LS_PAUSADO) === "true";

    if (estaPausado || !inicioTs) return acumulado;
    const segundosDesdeInicio = Math.floor((Date.now() - parseInt(inicioTs)) / 1000);
    return acumulado + segundosDesdeInicio;
  };

  const iniciarIntervalo = () => {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    intervaloRef.current = setInterval(() => {
      setTempoDecorrido(calcularTempoTotal());
    }, 1000);
  };

  const carregarDados = useCallback(async (idTecnico: string) => {
    try {
      const [intervencoesRes, registrosRes] = await Promise.all([
        intervencoesAPI.listarPorTecnico(idTecnico),
        registrosHorasAPI.listarPorTecnico(idTecnico),
      ]);
      if (intervencoesRes.success) setIntervencoes(intervencoesRes.data);
      if (registrosRes.success) setRegistrosHoras(registrosRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, []);

  // Ao montar: verificar se há sessão activa no localStorage
  useEffect(() => {
    if (!usuarioId) { setLoading(false); return; }

    (async () => {
      try {
        setLoading(true);
        const tecnicoRes = await tecnicosAPI.buscarPorUsuarioId(usuarioId);
        if (!tecnicoRes.success || !tecnicoRes.data) { setLoading(false); return; }

        const id: string = tecnicoRes.data.id;
        setTecnicoId(id);
        await carregarDados(id);

        // Verificar se veio de "Resolver" via sessionStorage
        const novaIntervencaoId = sessionStorage.getItem("resolver_intervencao_id");
        if (novaIntervencaoId) {
          sessionStorage.removeItem("resolver_intervencao_id");
          // Iniciar nova sessão no localStorage
          const agora = Date.now();
          const horaInicio = timestampParaHoraLocal(agora);
          localStorage.setItem(LS_INTERVENCAO_ID, novaIntervencaoId);
          localStorage.setItem(LS_INICIO_TS, String(agora));
          localStorage.setItem(LS_ACUMULADO, "0");
          localStorage.setItem(LS_PAUSADO, "false");
          localStorage.setItem(LS_HORA_INICIO, horaInicio);

          setIntervencaoSelecionada(novaIntervencaoId);
          setIntervencaoVeioDeResolver(true);
          setCronometroAtivo(true);
          setPausado(false);
          setIniciado(true);
          iniciarIntervalo();
          intervencoesAPI.atualizarStatus(novaIntervencaoId, "Em Andamento").catch(console.error);

        } else {
          // Verificar se há sessão activa anterior no localStorage
          const intervencaoGuardada = localStorage.getItem(LS_INTERVENCAO_ID);
          if (intervencaoGuardada) {
            const estaPausado = localStorage.getItem(LS_PAUSADO) === "true";
            setIntervencaoSelecionada(intervencaoGuardada);
            setIntervencaoVeioDeResolver(true);
            setIniciado(true);
            setTempoDecorrido(calcularTempoTotal());

            if (!estaPausado) {
              setCronometroAtivo(true);
              setPausado(false);
              iniciarIntervalo();
            } else {
              setCronometroAtivo(false);
              setPausado(true);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar:", error);
      } finally {
        setLoading(false);
      }
    })();

    return () => { if (intervaloRef.current) clearInterval(intervaloRef.current); };
  }, [usuarioId]);

  const mostrarMensagem = (tipo: "sucesso" | "erro", texto: string) => {
    setMensagem({ tipo, texto });
    setTimeout(() => setMensagem(null), 4000);
  };

  const pausar = () => {
    // Guardar tempo acumulado e marcar como pausado no localStorage
    const totalAgora = calcularTempoTotal();
    localStorage.setItem(LS_ACUMULADO, String(totalAgora));
    localStorage.setItem(LS_INICIO_TS, "");
    localStorage.setItem(LS_PAUSADO, "true");

    if (intervaloRef.current) clearInterval(intervaloRef.current);
    setTempoDecorrido(totalAgora);
    setCronometroAtivo(false);
    setPausado(true);
  };

  const retomar = () => {
    const agora = Date.now();
    localStorage.setItem(LS_INICIO_TS, String(agora));
    localStorage.setItem(LS_PAUSADO, "false");

    setCronometroAtivo(true);
    setPausado(false);
    iniciarIntervalo();
  };

  const limparSessao = () => {
    localStorage.removeItem(LS_INTERVENCAO_ID);
    localStorage.removeItem(LS_INICIO_TS);
    localStorage.removeItem(LS_ACUMULADO);
    localStorage.removeItem(LS_PAUSADO);
    localStorage.removeItem(LS_HORA_INICIO);
  };

  const salvarTempo = async () => {
    if (!intervencaoSelecionada) {
      mostrarMensagem("erro", "Nenhuma intervenção seleccionada.");
      return;
    }

    const totalSegundos = calcularTempoTotal();

    if (totalSegundos === 0) {
      mostrarMensagem("erro", "Inicie o cronómetro antes de salvar.");
      return;
    }
    if (!descricaoTarefa.trim()) {
      mostrarMensagem("erro", "A descrição da solução é obrigatória.");
      return;
    }
    if (!tecnicoId) {
      mostrarMensagem("erro", "Técnico não identificado. Recarregue a página.");
      return;
    }

    const horaInicio = localStorage.getItem(LS_HORA_INICIO) || timestampParaHoraLocal(Date.now() - totalSegundos * 1000);
    const horaFim = timestampParaHoraLocal(Date.now());
    const horas = totalSegundos / 3600;

    try {
      // Parar cronómetro antes de guardar
      if (intervaloRef.current) clearInterval(intervaloRef.current);

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

      // Limpar tudo
      limparSessao();
      setCronometroAtivo(false);
      setPausado(false);
      setIniciado(false);
      setTempoDecorrido(0);
      setIntervencaoSelecionada("");
      setIntervencaoVeioDeResolver(false);
      setDescricaoTarefa("");

      // Redirecionar após 1.5s
      setTimeout(() => { navigate('/tecnico/intervencoes'); }, 1500);

    } catch (error) {
      console.error("Erro ao salvar:", error);
      mostrarMensagem("erro", "Erro ao salvar registo de horas. Tente novamente.");
    }
  };

  const calcularHorasRegistos = (filtro: (r: RegistroHoras) => boolean) =>
    registrosHoras.filter(filtro).reduce((acc, r) => acc + (r.horas ?? 0), 0);

  const hoje = new Date();
  const horasHoje = calcularHorasRegistos((r) => new Date(r.data).toDateString() === hoje.toDateString());
  const horasSemana = calcularHorasRegistos((r) => (hoje.getTime() - new Date(r.data).getTime()) / 86_400_000 < 7);
  const horasMes = calcularHorasRegistos((r) => {
    const d = new Date(r.data);
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  });

  const intervencaoActual = intervencoes.find(i => i.id === intervencaoSelecionada);
  const horaInicioGuardada = localStorage.getItem(LS_HORA_INICIO);

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
            ) : intervencaoVeioDeResolver && !intervencaoActual ? (
              <div className="w-full px-4 py-2 border border-green-300 bg-green-50 rounded-lg text-green-600 text-sm">
                A carregar intervenção...
              </div>
            ) : (
              <select
                value={intervencaoSelecionada}
                onChange={(e) => setIntervencaoSelecionada(e.target.value)}
                disabled={cronometroAtivo}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              >
                <option value="">Escolha uma intervenção...</option>
                {intervencoes.filter((i) => !STATUS_FECHADOS.includes(i.status)).map((i) => (
                  <option key={i.id} value={i.id}>{i.numero} — {i.titulo}</option>
                ))}
              </select>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição da Solução <span className="text-red-500">*</span>
              {cronometroAtivo && <span className="ml-2 text-xs text-gray-400">(pause para preencher)</span>}
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

          {/* Display */}
          <div className="text-center py-8">
            <div className={`text-6xl font-bold mb-2 font-mono transition-colors ${cronometroAtivo ? "text-green-600" : pausado ? "text-yellow-600" : "text-gray-400"}`}>
              {formatarTempo(tempoDecorrido)}
            </div>

            {horaInicioGuardada && iniciado ? (
              <p className="text-sm text-gray-500 mb-4">
                Iniciado às <span className="font-semibold">{horaInicioGuardada}</span>
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

            {/* Botões */}
            <div className="flex gap-3 justify-center mt-2">
              {/* Pausar / Retomar / Iniciar */}
              {cronometroAtivo ? (
                <button onClick={pausar}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-yellow-500 hover:bg-yellow-600 text-white transition-colors">
                  <Pause className="w-5 h-5" /> Pausar
                </button>
              ) : pausado ? (
                <button onClick={retomar}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-colors">
                  <Play className="w-5 h-5" /> Retomar
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!intervencaoSelecionada) { mostrarMensagem("erro", "Selecione uma intervenção."); return; }
                    const agora = Date.now();
                    const horaInicio = timestampParaHoraLocal(agora);
                    localStorage.setItem(LS_INTERVENCAO_ID, intervencaoSelecionada);
                    localStorage.setItem(LS_INICIO_TS, String(agora));
                    localStorage.setItem(LS_ACUMULADO, "0");
                    localStorage.setItem(LS_PAUSADO, "false");
                    localStorage.setItem(LS_HORA_INICIO, horaInicio);
                    setCronometroAtivo(true);
                    setIniciado(true);
                    iniciarIntervalo();
                  }}
                  disabled={!intervencaoSelecionada}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white transition-colors">
                  <Play className="w-5 h-5" /> Iniciar
                </button>
              )}

              {/* Salvar — sempre visível quando iniciado */}
              {iniciado && (
                <button onClick={salvarTempo}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                  <Save className="w-5 h-5" /> Salvar
                </button>
              )}
            </div>

            {cronometroAtivo && (
              <p className="text-xs text-gray-400 mt-3">
                Pode navegar para outras páginas — o cronómetro continua a contar
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
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(registro.data).toLocaleDateString("pt-AO")}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">#{registro.intervencaoId}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                      {registro.horaInicio && registro.horaFim ? `${registro.horaInicio} – ${registro.horaFim}` : "—"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{registro.descricao || "—"}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-green-600 text-right">{registro.horas.toFixed(2)}h</td>
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
