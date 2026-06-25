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

// Chaves localStorage
const LS_ID = "cron_intervencao_id";
const LS_INICIO = "cron_inicio_ts";
const LS_ACUM = "cron_acumulado_s";
const LS_PAUSADO = "cron_pausado";
const LS_HORA_INI = "cron_hora_inicio";

const limparLS = () => {
  [LS_ID, LS_INICIO, LS_ACUM, LS_PAUSADO, LS_HORA_INI].forEach(k => localStorage.removeItem(k));
};

const getSegundosTotal = (): number => {
  const acum = parseInt(localStorage.getItem(LS_ACUM) || "0");
  const ini = localStorage.getItem(LS_INICIO);
  const paus = localStorage.getItem(LS_PAUSADO) === "true";
  if (paus || !ini || ini === "") return acum;
  return acum + Math.floor((Date.now() - parseInt(ini)) / 1000);
};

export default function TecnicoHoras() {
  const navigate = useNavigate();

  const [intervencoes, setIntervencoes] = useState<Intervencao[]>([]);
  const [registros, setRegistros] = useState<RegistroHoras[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [tecnicoId, setTecnicoId] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");

  // Estado do cronómetro
  const [intervencaoId, setIntervencaoId] = useState(() => localStorage.getItem(LS_ID) || "");
  const [cronAtivo, setCronAtivo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [iniciado, setIniciado] = useState(false);
  const [tempoDecorrido, setTempoDecorrido] = useState(() => getSegundosTotal());
  const [horaInicioLabel, setHoraInicioLabel] = useState(() => localStorage.getItem(LS_HORA_INI) || "");

  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usuarioId = localStorage.getItem("userId");

  const iniciarIntervalo = useCallback(() => {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    intervaloRef.current = setInterval(() => {
      setTempoDecorrido(getSegundosTotal());
    }, 1000);
  }, []);

  const carregarDados = useCallback(async (tId: string) => {
    const [ir, rr] = await Promise.all([
      intervencoesAPI.listarPorTecnico(tId),
      registrosHorasAPI.listarPorTecnico(tId),
    ]);
    if (ir.success) setIntervencoes(ir.data);
    if (rr.success) setRegistros(rr.data);
  }, []);

  // Carregar técnico + dados + verificar sessão activa
  useEffect(() => {
    if (!usuarioId) { setLoading(false); return; }

    (async () => {
      try {
        setLoading(true);
        const tr = await tecnicosAPI.buscarPorUsuarioId(usuarioId);
        if (!tr.success || !tr.data) { setLoading(false); return; }

        const tId: string = tr.data.id;
        setTecnicoId(tId);
        await carregarDados(tId);

        // 1) Veio de "Resolver"?
        const novoId = sessionStorage.getItem("resolver_intervencao_id");
        if (novoId) {
          sessionStorage.removeItem("resolver_intervencao_id");
          const agora = Date.now();
          const hi = timestampParaHoraLocal(agora);
          localStorage.setItem(LS_ID, novoId);
          localStorage.setItem(LS_INICIO, String(agora));
          localStorage.setItem(LS_ACUM, "0");
          localStorage.setItem(LS_PAUSADO, "false");
          localStorage.setItem(LS_HORA_INI, hi);
          setIntervencaoId(novoId);
          setHoraInicioLabel(hi);
          setTempoDecorrido(0);
          setCronAtivo(true);
          setPausado(false);
          setIniciado(true);
          iniciarIntervalo();
          intervencoesAPI.atualizarStatus(novoId, "Em Andamento").catch(console.error);
          return;
        }

        // 2) Sessão activa anterior?
        const idGuardado = localStorage.getItem(LS_ID);
        if (idGuardado) {
          const paus = localStorage.getItem(LS_PAUSADO) === "true";
          setIntervencaoId(idGuardado);
          setHoraInicioLabel(localStorage.getItem(LS_HORA_INI) || "");
          setIniciado(true);
          setTempoDecorrido(getSegundosTotal());
          if (!paus) {
            setCronAtivo(true);
            setPausado(false);
            iniciarIntervalo();
          } else {
            setCronAtivo(false);
            setPausado(true);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();

    return () => { if (intervaloRef.current) clearInterval(intervaloRef.current); };
  }, [usuarioId, carregarDados, iniciarIntervalo]);

  const mostrar = (tipo: "sucesso" | "erro", texto: string) => {
    setMensagem({ tipo, texto });
    setTimeout(() => setMensagem(null), 5000);
  };

  const pausar = () => {
    const total = getSegundosTotal();
    localStorage.setItem(LS_ACUM, String(total));
    localStorage.setItem(LS_INICIO, "");
    localStorage.setItem(LS_PAUSADO, "true");
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    setTempoDecorrido(total);
    setCronAtivo(false);
    setPausado(true);
  };

  const retomar = () => {
    const agora = Date.now();
    localStorage.setItem(LS_INICIO, String(agora));
    localStorage.setItem(LS_PAUSADO, "false");
    setCronAtivo(true);
    setPausado(false);
    iniciarIntervalo();
  };

  const iniciarManual = () => {
    if (!intervencaoId) { mostrar("erro", "Selecione uma intervenção."); return; }
    const agora = Date.now();
    const hi = timestampParaHoraLocal(agora);
    localStorage.setItem(LS_ID, intervencaoId);
    localStorage.setItem(LS_INICIO, String(agora));
    localStorage.setItem(LS_ACUM, "0");
    localStorage.setItem(LS_PAUSADO, "false");
    localStorage.setItem(LS_HORA_INI, hi);
    setHoraInicioLabel(hi);
    setTempoDecorrido(0);
    setCronAtivo(true);
    setPausado(false);
    setIniciado(true);
    iniciarIntervalo();
  };

  const salvar = async () => {
    if (!intervencaoId) { mostrar("erro", "Nenhuma intervenção seleccionada."); return; }
    if (!descricao.trim()) { mostrar("erro", "Preencha a descrição da solução."); return; }
    if (!tecnicoId) { mostrar("erro", "Técnico não identificado."); return; }

    // Pausar para capturar o tempo final
    const total = getSegundosTotal();
    if (total === 0) { mostrar("erro", "Inicie o cronómetro antes de salvar."); return; }

    if (intervaloRef.current) clearInterval(intervaloRef.current);

    const horaInicio = localStorage.getItem(LS_HORA_INI) || timestampParaHoraLocal(Date.now() - total * 1000);
    const horaFim = timestampParaHoraLocal(Date.now());
    const horas = total / 3600;

    try {
      await registrosHorasAPI.criar({
        intervencao_id: intervencaoId,
        tecnico_id: tecnicoId,
        horas,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        data: new Date().toISOString(),
        descricao: descricao.trim(),
      });

      await intervencoesAPI.atualizarStatus(intervencaoId, "Resolvido");

      mostrar("sucesso", `Guardado! (${horaInicio} – ${horaFim}). Intervenção marcada como resolvida.`);

      limparLS();
      setCronAtivo(false);
      setPausado(false);
      setIniciado(false);
      setTempoDecorrido(0);
      setIntervencaoId("");
      setHoraInicioLabel("");
      setDescricao("");

      setTimeout(() => navigate('/tecnico/intervencoes'), 1500);
    } catch (e) {
      console.error(e);
      mostrar("erro", "Erro ao salvar. Tente novamente.");
    }
  };

  // Estatísticas
  const hoje = new Date();
  const somarHoras = (fn: (r: RegistroHoras) => boolean) =>
    registros.filter(fn).reduce((a, r) => a + (r.horas ?? 0), 0);
  const horasHoje = somarHoras(r => new Date(r.data).toDateString() === hoje.toDateString());
  const horasSemana = somarHoras(r => (hoje.getTime() - new Date(r.data).getTime()) / 86400000 < 7);
  const horasMes = somarHoras(r => {
    const d = new Date(r.data);
    return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
  });

  const intervencaoActual = intervencoes.find(i => i.id === intervencaoId);
  const temSessao = !!localStorage.getItem(LS_ID);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <Loader className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">A carregar dados...</p>
      </div>
    </div>
  );

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
            {temSessao && intervencaoActual ? (
              <div className="w-full px-4 py-2 border border-green-300 bg-green-50 rounded-lg text-green-800 font-medium">
                {intervencaoActual.numero} — {intervencaoActual.titulo}
              </div>
            ) : temSessao ? (
              <div className="w-full px-4 py-2 border border-green-300 bg-green-50 rounded-lg text-green-600 text-sm">
                A carregar intervenção...
              </div>
            ) : (
              <select value={intervencaoId}
                onChange={e => setIntervencaoId(e.target.value)}
                disabled={cronAtivo}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100">
                <option value="">Escolha uma intervenção...</option>
                {intervencoes.filter(i => !STATUS_FECHADOS.includes(i.status)).map(i => (
                  <option key={i.id} value={i.id}>{i.numero} — {i.titulo}</option>
                ))}
              </select>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição da Solução <span className="text-red-500">*</span>
              {cronAtivo && <span className="ml-2 text-xs text-gray-400">(pause para preencher)</span>}
            </label>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              placeholder={cronAtivo
                ? "⏸ Pause o cronómetro para escrever a descrição..."
                : "Descreva o que foi feito para resolver o problema..."}
              rows={4}
              disabled={cronAtivo}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${cronAtivo
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white border-gray-300 text-gray-900"}`}
            />
          </div>

          {/* Display */}
          <div className="text-center py-8">
            <div className={`text-6xl font-bold mb-2 font-mono transition-colors ${cronAtivo ? "text-green-600" : pausado ? "text-yellow-600" : "text-gray-400"}`}>
              {formatarTempo(tempoDecorrido)}
            </div>

            {horaInicioLabel && iniciado ? (
              <p className="text-sm text-gray-500 mb-4">
                Iniciado às <span className="font-semibold">{horaInicioLabel}</span>
                {cronAtivo
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

            <div className="flex gap-3 justify-center mt-2">
              {cronAtivo ? (
                <button onClick={pausar}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-yellow-500 hover:bg-yellow-600 text-white">
                  <Pause className="w-5 h-5" /> Pausar
                </button>
              ) : pausado ? (
                <button onClick={retomar}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white">
                  <Play className="w-5 h-5" /> Retomar
                </button>
              ) : (
                <button onClick={iniciarManual} disabled={!intervencaoId}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white">
                  <Play className="w-5 h-5" /> Iniciar
                </button>
              )}

              {iniciado && (
                <button onClick={salvar}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white">
                  <Save className="w-5 h-5" /> Salvar
                </button>
              )}
            </div>

            {cronAtivo && (
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
        {registros.length === 0 ? (
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
                {registros.map(r => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">{new Date(r.data).toLocaleDateString("pt-AO")}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">#{r.intervencaoId}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                      {r.horaInicio && r.horaFim ? `${r.horaInicio} – ${r.horaFim}` : "—"}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{r.descricao || "—"}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-green-600 text-right">{r.horas.toFixed(2)}h</td>
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
