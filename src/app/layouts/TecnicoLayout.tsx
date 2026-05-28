import { Outlet, useNavigate, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Clock,
  Bell,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { tecnicosAPI } from "../services/api";

export default function TecnicoLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tecnicoInfo, setTecnicoInfo] = useState<{nome: string; especialidade: string} | null>(null);
  const usuarioId = localStorage.getItem('userId');

  useEffect(() => {
    carregarDadosTecnico();
  }, []);

  const carregarDadosTecnico = async () => {
    try {
      if (!usuarioId) return;
      
      const response = await tecnicosAPI.buscarPorUsuarioId(usuarioId);
      if (response.success && response.data) {
        setTecnicoInfo({
          nome: response.data.nome,
          especialidade: response.data.especialidade || 'Técnico'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do técnico:', error);
    }
  };

  const menuItems = [
    { path: "/tecnico", label: "Dashboard", icon: LayoutDashboard },
    { path: "/tecnico/intervencoes", label: "Minhas Intervenções", icon: ClipboardList },
    { path: "/tecnico/horas", label: "Registo de Horas", icon: Clock },
  ];

  const isActive = (path: string) => {
    if (path === "/tecnico") {
      return location.pathname === "/tecnico";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 w-64 bg-green-900 text-white transition-transform duration-300`}>
        <div className="flex items-center justify-between p-6 border-b border-green-800">
          <h1 className="text-2xl font-bold">CLACS Técnico</h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? "bg-green-700 text-white"
                    : "text-green-100 hover:bg-green-800"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden">
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            
            <div className="flex-1 md:flex-none"></div>
            
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800">
                    {tecnicoInfo?.nome || 'Carregando...'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {tecnicoInfo?.especialidade || ''}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {tecnicoInfo?.nome 
                    ? tecnicoInfo.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    : 'TC'
                  }
                </div>
              </div>
              
              <button
                onClick={() => navigate("/")}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}