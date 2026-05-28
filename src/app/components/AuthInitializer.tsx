import { useEffect, useState } from 'react';
import { authAPI, devAPI } from '../services/api';

export default function AuthInitializer() {
  const [status, setStatus] = useState<'checking' | 'initializing' | 'ready' | 'error'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    initializeSystem();
  }, []);

  const initializeSystem = async () => {
    try {
      setStatus('checking');
      setMessage('Verificando sistema...');

      // Verificar se já foi inicializado nesta sessão
      const hasUsers = localStorage.getItem('users_initialized');

      if (hasUsers === 'true') {
        console.log('ℹ️ Sistema já inicializado');
        setStatus('ready');
        return;
      }

      console.log('=== INICIANDO INICIALIZAÇÃO DO SISTEMA ===');

      setStatus('initializing');
      setMessage('Verificando usuários...');

      // Tentar criar usuários de teste (se já existirem, será ignorado)
      const usuarios = [
        {
          email: 'admin@clacs.ao',
          password: 'admin123',
          nome: 'Administrador CLACS',
          tipo: 'admin' as const
        },
        {
          email: 'tecnico@clacs.ao',
          password: 'tecnico123',
          nome: 'João Silva',
          tipo: 'tecnico' as const
        },
        {
          email: 'cliente@clacs.ao',
          password: 'cliente123',
          nome: 'TechCorp Solutions',
          tipo: 'cliente' as const
        }
      ];

      console.log('Verificando/criando usuários...');
      
      for (const usuario of usuarios) {
        try {
          const response = await authAPI.signup(usuario);
          if (response.success) {
            console.log(`✅ Usuário ${usuario.email} criado com sucesso`);
          }
        } catch (error: any) {
          // Silenciar erros de usuários já existentes
          const errorMsg = error?.message || '';
          if (errorMsg.includes('already registered') || 
              errorMsg.includes('email_exists') || 
              errorMsg.includes('User already registered') ||
              errorMsg.includes('already been registered')) {
            console.log(`ℹ️ Usuário ${usuario.email} já existe (OK)`);
          } else {
            console.warn(`⚠️ Aviso ao verificar usuário ${usuario.email}:`, errorMsg);
          }
        }
      }

      setMessage('Preparando dados...');
      
      // Sempre popular base de dados para garantir dados atualizados
      try {
        const seedResponse = await devAPI.seedData();
        if (seedResponse.success) {
          console.log('✅ Dados mock inseridos com sucesso');
        }
      } catch (error) {
        console.error('❌ Erro ao inserir dados mock:', error);
      }

      setMessage('Vinculando usuários às tabelas...');
      
      // Corrigir vínculos de usuários com as tabelas tecnicos/clientes
      try {
        const fixResponse = await devAPI.fixUserLinks();
        if (fixResponse.success) {
          console.log('✅ Vínculos de usuários corrigidos com sucesso');
          console.log('Técnicos vinculados:', fixResponse.data?.tecnicosVinculados);
          console.log('Clientes vinculados:', fixResponse.data?.clientesVinculados);
        }
      } catch (error) {
        console.error('❌ Erro ao corrigir vínculos:', error);
      }

      // Marcar como inicializado
      localStorage.setItem('users_initialized', 'true');

      setMessage('Sistema pronto!');
      setStatus('ready');

      // Ocultar mensagem após 2 segundos
      setTimeout(() => {
        setMessage('');
      }, 2000);

    } catch (error) {
      console.error('Erro ao inicializar sistema:', error);
      setStatus('error');
      setMessage('Erro na inicialização. Verifique o console.');
    }
  };

  // Não renderizar nada na tela
  if (status === 'ready' || !message) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-sm">
      <div className="flex items-center gap-3">
        {status === 'checking' || status === 'initializing' ? (
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        ) : status === 'error' ? (
          <div className="w-5 h-5 bg-red-500 rounded-full"></div>
        ) : (
          <div className="w-5 h-5 bg-green-500 rounded-full"></div>
        )}
        <p className="text-sm font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}