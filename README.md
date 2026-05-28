# CLACS - Frontend

Frontend do Sistema CLACS (Sistema de Gestão de Intervenções) desenvolvido com React, TypeScript e Tailwind CSS.

## Estrutura do Frontend

```
front/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ui/                    # Componentes UI reutilizáveis
│   │   │   ├── AuthInitializer.tsx    # Inicialização de autenticação
│   │   │   ├── DatabaseInitializer.tsx # Inicialização do database
│   │   │   ├── ErrorBoundary.tsx      # Tratamento de erros
│   │   │   └── figma/                 # Componentes do Figma
│   │   │
│   │   ├── pages/
│   │   │   ├── admin/                 # Páginas do Admin (Azul)
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Clientes.tsx
│   │   │   │   ├── Contratos.tsx
│   │   │   │   ├── Intervencoes.tsx
│   │   │   │   ├── Tecnicos.tsx
│   │   │   │   └── Relatorios.tsx
│   │   │   │
│   │   │   ├── tecnico/               # Páginas do Técnico (Verde)
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Intervencoes.tsx
│   │   │   │   └── Horas.tsx
│   │   │   │
│   │   │   ├── cliente/               # Páginas do Cliente (Roxo)
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Intervencoes.tsx
│   │   │   │   └── Contratos.tsx
│   │   │   │
│   │   │   ├── Login.tsx              # Página de login
│   │   │   └── ErrorPage.tsx          # Página de erro
│   │   │
│   │   ├── layouts/
│   │   │   ├── AdminLayout.tsx        # Layout Admin (Azul)
│   │   │   ├── TecnicoLayout.tsx      # Layout Técnico (Verde)
│   │   │   └── ClienteLayout.tsx      # Layout Cliente (Roxo)
│   │   │
│   │   ├── services/
│   │   │   └── api.ts                 # Cliente API REST
│   │   │
│   │   ├── routes.tsx                 # Configuração de rotas
│   │   └── App.tsx                    # Componente principal
│   │
│   ├── styles/
│   │   ├── index.css                  # CSS global
│   │   ├── tailwind.css               # Tailwind base
│   │   ├── theme.css                  # Tokens de design
│   │   └── fonts.css                  # Imports de fontes
│   │
│   └── imports/                       # Imports do Figma
│
├── public/                            # Assets estáticos
├── package.json                       # Dependências
├── vite.config.ts                     # Configuração do Vite
├── tsconfig.json                      # Configuração TypeScript
├── postcss.config.mjs                 # Configuração PostCSS
├── .env.example                       # Exemplo de variáveis
└── README.md                          # Este arquivo
```

## Tecnologias Utilizadas

- **React 18** - Biblioteca UI
- **TypeScript** - Linguagem tipada
- **Vite** - Build tool e dev server
- **Tailwind CSS v4** - Framework CSS
- **React Router** - Roteamento
- **Lucide React** - Biblioteca de ícones
- **Supabase Client** - Autenticação e Database

## Configuração

### 1. Instalar Dependências

```bash
cd front
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do frontend:

```env
# URL do Backend
VITE_API_URL=https://seu-backend.com/functions/v1/make-server-1eb66b2f

# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-publica
```

**Desenvolvimento Local:**
```env
VITE_API_URL=http://localhost:54321/functions/v1/make-server-1eb66b2f
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=sua-chave-local
```

### 3. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:5173`

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Linter
npm run lint

# Type check
npm run type-check
```

## Estrutura de Rotas

### Rotas Públicas
- `/` - Página de login

### Rotas Privadas - Admin (Azul)
- `/admin` - Dashboard administrativo
- `/admin/clientes` - Gestão de clientes
- `/admin/contratos` - Gestão de contratos
- `/admin/intervencoes` - Gestão de intervenções
- `/admin/tecnicos` - Gestão de técnicos
- `/admin/relatorios` - Relatórios e estatísticas

### Rotas Privadas - Técnico (Verde)
- `/tecnico` - Dashboard do técnico
- `/tecnico/intervencoes` - Intervenções atribuídas
- `/tecnico/horas` - Registro de horas trabalhadas

### Rotas Privadas - Cliente (Roxo)
- `/cliente` - Dashboard do cliente
- `/cliente/intervencoes` - Intervenções abertas
- `/cliente/contratos` - Contratos e horas

## Sistema de Cores por Perfil

### Admin (Azul)
- Primária: `bg-blue-600`, `text-blue-600`
- Hover: `hover:bg-blue-700`
- Foco: `focus:ring-blue-500`

### Técnico (Verde)
- Primária: `bg-green-600`, `text-green-600`
- Hover: `hover:bg-green-700`
- Foco: `focus:ring-green-500`

### Cliente (Roxo)
- Primária: `bg-purple-600`, `text-purple-600`
- Hover: `hover:bg-purple-700`
- Foco: `focus:ring-purple-500`

## Cliente API

O arquivo `/src/app/services/api.ts` contém o cliente REST para comunicação com o backend:

```typescript
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL;

