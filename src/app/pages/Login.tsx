import { useState } from 'react';
import { useNavigate } from 'react-router';
import { LogIn, User, Lock, Loader, RefreshCw } from 'lucide-react';
import { authAPI } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [showReset, setShowReset] = useState(false);

  const handleReset = () => {
    if (confirm('Deseja limpar todos os dados do localStorage? Isto irá requerer uma nova inicialização do sistema.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      console.log('=== INICIANDO LOGIN ===');
      console.log('Email:', email);
      
      const response = await authAPI.login({ email, password: senha });
      console.log('Resposta do login:', response);

      if (response.success) {
        const { session, profile, tecnicoId, clienteId } = response.data;
        
        console.log('Login bem-sucedido!');
        console.log('Profile:', profile);
        console.log('TecnicoId recebido:', tecnicoId);
        console.log('ClienteId recebido:', clienteId);

        // Salvar dados no localStorage
        localStorage.setItem('access_token', session.access_token);
        localStorage.setItem('refresh_token', session.refresh_token);
        localStorage.setItem('userId', profile.id);
        localStorage.setItem('userName', profile.nome);
        localStorage.setItem('userEmail', profile.email);
        localStorage.setItem('userType', profile.tipo);

        console.log('Dados salvos no localStorage:');
        console.log('- userId:', profile.id);
        console.log('- userName:', profile.nome);
        console.log('- userType:', profile.tipo);

        // Se for técnico, salvar também o tecnicoId
        if (profile.tipo === 'tecnico') {
          if (tecnicoId) {
            localStorage.setItem('tecnicoId', tecnicoId);
            console.log('- tecnicoId:', tecnicoId);
            console.log('✅ TecnicoId salvo no localStorage com sucesso!');
          } else {
            console.warn('⚠️ AVISO: Usuário é técnico mas tecnicoId não foi retornado pelo backend');
            console.warn('⚠️ Isso pode indicar que o técnico não foi criado na tabela tecnicos');
          }
        }

        // Se for cliente, salvar também o clienteId
        if (profile.tipo === 'cliente') {
          if (clienteId) {
            localStorage.setItem('clienteId', clienteId);
            console.log('- clienteId:', clienteId);
            console.log('✅ ClienteId salvo no localStorage com sucesso!');
          } else {
            console.warn('⚠️ AVISO: Usuário é cliente mas clienteId não foi retornado pelo backend');
            console.warn('⚠️ Isso pode indicar que o cliente não foi criado na tabela clientes');
          }
        }

        // Redirecionar baseado no tipo de usuário
        setTimeout(() => {
          if (profile.tipo === 'admin') {
            navigate('/admin/dashboard');
          } else if (profile.tipo === 'tecnico') {
            navigate('/tecnico/dashboard');
          } else {
            navigate('/cliente/dashboard');
          }
        }, 300);
      }
    } catch (error: any) {
      console.error('❌ Erro ao fazer login:', error);
      setErro(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema CLACS</h1>
            <p className="text-gray-600">Gestão de Intervenções - Angola</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {erro}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Sistema CLACS - Angola</p>
          
        </div>
      </div>
    </div>
  );
}