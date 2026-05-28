const API_BASE_URL = `https://clacs-backend.onrender.com`;

// Obter token de autenticação do localStorage
function getAuthToken() {
  return localStorage.getItem('access_token');
}

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = ['/auth/login', '/auth/signup', '/seed-data', '/clear-data', '/fix-user-links', '/migrate-status'];

// Rotas que devem usar publicAnonKey em vez de token do usuário (incluindo rotas de escrita)
const PUBLIC_READ_ROUTES = [
  '/clientes',
  '/tecnicos',
  '/contratos',
  '/intervencoes',
  '/registros-horas',
  '/stats/dashboard'
];

// Função auxiliar para fazer requisições
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getAuthToken();

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log(`[API] Fazendo requisição para: ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`[API] Status da resposta:`, response.status);

    let data = null;

    // evita erro em respostas vazias
    const text = await response.text();

    if (text) {
      data = JSON.parse(text);
    }

    console.log(`[API] Dados da resposta:`, data);

    if (!response.ok) {
      console.error(`Erro na API (${endpoint}):`, data);

      throw new Error(
        data?.error || 'Erro na requisição'
      );
    }

    return data;

  } catch (error) {
    console.error(`Erro ao chamar API (${endpoint}):`, error);
    throw error;
  }
}

// ====================================
// AUTENTICAÇÃO
// ====================================

export const authAPI = {
  signup: async (userData: {
    email: string;
    password: string;
    nome: string;
    tipo: 'admin' | 'tecnico' | 'cliente';
  }) => {
    try {
      return await fetchAPI('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (error: any) {
      // Retornar erro de forma silenciosa para signup
      return {
        success: false,
        error: error.message || 'Erro ao criar conta'
      };
    }
  },

  login: async (credentials: { email: string; password: string }) => {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  getProfile: async () => {
    return fetchAPI('/auth/profile');
  },

  updateProfile: async (profileData: Partial<any>) => {
    return fetchAPI('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  logout: async () => {
    return fetchAPI('/auth/logout', {
      method: 'POST',
    });
  },
};

// ====================================
// CLIENTES
// ====================================

export const clientesAPI = {
  listar: async () => {
    return fetchAPI('/clientes');
  },

  buscar: async (id: string) => {
    return fetchAPI(`/clientes/${id}`);
  },

  buscarPorUsuarioId: async (usuarioId: string) => {
    return fetchAPI(`/clientes/usuario/${usuarioId}`);
  },

  criar: async (cliente: {
    nome: string;
    email: string;
    telefone?: string;
    senha?: string;
    status?: string;
  }) => {
    console.log('=== API FRONTEND: clientesAPI.criar() chamado ===');
    console.log('Dados recebidos:', {
      ...cliente,
      senha: cliente.senha ? `[${cliente.senha.length} caracteres]` : 'VAZIO'
    });
    console.log('Senha presente?', !!cliente.senha);
    console.log('Tamanho da senha:', cliente.senha?.length);

    const result = await fetchAPI('/clientes', {
      method: 'POST',
      body: JSON.stringify(cliente),
    });

    console.log('=== Resultado da criação do cliente ===');
    console.log('usuario_id:', result.data?.usuario_id);
    console.log('Cliente criado:', result.data?.id);

    return result;
  },

  atualizar: async (id: string, cliente: Partial<any>) => {
    return fetchAPI(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cliente),
    });
  },

  deletar: async (id: string) => {
    return fetchAPI(`/clientes/${id}`, {
      method: 'DELETE',
    });
  },
};

// ====================================
// CONTRATOS
// ====================================

export const contratosAPI = {
  listar: async () => {
    return fetchAPI('/contratos');
  },

  listarPorCliente: async (clienteId: string) => {
    return fetchAPI(`/contratos/cliente/${clienteId}`);
  },

  criar: async (contrato: {
    clienteId: string;
    tipo: string;
    horasContratadas?: number;
    valorMensal?: number;
    dataInicio?: string;
    dataFim?: string | null;
  }) => {
    return fetchAPI('/contratos', {
      method: 'POST',
      body: JSON.stringify({
        cliente_id: contrato.clienteId,
        tipo: contrato.tipo,
        horas_contratadas: contrato.horasContratadas,
        valor_mensal: contrato.valorMensal,
        data_inicio: contrato.dataInicio,
        data_fim: contrato.dataFim,
      }),
    });
  },

  atualizar: async (id: string, contrato: Partial<any>) => {
    const mapped: any = {};
    if (contrato.clienteId !== undefined) mapped.cliente_id = contrato.clienteId;
    if (contrato.tipo !== undefined) mapped.tipo = contrato.tipo;
    if (contrato.horasContratadas !== undefined) mapped.horas_contratadas = contrato.horasContratadas;
    if (contrato.horasUsadas !== undefined) mapped.horas_usadas = contrato.horasUsadas;
    if (contrato.valorMensal !== undefined) mapped.valor_mensal = contrato.valorMensal;
    if (contrato.valorTotal !== undefined) mapped.valor_total = contrato.valorTotal;
    if (contrato.dataInicio !== undefined) mapped.data_inicio = contrato.dataInicio;
    if (contrato.dataFim !== undefined) mapped.data_fim = contrato.dataFim;
    if (contrato.status !== undefined) mapped.status = contrato.status;
    if (contrato.observacoes !== undefined) mapped.observacoes = contrato.observacoes;

    return fetchAPI(`/contratos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapped),
    });
  },


  deletar: async (id: string) => {
  return fetchAPI(`/contratos/${id}`, {
    method: 'DELETE',
  });
},
};