// Cliente API genérico
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  return response.json();
}

// Endpoints específicos
export const clientesAPI = { /* ... */ };
export const tecnicosAPI = { /* ... */ };
export const contratosAPI = { /* ... */ };
export const intervencoesAPI = { /* ... */ };
export const registrosHorasAPI = { /* ... */ };
```

## Autenticação

### Login
```typescript
import { supabase } from './services/supabase';

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@exemplo.com',
  password: 'senha123'
});
```

### Logout
```typescript
await supabase.auth.signOut();
```

### Verificar Sessão
```typescript
const { data: { session } } = await supabase.auth.getSession();
```

### Redirecionar por Tipo de Usuário
```typescript
if (profile.tipo === 'admin') navigate('/admin');
if (profile.tipo === 'tecnico') navigate('/tecnico');
if (profile.tipo === 'cliente') navigate('/cliente');
```

## Componentes UI

Componentes reutilizáveis baseados em shadcn/ui estão disponíveis em `/src/app/components/ui/`:

- Button
- Input
- Select
- Card
- Dialog
- Table
- Tabs
- Badge
- Alert
- Skeleton
- E muitos outros...

### Exemplo de Uso

```tsx
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';

function MeuComponente() {
  return (
    <Card>
      <Button variant="default" size="lg">
        Clique Aqui
      </Button>
    </Card>
  );
}
```

## Layouts

Cada perfil tem seu próprio layout com:
- Sidebar de navegação
- Header com perfil do usuário
- Área de conteúdo
- Cores específicas do perfil

### AdminLayout (Azul)
```tsx
import AdminLayout from './layouts/AdminLayout';

export default function Dashboard() {
  return (
    <AdminLayout>
      {/* Conteúdo */}
    </AdminLayout>
  );
}
```

### TecnicoLayout (Verde)
```tsx
import TecnicoLayout from './layouts/TecnicoLayout';

export default function Dashboard() {
  return (
    <TecnicoLayout>
      {/* Conteúdo */}
    </TecnicoLayout>
  );
}
```

### ClienteLayout (Roxo)
```tsx
import ClienteLayout from './layouts/ClienteLayout';

export default function Dashboard() {
  return (
    <ClienteLayout>
      {/* Conteúdo */}
    </ClienteLayout>
  );
}
```

## Build para Produção

### 1. Build

```bash
npm run build
```

A build será gerada na pasta `/dist`.

### 2. Preview Local

```bash
npm run preview
```

### 3. Deploy

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Manual (Nginx):**
```bash
# Copiar build
scp -r dist/* user@servidor:/var/www/clacs/

# Configurar Nginx
server {
    listen 80;
    server_name clacs.exemplo.com;
    root /var/www/clacs;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Variáveis de Ambiente para Produção

```env
# Backend em Produção
VITE_API_URL=https://seu-backend.com/functions/v1/make-server-1eb66b2f

# Supabase em Produção
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-producao
```

## Desenvolvimento

### Adicionar Nova Página

1. Criar arquivo em `/src/app/pages/[perfil]/NovaPagina.tsx`
2. Adicionar rota em `/src/app/routes.tsx`
3. Adicionar link no layout correspondente

### Adicionar Novo Endpoint

1. Adicionar função em `/src/app/services/api.ts`
2. Usar `fetchAPI` para fazer requisições
3. Tratar erros e loading states

### Estilização

Use Tailwind CSS v4 inline:

```tsx
<div className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm">
  <h1 className="text-2xl font-bold text-gray-900">Título</h1>
</div>
```

## Tratamento de Erros

```tsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  );
}
```

## Responsividade

O sistema é responsivo e funciona em:
- Desktop (1920px+)
- Tablet (768px - 1920px)
- Mobile (< 768px)

Use classes Tailwind responsivas:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Conteúdo */}
</div>
```

## Suporte

Para problemas ou dúvidas sobre o frontend, consulte:
- Documentação do React: https://react.dev
- Documentação do Tailwind: https://tailwindcss.com
- Documentação do Vite: https://vitejs.dev
