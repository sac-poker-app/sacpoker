import { useState, useEffect } from 'react';
import Layout from '@/react-app/components/Layout';
import PlayersTab from '@/react-app/components/PlayersTab';
import TournamentsTab from '@/react-app/components/TournamentsTab';
import StagesTab from '@/react-app/components/StagesTab';
import UnifiedRankingTab from '@/react-app/components/UnifiedRankingTab';
import { Tournament, TabType } from '@/shared/types';
import { useApi } from '@/react-app/hooks/useApi';
import { Lock } from 'lucide-react';

const ADMIN_PASSWORD = 'Sac2005!';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('ranking-view');
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { apiCall } = useApi();

  // Load active tournament on start
  useEffect(() => {
    const loadActiveTournament = async () => {
      try {
        const response = await apiCall('/api/tournaments');
        if (response.success && response.data && response.data.length > 0) {
          setSelectedTournament(response.data[0]);
        }
      } catch (error) {
        console.error('Error loading tournaments:', error);
      }
    };

    loadActiveTournament();
  }, []);

  const handleTournamentSelect = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setActiveTab('stages');
  };

  const handleUnlockAttempt = () => {
    setShowPasswordModal(true);
    setPasswordInput('');
    setPasswordError('');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordInput === ADMIN_PASSWORD) {
      setIsUnlocked(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Senha incorreta');
      setPasswordInput('');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ranking-view':
        return selectedTournament ? (
          <UnifiedRankingTab 
            tournament={selectedTournament}
            onTournamentChange={setSelectedTournament}
            onUnlock={handleUnlockAttempt}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Selecione um torneio para visualizar o ranking</p>
          </div>
        );
      case 'players':
        return <PlayersTab />;
      case 'tournaments':
        return <TournamentsTab onTournamentSelect={handleTournamentSelect} />;
      case 'stages':
        return selectedTournament ? (
          <StagesTab tournament={selectedTournament} />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Selecione um torneio para gerenciar as etapas</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedTournament={selectedTournament}
        isUnlocked={isUnlocked}
      >
        {renderTabContent()}
      </Layout>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-sac-black to-black border border-sac-gold/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-sac-gold/20 p-3 rounded-xl">
                <Lock className="w-6 h-6 text-sac-yellow" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Modo Administrador</h2>
                <p className="text-sm text-sac-green">Digite a senha para continuar</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="Digite a senha"
                  className="w-full bg-white/5 border border-sac-gold/30 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sac-gold"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-400 text-sm mt-2">{passwordError}</p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput('');
                    setPasswordError('');
                  }}
                  className="flex-1 bg-white/10 text-white px-4 py-3 rounded-xl font-medium hover:bg-white/20 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-sac-gold to-sac-yellow text-black px-4 py-3 rounded-xl font-medium hover:from-sac-yellow hover:to-sac-gold transition-all duration-200"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