// ====================================
// INTERVENÇÕES
// ====================================

export const intervencoesAPI = {
  listar: async () => {
    return fetchAPI('/intervencoes');
  },

  buscar: async (id: string) => {
    return fetchAPI(`/intervencoes/${id}`);
  },

  listarPorCliente: async (clienteId: string) => {
    return fetchAPI(`/intervencoes/cliente/${clienteId}`);
  },

  listarPorTecnico: async (tecnicoId: string) => {
    return fetchAPI(`/intervencoes/tecnico/${tecnicoId}`);
  },

  criar: async (intervencao: {
    titulo: string;
    descricao?: string;
    clienteId: string;
    tecnicoId?: string | null;
    prioridade?: string;
    categoria?: string;
    anexos?: any[];
  }) => {
    return fetchAPI('/intervencoes', {
      method: 'POST',
      body: JSON.stringify({
        titulo: intervencao.titulo,
        descricao: intervencao.descricao,
        categoria: intervencao.categoria,
        prioridade: intervencao.prioridade,
        cliente_id: intervencao.clienteId,
        tecnico_id: intervencao.tecnicoId,
        anexos: intervencao.anexos,
      }),
    });
  },

  atualizar: async (id: string, intervencao: Partial<any>) => {
    return fetchAPI(`/intervencoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(intervencao),
    });
  },

  atualizarStatus: async (id: string, status: string) => {
    return fetchAPI(`/intervencoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: status }),
    });
  },

  adicionarComentario: async (id: string, comentario: {
    autor: string;
    texto: string;
  }) => {
    return fetchAPI(`/intervencoes/${id}/comentarios`, {
      method: 'POST',
      body: JSON.stringify(comentario),
    });
  },
};

// ====================================
// TÉCNICOS
// ====================================

export const tecnicosAPI = {
  listar: async () => {
    return fetchAPI('/tecnicos');
  },

  buscarPorUsuarioId: async (usuarioId: string) => {
    return fetchAPI(`/tecnicos/usuario/${usuarioId}`);
  },

  criar: async (tecnico: {
    nome: string;
    email: string;
    senha?: string;
    nivel?: string;
    especialidade?: string;
  }) => {
    return fetchAPI('/tecnicos', {
      method: 'POST',
      body: JSON.stringify(tecnico),
    });
  },

  atualizar: async (id: string, tecnico: Partial<any>) => {
    return fetchAPI(`/tecnicos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tecnico),
    });
  },

  vincularUsuario: async (tecnicoId: string, userId: string) => {
    return fetchAPI(`/tecnicos/${tecnicoId}/vincular-usuario`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  deletar: async (id: string) => {
  return fetchAPI(`/tecnicos/${id}`, {
    method: 'DELETE',
  });
},
};

// ====================================
// REGISTROS DE HORAS
// ====================================

export const registrosHorasAPI = {
  listar: async () => {
    return fetchAPI('/registros-horas');
  },

  listarPorIntervencao: async (intervencaoId: string) => {
    return fetchAPI(`/registros-horas/intervencao/${intervencaoId}`);
  },

  listarPorTecnico: async (tecnicoId: string) => {
    return fetchAPI(`/registros-horas/tecnico/${tecnicoId}`);
  },

  
  criar: async (registro: {
    intervencao_id: string;
    tecnico_id: string;
    horas: number;
    descricao?: string;
    hora_inicio: string;  
    hora_fim: string;     
    data?: string;
  }) => {
    return fetchAPI('/registros-horas', {
      method: 'POST',
      body: JSON.stringify(registro), // ← envia direto, já está em snake_case
    });
  },
};

// ====================================
// ESTATÍSTICAS
// ====================================

export const statsAPI = {
  dashboard: async () => {
    return fetchAPI('/stats/dashboard');
  },
};

// ====================================
// INICIALIZAÇÃO (APENAS DESENVOLVIMENTO)
// ====================================

export const devAPI = {
  seedData: async () => {
    return fetchAPI('/seed-data', {
      method: 'POST',
    });
  },

  clearData: async () => {
    return fetchAPI('/clear-data', {
      method: 'DELETE',
    });
  },

  fixUserLinks: async () => {
    return fetchAPI('/fix-user-links', {
      method: 'POST',
    });
  },

  migrateStatus: async () => {
    return fetchAPI('/migrate-status', {
      method: 'POST',
    });
  },
};
