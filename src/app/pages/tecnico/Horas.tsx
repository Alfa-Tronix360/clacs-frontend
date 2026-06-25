import { Clock, Pause, Save, Calendar, Loader, Play } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { intervencoesAPI, registrosHorasAPI, tecnicosAPI } from "../../services/api";

interface Intervencao { id: string; numero: string; titulo: string; status: string; }
interface RegistroHoras { id: string; intervencaoId: string; data: string; horas: number; horaInicio: string; horaFim: string; descricao?: string; }

const fmt = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(v => String(v).padStart(2, "0")).join(":");
const toHHMM = (ts: number) => { const d = new Date(ts); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const STATUS_FECHADOS = ["Resolvido", "Fechado", "Concluído"];

// localStorage keys
const K = { id: "cron_id", ini: "cron_ini", acum: "cron_acum", paus: "cron_paus", hora: "cron_hora" };
const lsGet = (k: string) => localStorage.getItem(k) || "";
const lsSet = (k: string, v: string) => localStorage.setItem(k, v);
const lsClear = () => Object.values(K).forEach(k => localStorage.removeItem(k));
const getTotal = () => {
  const acum = parseInt(lsGet(K.acum) || "0");
  const ini = lsGet(K.ini);
  if (lsGet(K.paus) === "true" || !ini) return acum;
  return acum + Math.floor((Date.now() - parseInt(ini)) / 1000);
};

export default function TecnicoHoras() {
  const navigate = useNavigate();

  // Ler ID da URL
  const params = new URLSearchParams(window.location.search);
  const novoIdInicial = params.get('intervencaoId');
  if (novoIdInicial) {
    const agora = Date.now();
    const hi = toHHMM(agora);
    localStorage.setItem("cron_id", novoIdInicial);
    localStorage.setItem("cron_ini", String(agora));
    localStorage.setItem("cron_acum", "0");
    localStorage.setItem("cron_paus", "false");
    localStorage.setItem("cron_hora", hi);
  }
  const [intervencoes, setIntervencoes] = useState<Intervencao[]>([]);
  const [registros, setRegistros] = useState<RegistroHoras[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [tecnicoId, setTecnicoId] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [intervId, setIntervId] = useState(lsGet(K.id));
  const [cronAtivo, setCronAtivo] = useState(() => {
    const id = localStorage.getItem("cron_id");
    const paus = localStorage.getItem("cron_paus");
    const ini = localStorage.getItem("cron_ini");
    return !!id && paus !== "true" && !!ini;
  });
  const [pausado, setPausado] = useState(lsGet(K.paus) === "true");
  const [iniciado, setIniciado] = useState(!!lsGet(K.id));
  const [tempo, setTempo] = useState(getTotal());
  const [horaLabel, setHoraLabel] = useState(lsGet(K.hora));
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const usuarioId = localStorage.getItem("userId");

  // Inicia o intervalo do contador — não depende de estado React
  const startInterval = () => {


    if (ref.current) clearInterval(ref.current);
    ref.current = setInterval(() => setTempo(getTotal()), 1000);
  };

  useEffect(() => {
    if (cronAtivo) {
      startInterval();
    }
  }, []);
  // Função principal de início — reutilizada pelo botão E pelo sessionStorage
  const iniciar = (id: string) => {
    const agora = Date.now();
    const hi = toHHMM(agora);
    lsSet(K.id, id);
    lsSet(K.ini, String(agora));
    lsSet(K.acum, "0");
    lsSet(K.paus, "false");
    lsSet(K.hora, hi);
    setIntervId(id);
    setHoraLabel(hi);
    setTempo(0);
    setCronAtivo(true);
    setPausado(false);
    setIniciado(true);
    startInterval(); // ← intervalo inicia aqui, independente do setState
  };

  const carregarDados = useCallback(async (tId: string) => {
    const [ir, rr] = await Promise.all([
      intervencoesAPI.listarPorTecnico(tId),
      registrosHorasAPI.listarPorTecnico(tId),
    ]);
    if (ir.success) setIntervencoes(ir.data);
    if (rr.success) setRegistros(rr.data);
  }, []);

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

        // Veio de "Resolver"?
        // Adicionar no useEffect, depois de carregarDados:
        if (novoIdInicial) {
          intervencoesAPI.atualizarStatus(novoIdInicial, "Em Andamento").catch(console.error);
        }

        // Sessão activa anterior?
        const idGuardado = lsGet(K.id);
        if (idGuardado) {
          const estaPausado = lsGet(K.paus) === "true";
          setIntervId(idGuardado);
          setHoraLabel(lsGet(K.hora));
          setIniciado(true);
          setTempo(getTotal());
          if (!estaPausado) {
            setCronAtivo(true);
            setPausado(false);
            startInterval(); // ← intervalo inicia aqui também
          } else {
            setCronAtivo(false);
            setPausado(true);
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [usuarioId, carregarDados]);

  const mostrar = (tipo: "sucesso" | "erro", texto: string) => {
    setMsg({ tipo, texto });
    setTimeout(() => setMsg(null), 5000);
  };

  const pausar = () => {
    const total = getTotal();
    lsSet(K.acum, String(total));
    lsSet(K.ini, "");
    lsSet(K.paus, "true");
    if (ref.current) clearInterval(ref.current);
    setTempo(total);
    setCronAtivo(false);
    setPausado(true);
  };

  const retomar = () => {
    lsSet(K.ini, String(Date.now()));
    lsSet(K.paus, "false");
    setCronAtivo(true);
    setPausado(false);
    startInterval();
  };

  const salvar = async () => {
    console.log("SALVAR:", { intervId, tecnicoId, descricao: descricao.trim(), total: getTotal() });
    if (!intervId) { mostrar("erro", "Nenhuma intervenção seleccionada."); return; }
    if (!descricao.trim()) { mostrar("erro", "Preencha a descrição da solução."); return; }
    if (!tecnicoId) { mostrar("erro", "Técnico não identificado."); return; }
    const total = getTotal();
    if (total === 0) { mostrar("erro", "Inicie o cronómetro antes de salvar."); return; }
    if (ref.current) clearInterval(ref.current);
    const horaInicio = lsGet(K.hora) || toHHMM(Date.now() - total * 1000);
    const horaFim = toHHMM(Date.now());
    try {
      await registrosHorasAPI.criar({
        intervencao_id: intervId, tecnico_id: tecnicoId,
        horas: total / 3600, hora_inicio: horaInicio, hora_fim: horaFim,
        data: new Date().toISOString(), descricao: descricao.trim(),
      });
      await intervencoesAPI.atualizarStatus(intervId, "Resolvido");
      mostrar("sucesso", `Guardado! (${horaInicio} – ${horaFim}). Intervenção marcada como resolvida.`);
      lsClear();
      setCronAtivo(false); setPausado(false); setIniciado(false);
      setTempo(0); setIntervId(""); setHoraLabel(""); setDescricao("");
      setTimeout(() => navigate('/tecnico/intervencoes'), 1500);
    } catch (e) {
      console.error(e);
      mostrar("erro", "Erro ao salvar. Tente novamente.");
    }
  };

  const hoje = new Date();
  const soma = (fn: (r: RegistroHoras) => boolean) => registros.filter(fn).reduce((a, r) => a + (r.horas ?? 0), 0);
  const horasHoje = soma(r => new Date(r.data).toDateString() === hoje.toDateString());
  const horasSemana = soma(r => (hoje.getTime() - new Date(r.data).getTime()) / 86400000 < 7);
  const horasMes = soma(r => { const d = new Date(r.data); return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear(); });
  const intervActual = intervencoes.find(i => i.id === intervId);

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

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${msg.tipo === "sucesso"
          ? "bg-green-50 border border-green-200 text-green-800"
          : "bg-red-50 border border-red-200 text-red-800"}`}>
          {msg.texto}
        </div>
      )}

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cronómetro</h2>
        <div className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Intervenção</label>
            {iniciado && intervActual ? (
              <div className="w-full px-4 py-2 border border-green-300 bg-green-50 rounded-lg text-green-800 font-medium">
                {intervActual.numero} — {intervActual.titulo}
              </div>
            ) : iniciado ? (
              <div className="w-full px-4 py-2 border border-green-200 bg-green-50 rounded-lg text-green-600 text-sm">
                A carregar intervenção...
              </div>
            ) : (
              <select value={intervId} onChange={e => setIntervId(e.target.value)} disabled={cronAtivo}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100">
                <option value="">Escolha uma intervenção...</option>
                {intervencoes.filter(i => !STATUS_FECHADOS.includes(i.status)).map(i => (
                  <option key={i.id} value={i.id}>{i.numero} — {i.titulo}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição da Solução <span className="text-red-500">*</span>
              {cronAtivo && <span className="ml-2 text-xs text-gray-400">(pause para preencher)</span>}
            </label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder={cronAtivo ? "⏸ Pause o cronómetro para escrever..." : "Descreva o que foi feito para resolver o problema..."}
              rows={4} disabled={cronAtivo}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${cronAtivo
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white border-gray-300 text-gray-900"}`} />
          </div>

          <div className="text-center py-8">
            <div className={`text-6xl font-bold mb-2 font-mono ${cronAtivo ? "text-green-600" : pausado ? "text-yellow-600" : "text-gray-400"}`}>
              {fmt(tempo)}
            </div>

            {horaLabel && iniciado ? (
              <p className="text-sm text-gray-500 mb-4">
                Iniciado às <span className="font-semibold">{horaLabel}</span>
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
                <button onClick={pausar} className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-yellow-500 hover:bg-yellow-600 text-white">
                  <Pause className="w-5 h-5" /> Pausar
                </button>
              ) : pausado ? (
                <button onClick={retomar} className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white">
                  <Play className="w-5 h-5" /> Retomar
                </button>
              ) : (
                <button onClick={() => iniciar(intervId)} disabled={!intervId}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white">
                  <Play className="w-5 h-5" /> Iniciar
                </button>
              )}

              {iniciado && (
                <button onClick={salvar} className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white">
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
