import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Share2, Filter, Check, Copy } from 'lucide-react';
import { Tournament, PlayerRanking } from '@/shared/types';
import { useApi } from '@/react-app/hooks/useApi';

interface RankingViewTabProps {
  tournament: Tournament;
  onTournamentChange: (tournament: Tournament) => void;
}

export default function RankingViewTab({ tournament, onTournamentChange }: RankingViewTabProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [rankings, setRankings] = useState<PlayerRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showTournamentSelector, setShowTournamentSelector] = useState(false);
  const { apiCall } = useApi();

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    loadRankings();
  }, [tournament.id]);

  const loadTournaments = async () => {
    try {
      const response = await apiCall('/api/tournaments');
      if (response.success) {
        setTournaments(response.data || []);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
    }
  };

  const loadRankings = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/tournaments/${tournament.id}/ranking`);
      if (response.success) {
        setRankings(response.data || []);
      }
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = async () => {
    const shareUrl = `${window.location.origin}/share/${tournament.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const openSharePage = () => {
    const shareUrl = `${window.location.origin}/share/${tournament.id}`;
    window.open(shareUrl, '_blank');
  };

  const getRankingIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-8 h-8 text-sac-yellow" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Award className="w-8 h-8 text-orange-400" />;
      default:
        return null;
    }
  };

  const getRankingBadge = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-sac-yellow to-sac-gold text-black';
      case 2:
        return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
      default:
        return 'bg-white/10 text-white';
    }
  };

  // Auto-filter rankings to hide players with zero points
  const displayRankings = rankings.filter(r => r.total_points > 0);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-white/10 rounded-2xl"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header with Tournament Info */}
      <div className="bg-gradient-to-br from-sac-gold/20 to-sac-yellow/10 border-b border-sac-gold/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="bg-gradient-to-br from-sac-gold to-sac-yellow p-3 rounded-xl shadow-lg flex-shrink-0">
              <Trophy className="w-6 h-6 text-black" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-white truncate">Ranking</h1>
              <p className="text-sm text-sac-yellow truncate">{tournament.name}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={copyShareLink}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-3 rounded-xl font-medium shadow-lg active:scale-95 transition-all duration-200"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4" />
                <span className="text-sm">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="text-sm">Copiar Link</span>
              </>
            )}
          </button>
          
          <button
            onClick={openSharePage}
            className="flex items-center justify-center space-x-2 bg-white/10 border border-sac-gold/30 text-white px-4 py-3 rounded-xl font-medium active:scale-95 transition-all duration-200"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Visualizar</span>
          </button>
        </div>
      </div>

      {/* Tournament Selector */}
      {tournaments.length > 1 && (
        <div className="p-4 border-b border-white/10">
          <button
            onClick={() => setShowTournamentSelector(!showTournamentSelector)}
            className="flex items-center justify-between w-full bg-white/5 border border-sac-gold/30 rounded-xl px-4 py-3 active:scale-95 transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-sac-gold" />
              <div className="text-left">
                <div className="text-xs text-sac-yellow">Torneio</div>
                <div className="text-sm font-medium text-white">{tournament.name}</div>
              </div>
            </div>
            <div className={`transform transition-transform ${showTournamentSelector ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-sac-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {showTournamentSelector && (
            <div className="mt-2 space-y-2">
              {tournaments.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    onTournamentChange(t);
                    setShowTournamentSelector(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                    t.id === tournament.id
                      ? 'bg-sac-gold/20 border border-sac-gold/50 text-white'
                      : 'bg-white/5 border border-white/10 text-sac-green active:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{t.name}</div>
                      {t.year && (
                        <div className="text-xs text-sac-yellow mt-1">{t.year}</div>
                      )}
                    </div>
                    {t.id === tournament.id && (
                      <Check className="w-5 h-5 text-sac-gold" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {displayRankings.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-sac-gold mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhum jogador com pontuação
            </h3>
            <p className="text-sm text-sac-green">
              Os resultados aparecerão aqui após as etapas serem concluídas
            </p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {displayRankings.length >= 3 && (
              <div className="bg-gradient-to-br from-sac-gold/10 to-sac-yellow/5 border border-sac-gold/30 rounded-2xl p-4 mb-4">
                <h2 className="text-center text-lg font-bold text-white mb-4">🏆 Pódio</h2>
                
                <div className="flex items-end justify-center space-x-4 mb-6">
                  {/* 2nd Place */}
                  <div className="text-center flex-1">
                    <div className="h-20 bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-xl flex items-end justify-center pb-2 mb-3">
                      <span className="text-white font-bold">2º</span>
                    </div>
                    <Medal className="w-7 h-7 text-gray-400 mx-auto mb-2" />
                    <h4 className="text-white font-semibold text-sm mb-1">{displayRankings[1].player_name}</h4>
                    <p className="text-gray-300 text-lg font-bold">{displayRankings[1].total_points} pts</p>
                  </div>

                  {/* 1st Place */}
                  <div className="text-center flex-1">
                    <div className="h-28 bg-gradient-to-t from-sac-gold to-sac-yellow rounded-t-xl flex items-end justify-center pb-2 mb-3 shadow-lg">
                      <span className="text-black font-bold text-lg">1º</span>
                    </div>
                    <Trophy className="w-9 h-9 text-sac-yellow mx-auto mb-2" />
                    <h4 className="text-white font-semibold text-base mb-1">{displayRankings[0].player_name}</h4>
                    <p className="text-sac-yellow text-xl font-bold">{displayRankings[0].total_points} pts</p>
                  </div>

                  {/* 3rd Place */}
                  <div className="text-center flex-1">
                    <div className="h-16 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-xl flex items-end justify-center pb-2 mb-3">
                      <span className="text-white font-bold text-sm">3º</span>
                    </div>
                    <Award className="w-7 h-7 text-orange-400 mx-auto mb-2" />
                    <h4 className="text-white font-semibold text-sm mb-1">{displayRankings[2].player_name}</h4>
                    <p className="text-orange-300 text-lg font-bold">{displayRankings[2].total_points} pts</p>
                  </div>
                </div>
              </div>
            )}

            {/* Ranking Cards */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center">
                <span className="flex-1">Classificação Completa</span>
                <span className="text-sm text-sac-yellow">{displayRankings.length} jogadores</span>
              </h2>
              
              {displayRankings.map((player, index) => {
                const position = index + 1;
                const isTopThree = position <= 3;
                
                return (
                  <div
                    key={player.player_id}
                    className={`rounded-xl p-4 transition-all duration-200 ${
                      isTopThree 
                        ? 'bg-gradient-to-r from-sac-gold/20 to-sac-yellow/10 border-2 border-sac-gold/50' 
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Position Badge */}
                      <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-bold shadow-lg flex-shrink-0 ${getRankingBadge(position)}`}>
                        {position <= 3 ? (
                          getRankingIcon(position)
                        ) : (
                          <span className="text-2xl">{position}</span>
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-lg mb-1">{player.player_name}</h3>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-sac-green/20 text-sac-green px-2 py-1 rounded-full border border-sac-green/30">
                            {player.stages_played} etapas
                          </span>
                          {player.best_position && (
                            <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-500/30">
                              Melhor: {player.best_position}º
                            </span>
                          )}
                          {player.worst_position && (
                            <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full border border-red-500/30">
                              Pior: {player.worst_position}º
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-3xl font-bold text-sac-yellow">{player.total_points}</div>
                        <div className="text-xs text-sac-green">pontos</div>
                      </div>
                    </div>

                    {/* PIX Key */}
                    {player.pix_key && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="text-xs text-sac-yellow mb-1">PIX:</div>
                        <div className="text-sm text-sac-green font-mono break-all">{player.pix_key}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Info Footer */}
            <div className="mt-6 bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
              <h4 className="text-white font-medium mb-2 text-sm">💡 Dica</h4>
              <p className="text-white/80 text-xs leading-relaxed">
                Use o botão "Compartilhar" para ver a versão completa com pontuação por etapa e gráfico de desempenho.
                Perfeito para compartilhar no WhatsApp!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
