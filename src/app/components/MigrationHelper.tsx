import { useState } from 'react';
import { AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { devAPI } from '../services/api';

export function MigrationHelper() {
  const [showHelper, setShowHelper] = useState(false);
  const [migrationInfo, setMigrationInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleGetMigrationSQL = async () => {
    try {
      const result = await devAPI.migrateStatus();
      setMigrationInfo(result);
      setShowHelper(true);
    } catch (error) {
      console.error('Erro ao obter SQL de migração:', error);
    }
  };

  const handleCopySQL = () => {
    if (migrationInfo?.sql) {
      navigator.clipboard.writeText(migrationInfo.sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!showHelper) {
    return (
      <button
        onClick={handleGetMigrationSQL}
        className="fixed bottom-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-orange-600 transition-colors flex items-center gap-2 z-50"
      >
        <AlertCircle className="w-5 h-5" />
        Corrigir Erro de Status
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900">
                Migração de Status - Intervenções
              </h2>
            </div>
            <button
              onClick={() => setShowHelper(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-900 mb-2">
              Por que esta migração é necessária?
            </h3>
            <p className="text-orange-800 text-sm">
              O banco de dados não reconhece os status "Resolvido" e "Fechado" que são
              necessários para o fluxo completo de intervenções. Esta migração atualiza
              a constraint do banco para aceitar todos os status.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">
              Instruções Passo a Passo:
            </h3>
            
            {migrationInfo?.instructions?.map((instruction: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-700">{instruction}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                SQL para Executar:
              </h3>
              <button
                onClick={handleCopySQL}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar SQL
                  </>
                )}
              </button>
            </div>
            
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">
              {migrationInfo?.sql}
            </pre>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Fluxo Completo de Status
            </h3>
            <div className="text-blue-800 text-sm space-y-1">
              <p>Aberto → Em Andamento → Resolvido → Fechado → Concluído</p>
              <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                <li>Aberto: Cliente ou Admin cria a intervenção</li>
                <li>Em Andamento: Técnico inicia o trabalho</li>
                <li>Resolvido: Técnico finaliza e registra horas</li>
                <li>Fechado: Cliente confirma resolução</li>
                <li>Concluído: Admin finaliza a intervenção</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href={`https://supabase.com/dashboard/project/${window.location.hostname.split('.')[0]}/sql/new`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <ExternalLink className="w-5 h-5" />
              Abrir Supabase SQL Editor
            </a>
            
            <button
              onClick={() => setShowHelper(false)}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
