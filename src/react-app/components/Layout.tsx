import { ReactNode } from 'react';
import { Users, Trophy, Target, Eye } from 'lucide-react';
import { TabType, Tournament } from '@/shared/types';

interface LayoutProps {
  children: ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  selectedTournament?: Tournament | null;
  isUnlocked?: boolean;
}

const tabs = [
  { id: 'ranking-view' as TabType, label: 'Ranking', icon: Eye },
  { id: 'players' as TabType, label: 'Participantes', icon: Users },
  { id: 'tournaments' as TabType, label: 'Torneios', icon: Trophy },
  { id: 'stages' as TabType, label: 'Etapas', icon: Target },
];

export default function Layout({ children, activeTab, onTabChange, selectedTournament, isUnlocked = false }: LayoutProps) {
  // Filter tabs based on unlock status
  const visibleTabs = isUnlocked ? tabs : tabs.filter(tab => tab.id === 'ranking-view');
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-sac-black to-black">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-xl border-b border-sac-gold/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl shadow-lg overflow-hidden flex-shrink-0">
                <img 
                  src="https://mocha-cdn.com/019a3a47-d674-7fba-b722-85867ec10efb/SAC-POKER.png" 
                  alt="SAC Poker Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm md:text-xl font-bold text-white truncate">Circuito SAC Texas Hold'em</h1>
                <p className="text-xs md:text-sm text-sac-yellow hidden sm:block">Sistema de Gerenciamento</p>
              </div>
            </div>
            
            {selectedTournament && (
              <div className="hidden md:block flex-shrink-0">
                <div className="bg-sac-gold/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-sac-gold/40">
                  <p className="text-sm text-sac-yellow">Torneio Ativo</p>
                  <p className="text-white font-semibold truncate">{selectedTournament.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-black/40 backdrop-blur-xl border-b border-sac-gold/30">
        <div className="max-w-7xl mx-auto px-1 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between gap-0.5 sm:gap-1 py-2 sm:py-3 md:py-4">
            {visibleTabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    flex flex-col sm:flex-row items-center justify-center sm:space-x-2 px-1 sm:px-3 md:px-6 py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 flex-1 min-w-0
                    ${isActive 
                      ? 'bg-gradient-to-r from-sac-gold to-sac-yellow text-black shadow-lg shadow-sac-gold/25' 
                      : 'text-sac-yellow hover:text-white hover:bg-sac-gold/20'
                    }
                  `}
                >
                  <IconComponent className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs md:text-base leading-tight sm:leading-normal">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl border border-sac-gold/30 shadow-2xl overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
