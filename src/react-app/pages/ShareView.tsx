import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Trophy, Medal, Star, ArrowLeft, RefreshCw } from 'lucide-react';
import { Tournament, PlayerRanking } from '@/shared/types';
import { useApi } from '@/react-app/hooks/useApi';

interface StageScoreData {
  stages: { id: number; stage_number: number; name: string }[];
  players: {
    player_id: number;
    player_name: string;
    stages: {
      stage_number: number;
      final_position: number | null;
      points_earned: number | null;
    }[];
  }[];
}

export default function ShareView() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { apiCall } = useApi();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [rankings, setRankings] = useState<PlayerRanking[]>([]);
  const [stageScores, setStageScores] = useState<StageScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isRefresh = false) => {
    if (!tournamentId) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Load tournament info
      const tournamentsResponse = await apiCall('/api/tournaments');
      if (tournamentsResponse.success) {
        const foundTournament = tournamentsResponse.data?.find(
          (t: Tournament) => t.id === parseInt(tournamentId)
        );
        if (foundTournament) {
          setTournament(foundTournament);
        } else {
          setError('Torneio não encontrado');
          return;
        }
      }

      // Load rankings
      const rankingResponse = await apiCall(`/api/tournaments/${tournamentId}/ranking`);
      if (rankingResponse.success) {
        setRankings(rankingResponse.data || []);
      }

      // Load stage scores
      const stageScoresResponse = await apiCall(`/api/tournaments/${tournamentId}/stage-scores`);
      if (stageScoresResponse.success) {
        setStageScores(stageScoresResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erro ao carregar dados do torneio');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tournamentId]);

  const handleRefresh = () => {
    loadData(true);
  };

  const handleGoBack = () => {
    navigate('/');
  };

  const getPositionColor = (position: number | null) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black';
    if (position === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-black';
    if (position === 3) return 'bg-gradient-to-r from-amber-600 to-amber-800 text-white';
    return 'bg-gray-700 text-white';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-sac-black to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sac-gold mx-auto mb-4"></div>
          <p className="text-white">Carregando dados do torneio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-sac-black to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-sac-black to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Torneio não encontrado</p>
        </div>
      </div>
    );
  }

  // Auto-filter to hide players with zero points
  const displayRankings = rankings.filter(r => r.total_points > 0);
  const topThree = displayRankings.slice(0, 3);

  // Filter stage scores to only show players with points
  const displayStageScores = stageScores ? {
    ...stageScores,
    players: stageScores.players.filter(player => {
      const playerRanking = rankings.find(r => r.player_id === player.player_id);
      return playerRanking && playerRanking.total_points > 0;
    })
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-sac-black to-black">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur-xl border-b border-sac-gold/30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-xl shadow-lg overflow-hidden flex-shrink-0">
                <img 
                  src="https://mocha-cdn.com/019a3a47-d674-7fba-b722-85867ec10efb/SAC-POKER.png" 
                  alt="SAC Poker Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xs sm:text-sm md:text-xl font-bold text-white truncate">Circuito SAC Texas Hold'em</h1>
                <p className="text-xs md:text-sm text-sac-yellow">Ranking do Torneio</p>
              </div>
            </div>
            
            <div className="bg-sac-gold/20 backdrop-blur-sm rounded-lg md:rounded-xl px-2 md:px-4 py-1 md:py-2 border border-sac-gold/40">
              <p className="text-xs md:text-sm text-sac-yellow">Visualização Pública</p>
              <p className="text-xs md:text-base text-white font-semibold truncate max-w-32 md:max-w-none">{tournament.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          
          {/* Tournament Title */}
          <div className="text-center px-2">
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-2 leading-tight">
              {tournament.name}
            </h2>
            {tournament.description && (
              <p className="text-sac-yellow text-sm sm:text-base md:text-lg">{tournament.description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleGoBack}
              className="flex-1 flex items-center justify-center space-x-2 bg-white/10 border border-sac-gold/30 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg md:rounded-xl font-medium hover:bg-white/20 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Voltar</span>
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-sac-gold to-sac-yellow text-black px-4 sm:px-6 py-3 sm:py-4 rounded-lg md:rounded-xl font-medium hover:shadow-lg hover:shadow-sac-gold/50 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm sm:text-base">{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
            </button>
          </div>

          {/* Pódio */}
          {topThree.length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl rounded-lg md:rounded-2xl border border-sac-gold/30 shadow-2xl overflow-hidden">
              <div className="p-3 sm:p-4 md:p-6 border-b border-sac-gold/30">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center">
                  <Medal className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-sac-gold" />
                  Pódio dos Campeões
                </h3>
              </div>
              
              <div className="p-3 sm:p-4 md:p-8">
                <div className="flex flex-row items-end justify-center space-x-2 sm:space-x-4 md:space-x-8">
                  {/* 2º Lugar */}
                  {topThree[1] && (
                    <div className="text-center flex-1 max-w-xs">
                      <div className="bg-gradient-to-b from-gray-300 to-gray-500 rounded-lg md:rounded-xl p-2 sm:p-4 md:p-6 mb-2 md:mb-4 shadow-lg h-20 sm:h-28 md:h-40 flex flex-col justify-end">
                        <div className="text-black font-bold text-xs sm:text-base md:text-xl mb-1 md:mb-2">2º Lugar</div>
                        <div className="text-black text-lg sm:text-2xl md:text-4xl font-bold">🥈</div>
                      </div>
                      <h4 className="text-white font-bold text-sm sm:text-lg md:text-2xl mb-1 px-1">{topThree[1].player_name}</h4>
                      <p className="text-sac-gold font-bold text-sm sm:text-xl md:text-3xl">{topThree[1].total_points} pts</p>
                    </div>
                  )}
                  
                  {/* 1º Lugar */}
                  {topThree[0] && (
                    <div className="text-center flex-1 max-w-xs">
                      <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg md:rounded-xl p-2 sm:p-4 md:p-6 mb-2 md:mb-4 shadow-lg h-24 sm:h-32 md:h-48 flex flex-col justify-end">
                        <div className="text-black font-bold text-sm sm:text-lg md:text-2xl mb-1 md:mb-2">1º Lugar</div>
                        <div className="text-black text-xl sm:text-3xl md:text-5xl font-bold">🏆</div>
                      </div>
                      <h4 className="text-white font-bold text-base sm:text-xl md:text-3xl mb-1 px-1">{topThree[0].player_name}</h4>
                      <p className="text-sac-gold font-bold text-lg sm:text-2xl md:text-4xl">{topThree[0].total_points} pts</p>
                    </div>
                  )}
                  
                  {/* 3º Lugar */}
                  {topThree[2] && (
                    <div className="text-center flex-1 max-w-xs">
                      <div className="bg-gradient-to-b from-amber-600 to-amber-800 rounded-lg md:rounded-xl p-2 sm:p-4 md:p-6 mb-2 md:mb-4 shadow-lg h-16 sm:h-24 md:h-36 flex flex-col justify-end">
                        <div className="text-white font-bold text-xs sm:text-base md:text-xl mb-1 md:mb-2">3º Lugar</div>
                        <div className="text-white text-lg sm:text-2xl md:text-4xl font-bold">🥉</div>
                      </div>
                      <h4 className="text-white font-bold text-sm sm:text-lg md:text-2xl mb-1 px-1">{topThree[2].player_name}</h4>
                      <p className="text-sac-gold font-bold text-sm sm:text-xl md:text-3xl">{topThree[2].total_points} pts</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pontuação por Etapa */}
          {displayStageScores && displayStageScores.stages.length > 0 && displayStageScores.players.length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl rounded-lg md:rounded-2xl border border-sac-gold/30 shadow-2xl overflow-hidden">
              <div className="p-3 sm:p-4 md:p-6 border-b border-sac-gold/30">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-sac-gold" />
                  Pontuação por Etapa
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead className="bg-sac-gold/20 backdrop-blur-sm">
                    <tr>
                      <th className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 md:py-4 text-center text-[9px] sm:text-xs font-medium text-sac-yellow uppercase tracking-tight">
                        Pos.
                      </th>
                      <th className="px-1 sm:px-3 md:px-6 py-1 sm:py-2 md:py-4 text-left text-[9px] sm:text-xs font-medium text-sac-yellow uppercase tracking-tight sticky left-0 bg-sac-gold/20">
                        Jogador
                      </th>
                      {displayStageScores.stages.map((stage) => (
                        <th 
                          key={stage.id}
                          className="px-0.5 sm:px-1 md:px-4 py-1 sm:py-2 md:py-4 text-center text-[9px] sm:text-xs font-medium text-sac-yellow uppercase tracking-tight"
                        >
                          E{stage.stage_number}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sac-gold/20">
                    {displayStageScores.players
                      .sort((a, b) => {
                        const aTotal = a.stages.reduce((sum, stage) => sum + (stage.points_earned || 0), 0);
                        const bTotal = b.stages.reduce((sum, stage) => sum + (stage.points_earned || 0), 0);
                        return bTotal - aTotal;
                      })
                      .map((player) => {
                        const rankPosition = displayRankings.findIndex(r => r.player_id === player.player_id) + 1;
                        
                        return (
                          <tr key={player.player_id} className="hover:bg-sac-gold/10 transition-colors">
                            <td className="px-1 sm:px-2 md:px-4 py-1 sm:py-2 md:py-4 text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full text-[10px] sm:text-sm md:text-base font-bold ${
                                rankPosition === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black' :
                                rankPosition === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-black' :
                                rankPosition === 3 ? 'bg-gradient-to-r from-amber-600 to-amber-800 text-white' :
                                'bg-sac-gold/30 text-sac-yellow'
                              }`}>
                                {rankPosition}
                              </span>
                            </td>
                            <td className="px-1 sm:px-3 md:px-6 py-1 sm:py-2 md:py-4 text-white font-medium sticky left-0 bg-black/60 backdrop-blur-sm text-[10px] sm:text-sm md:text-base">
                              <div title={player.player_name}>
                                {player.player_name}
                              </div>
                            </td>
                            {displayStageScores.stages.map((stage) => {
                              const stageResult = player.stages.find(s => s.stage_number === stage.stage_number);
                              const position = stageResult?.final_position;
                              const points = stageResult?.points_earned;
                              
                              return (
                                <td key={stage.id} className="px-0.5 sm:px-1 md:px-4 py-1 sm:py-2 md:py-4 text-center">
                                  {position ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                      <div className={`inline-flex items-center justify-center w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-8 md:h-8 rounded-full text-[9px] sm:text-xs font-bold ${getPositionColor(position)}`}>
                                        {position}
                                      </div>
                                      <div className="text-[8px] sm:text-[10px] md:text-xs text-sac-yellow whitespace-nowrap">
                                        {points}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500 text-[9px] sm:text-xs">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Classificação Geral */}
          <div className="bg-white/5 backdrop-blur-xl rounded-lg md:rounded-2xl border border-sac-gold/30 shadow-2xl overflow-hidden pdf-page-break">
            <div className="p-3 sm:p-4 md:p-6 border-b border-sac-gold/30">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-sac-gold" />
                Classificação Geral
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-full">
                <thead className="bg-sac-gold/20 backdrop-blur-sm">
                  <tr>
                    <th className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 md:py-5 text-left text-base sm:text-lg md:text-xl font-medium text-sac-yellow uppercase tracking-wider">
                      Pos.
                    </th>
                    <th className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 md:py-5 text-left text-base sm:text-lg md:text-xl font-medium text-sac-yellow uppercase tracking-wider">
                      Jogador
                    </th>
                    <th className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 md:py-5 text-center text-base sm:text-lg md:text-xl font-medium text-sac-yellow uppercase tracking-wider">
                      Pontos
                    </th>
                    <th className="hidden sm:table-cell px-2 sm:px-3 md:px-6 py-3 sm:py-4 md:py-5 text-center text-base sm:text-lg md:text-xl font-medium text-sac-yellow uppercase tracking-wider">
                      Etapas
                    </th>
                    <th className="hidden md:table-cell px-2 sm:px-3 md:px-6 py-3 sm:py-4 md:py-5 text-center text-base sm:text-lg md:text-xl font-medium text-sac-yellow uppercase tracking-wider">
                      Melhor
                    </th>
                    <th className="hidden md:table-cell px-2 sm:px-3 md:px-6 py-3 sm:py-4 md:py-5 text-center text-base sm:text-lg md:text-xl font-medium text-sac-yellow uppercase tracking-wider">
                      Pior
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sac-gold/20">
                  {displayRankings.map((player, index) => (
                    <tr 
                      key={player.player_id}
                      className={`hover:bg-sac-gold/10 transition-colors ${
                        index < 3 ? 'bg-sac-gold/5' : ''
                      }`}
                    >
                      <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 md:py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-full text-lg sm:text-xl md:text-2xl font-bold ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black' :
                            index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-black' :
                            index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-800 text-white' :
                            'bg-sac-gold/30 text-sac-yellow'
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 md:py-5">
                        <div className="text-lg sm:text-2xl md:text-3xl font-medium text-white">
                          {player.player_name}
                        </div>
                        {/* Mobile-only additional info */}
                        <div className="sm:hidden text-sm text-sac-yellow/70 space-x-2">
                          <span>{player.stages_played} etapas</span>
                          <span>•</span>
                          <span>Melhor: {player.best_position || '-'}</span>
                          <span>•</span>
                          <span>Pior: {player.worst_position || '-'}</span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-3 md:px-6 py-3 sm:py-4 md:py-5 text-center">
                        <span className="text-xl sm:text-3xl md:text-4xl font-bold text-sac-gold">
                          {player.total_points}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-2 sm:px-3 md:px-6 py-3 sm:py-4 md:py-5 text-center text-white text-lg md:text-2xl">
                        {player.stages_played}
                      </td>
                      <td className="hidden md:table-cell px-2 sm:px-3 md:px-6 py-3 sm:py-4 md:py-5 text-center">
                        {player.best_position ? (
                          <span className="bg-green-500/20 text-green-300 px-3 py-2 rounded-full text-base md:text-xl font-medium border border-green-500/30">
                            {player.best_position}º
                          </span>
                        ) : (
                          <span className="text-sac-gold text-lg md:text-xl">-</span>
                        )}
                      </td>
                      <td className="hidden md:table-cell px-2 sm:px-3 md:px-6 py-3 sm:py-4 md:py-5 text-center">
                        {player.worst_position ? (
                          <span className="bg-red-500/20 text-red-300 px-3 py-2 rounded-full text-base md:text-xl font-medium border border-red-500/30">
                            {player.worst_position}º
                          </span>
                        ) : (
                          <span className="text-sac-gold text-lg md:text-xl">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-xl border-t border-sac-gold/30 mt-6 sm:mt-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="text-center text-white/60 text-xs sm:text-sm leading-relaxed">
            © 2024 Circuito SAC Texas Hold'em<br className="sm:hidden" />
            <span className="hidden sm:inline"> - </span>Dados atualizados em tempo real
          </div>
        </div>
      </footer>
    </div>
  );
}
