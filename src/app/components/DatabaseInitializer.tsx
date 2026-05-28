import { useState, useEffect } from 'react';
import { Database, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { devAPI, statsAPI } from '../services/api';

export default function DatabaseInitializer() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [hasData, setHasData] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkData();
  }, []);

  const checkData = async () => {
    try {
      setChecking(true);
      const response = await statsAPI.dashboard();
      
      if (response.success && response.data) {
        const stats = response.data;
        const totalRecords = stats.totalClientes + stats.totalContratos + 
                           stats.totalIntervencoes + stats.totalTecnicos;
        
        setHasData(totalRecords > 0);
        
        if (totalRecords > 0) {
          setMessage(`${totalRecords} registros encontrados no banco de dados`);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar dados:', error);
      setHasData(false);
    } finally {
      setChecking(false);
    }
  };

  const handleSeedData = async () => {
    try {
      setStatus('loading');
      setMessage('Inserindo dados no banco...');
      
      const response = await devAPI.seedData();
      
      if (response.success) {
        setStatus('success');
        setMessage(`Dados inseridos: ${response.counts.clientes} clientes, ${response.counts.tecnicos} técnicos, ${response.counts.contratos} contratos, ${response.counts.intervencoes} intervenções e ${response.counts.registros} registros`);
        setHasData(true);
        
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setStatus('error');
      setMessage(`Erro ao inserir dados: ${error}`);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Tem certeza que deseja limpar TODOS os dados? Esta ação não pode ser desfeita!')) {
      return;
    }

    try {
      setStatus('loading');
      setMessage('Limpando dados...');
      
      const response = await devAPI.clearData();
      
      if (response.success) {
        setStatus('success');
        setMessage('Todos os dados foram limpos com sucesso!');
        setHasData(false);
        
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setStatus('error');
      setMessage(`Erro ao limpar dados: ${error}`);
    }
  };

  if (checking) {
    return (
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-md">
        <div className="flex items-center gap-3">
          <Loader className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-sm text-gray-600">Verificando banco de dados...</span>
        </div>
      </div>
    );
  }

  if (hasData && status === 'idle') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md z-50">
      <div className="flex items-start gap-3 mb-4">
        <Database className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">Inicialização do Banco de Dados</h3>
          {!hasData && status === 'idle' && (
            <p className="text-sm text-gray-600">
              O banco de dados está vazio. Deseja popular com dados de demonstração?
            </p>
          )}
        </div>
      </div>

      {message && (
        <div className={`flex items-start gap-2 mb-4 p-3 rounded-lg ${
          status === 'success' ? 'bg-green-50 text-green-800' :
          status === 'error' ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {status === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {status === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          {status === 'loading' && <Loader className="w-5 h-5 flex-shrink-0 mt-0.5 animate-spin" />}
          <p className="text-sm">{message}</p>
        </div>
      )}

      <div className="flex gap-2">
        {!hasData && status === 'idle' && (
          <button
            onClick={handleSeedData}
            disabled={status === 'loading'}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Inserir Dados Mock
          </button>
        )}
        
        {hasData && status === 'idle' && (
          <button
            onClick={handleClearData}
            disabled={status === 'loading'}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Limpar Dados
          </button>
        )}

        {status === 'idle' && (
          <button
            onClick={() => setStatus('idle')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Fechar
          </button>
        )}
      </div>
    </div>
  );
}
