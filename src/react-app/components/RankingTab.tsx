import { useState, useEffect } from 'react';
import { BarChart3, Trophy, Medal, Award, Download, Copy, Check, TrendingUp, Filter } from 'lucide-react';
import { Tournament, PlayerRanking } from '@/shared/types';
import { useApi } from '@/react-app/hooks/useApi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RankingTabProps {
  tournament: Tournament;
  onTournamentChange: (tournament: Tournament) => void;
}

interface StageScore {
  stage_number: number;
  final_position: number | null;
  points_earned: number | null;
}

interface PlayerStageScores {
  player_id: number;
  player_name: string;
  stages: StageScore[];
}

interface StageScoresData {
  stages: { id: number; stage_number: number; name: string }[];
  players: PlayerStageScores[];
}

export default function RankingTab({ tournament, onTournamentChange }: RankingTabProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [rankings, setRankings] = useState<PlayerRanking[]>([]);
  const [stageScores, setStageScores] = useState<StageScoresData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showTournamentSelector, setShowTournamentSelector] = useState(false);
  const { apiCall } = useApi();

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    loadData();
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [rankingResponse, scoresResponse] = await Promise.all([
        apiCall(`/api/tournaments/${tournament.id}/ranking`),
        apiCall(`/api/tournaments/${tournament.id}/stage-scores`)
      ]);
      
      if (rankingResponse.success) {
        setRankings(rankingResponse.data || []);
      }
      
      if (scoresResponse.success) {
        setStageScores(scoresResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ranking - ${tournament.name}`, 14, 20);
    
    // Overall ranking table
    doc.setFontSize(14);
    doc.text('Classificação Geral', 14, 35);
    
    // Auto-filter to only include players with points
    const displayRankingsForPDF = rankings.filter(r => r.total_points > 0);
    
    autoTable(doc, {
      startY: 40,
      head: [['Pos.', 'Jogador', 'Pontos', 'Etapas', 'Melhor', 'Pior', 'PIX']],
      body: displayRankingsForPDF.map((player, index) => [
        index + 1,
        player.player_name,
        player.total_points,
        player.stages_played,
        player.best_position || '-',
        player.worst_position || '-',
        player.pix_key
      ]),
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55] },
      styles: { fontSize: 8 }
    });
    
    // Stage-by-stage scores
    if (stageScores && stageScores.stages.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY || 40;
      
      doc.setFontSize(14);
      doc.text('Pontuação por Etapa', 14, finalY + 15);
      
      // Create ranking map
      const rankingMap = new Map(rankings.map((r, i) => [r.player_id, i + 1]));
      
      // Sort players by ranking
      const sortedPlayers = [...stageScores.players].sort((a, b) => {
        const rankA = rankingMap.get(a.player_id) || 999;
        const rankB = rankingMap.get(b.player_id) || 999;
        return rankA - rankB;
      });
      
      const headers = ['Pos.', 'Jogador', ...stageScores.stages.map(s => `E${s.stage_number}`), 'Média'];
      const body = sortedPlayers.map(player => {
        const ranking = rankingMap.get(player.player_id) || '-';
        const playerRanking = rankings.find(r => r.player_id === player.player_id);
        const avgPoints = playerRanking?.average_points || 0;
        return [
          ranking,
          player.player_name,
          ...player.stages.map(stage => stage.points_earned || '-'),
          avgPoints.toFixed(1)
        ];
      });
      
      autoTable(doc, {
        startY: finalY + 20,
        head: [headers],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [212, 175, 55] },
        styles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 35 }
        }
      });
    }
    
    // Save PDF
    doc.save(`ranking_${tournament.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
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

  const getRankingIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-sac-yellow" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-400" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-sac-gold font-bold">{position}</div>;
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

  const getPositionColor = (position: number | null) => {
    if (!position) return '';
    switch (position) {
      case 1:
        return 'bg-gradient-to-br from-sac-yellow to-sac-gold text-black font-bold';
      case 2:
        return 'bg-gradient-to-br from-gray-300 to-gray-400 text-black font-bold';
      case 3:
        return 'bg-gradient-to-br from-orange-400 to-orange-500 text-white font-bold';
      default:
        return 'bg-white/10 text-white';
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!stageScores || stageScores.stages.length === 0) return [];
    
    return stageScores.stages.map(stage => {
      const dataPoint: any = { stage: `E${stage.stage_number}` };
      
      // Add top 5 players' points for this stage
      const topPlayers = rankings.slice(0, 5);
      topPlayers.forEach(player => {
        const playerData = stageScores.players.find(p => p.player_id === player.player_id);
        if (playerData) {
          const stageData = playerData.stages.find(s => s.stage_number === stage.stage_number);
          dataPoint[player.player_name] = stageData?.points_earned || 0;
        }
      });
      
      return dataPoint;
    });
  };

  const chartData = prepareChartData();
  const topPlayers = rankings.slice(0, 5);
  const colors = ['#D4AF37', '#C0C0C0', '#CD7F32', '#4ade80', '#60a5fa'];

  // Auto-filter rankings to hide players with zero points
  const displayRankings = rankings.filter(r => r.total_points > 0);

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white/10 rounded-xl"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-20 bg-white/10 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-sac-gold to-sac-yellow rounded-xl">
            <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-black" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Ranking Geral</h2>
            <p className="text-sm md:text-base text-sac-yellow truncate max-w-[200px] sm:max-w-none">{tournament.name}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button
            onClick={copyShareLink}
            className="flex items-center space-x-2 bg-white/10 text-white px-4 py-2 rounded-xl font-medium hover:bg-white/20 transition-all duration-200 border border-sac-gold/30 text-sm"
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Compartilhar'}</span>
          </button>
          
          {rankings.length > 0 && (
            <button
              onClick={exportToPDF}
              className="flex items-center space-x-2 bg-gradient-to-r from-sac-gold to-sac-yellow text-black px-4 py-2 rounded-xl font-medium hover:from-sac-yellow hover:to-sac-gold transition-all duration-200 shadow-lg hover:shadow-sac-gold/25 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Tournament Selector */}
      {tournaments.length > 1 && (
        <div className="mb-6">
          <button
            onClick={() => setShowTournamentSelector(!showTournamentSelector)}
            className="flex items-center space-x-3 w-full md:w-auto bg-white/10 backdrop-blur-sm border border-sac-gold/30 rounded-xl px-4 py-3 hover:bg-white/20 transition-all duration-200"
          >
            <Filter className="w-5 h-5 text-sac-gold" />
            <div className="text-left flex-1">
              <div className="text-xs text-sac-yellow">Torneio Selecionado</div>
              <div className="text-sm font-medium text-white truncate">{tournament.name}</div>
            </div>
          </button>
          
          {showTournamentSelector && (
            <div className="mt-3 space-y-2">
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
                      : 'bg-white/5 border border-white/10 text-sac-green hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{t.name}</div>
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white/5 backdrop-blur-sm border border-sac-gold/30 rounded-xl p-4 md:p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Trophy className="w-6 h-6 md:w-8 md:h-8 text-sac-yellow" />
            <div>
              <h3 className="text-base md:text-lg font-semibold text-white">Ouro</h3>
              <p className="text-xs md:text-sm text-sac-yellow">1º lugar atual</p>
            </div>
          </div>
          <div className="text-lg md:text-2xl font-bold text-white truncate">
            {rankings.length > 0 ? rankings[0].player_name : '-'}
          </div>
          <p className="text-xs md:text-sm text-sac-green">
            {rankings.length > 0 ? `${rankings[0].total_points} pontos` : 'Nenhum jogador'}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-sac-gold/30 rounded-xl p-4 md:p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Medal className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
            <div>
              <h3 className="text-base md:text-lg font-semibold text-white">Prata</h3>
              <p className="text-xs md:text-sm text-gray-300">2º lugar atual</p>
            </div>
          </div>
          <div className="text-lg md:text-2xl font-bold text-white truncate">
            {rankings.length > 1 ? rankings[1].player_name : '-'}
          </div>
          <p className="text-xs md:text-sm text-sac-green">
            {rankings.length > 1 ? `${rankings[1].total_points} pontos` : 'Nenhum jogador'}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-sac-gold/30 rounded-xl p-4 md:p-6">
          <div className="flex items-center space-x-3 mb-3">
            <Award className="w-6 h-6 md:w-8 md:h-8 text-orange-400" />
            <div>
              <h3 className="text-base md:text-lg font-semibold text-white">Bronze</h3>
              <p className="text-xs md:text-sm text-orange-300">3º lugar atual</p>
            </div>
          </div>
          <div className="text-lg md:text-2xl font-bold text-white truncate">
            {rankings.length > 2 ? rankings[2].player_name : '-'}
          </div>
          <p className="text-xs md:text-sm text-sac-green">
            {rankings.length > 2 ? `${rankings[2].total_points} pontos` : 'Nenhum jogador'}
          </p>
        </div>
      </div>

      {/* Ranking Table */}
      {displayRankings.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 md:w-16 md:h-16 text-sac-gold mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
            Nenhum jogador com pontuação
          </h3>
          <p className="text-sm md:text-base text-sac-green">
            Os resultados aparecerão aqui após as etapas serem concluídas
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white/5 backdrop-blur-sm border border-sac-gold/30 rounded-xl overflow-hidden mb-6 md:mb-8">
            <div className="p-4 md:p-6 border-b border-sac-gold/20">
              <h3 className="text-base md:text-lg font-semibold text-white">Classificação Geral</h3>
              <p className="text-sac-green text-xs md:text-sm mt-1">
                Ranking baseado na soma de pontos de todas as etapas (jogadores sem pontos ocultos automaticamente)
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sac-gold/20 bg-white/5">
                    <th className="text-left py-3 md:py-4 px-3 md:px-6 text-sac-yellow font-medium text-xs md:text-sm">Pos.</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-6 text-sac-yellow font-medium text-xs md:text-sm">Jogador</th>
                    <th className="text-right py-3 md:py-4 px-3 md:px-6 text-sac-yellow font-medium text-xs md:text-sm">Pontos</th>
                    <th className="text-center py-3 md:py-4 px-3 md:px-6 text-sac-yellow font-medium text-xs md:text-sm hidden sm:table-cell">Etapas</th>
                    <th className="text-center py-3 md:py-4 px-3 md:px-6 text-sac-yellow font-medium text-xs md:text-sm hidden md:table-cell">Melhor</th>
                    <th className="text-center py-3 md:py-4 px-3 md:px-6 text-sac-yellow font-medium text-xs md:text-sm hidden md:table-cell">Pior</th>
                    <th className="text-left py-3 md:py-4 px-3 md:px-6 text-sac-yellow font-medium text-xs md:text-sm hidden lg:table-cell">PIX</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRankings.map((player, index) => {
                    const position = index + 1;
                    const isTopThree = position <= 3;
                    
                    return (
                      <tr 
                        key={player.player_id} 
                        className={`border-b border-white/5 hover:bg-white/5 transition-all duration-200 ${
                          isTopThree ? 'bg-sac-gold/10' : ''
                        }`}
                      >
                        <td className="py-3 md:py-4 px-3 md:px-6">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-xs md:text-sm ${getRankingBadge(position)}`}>
                              {position <= 3 ? getRankingIcon(position) : position}
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-3 md:py-4 px-3 md:px-6">
                          <span className="text-white font-medium text-xs md:text-base">{player.player_name}</span>
                        </td>
                        
                        <td className="py-3 md:py-4 px-3 md:px-6 text-right">
                          <span className="text-lg md:text-2xl font-bold text-sac-yellow">{player.total_points}</span>
                        </td>
                        
                        <td className="py-3 md:py-4 px-3 md:px-6 text-center hidden sm:table-cell">
                          <span className="bg-sac-green/20 text-sac-green px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium border border-sac-green/30">
                            {player.stages_played}
                          </span>
                        </td>
                        
                        <td className="py-3 md:py-4 px-3 md:px-6 text-center hidden md:table-cell">
                          {player.best_position ? (
                            <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs md:text-sm font-medium border border-green-500/30">
                              {player.best_position}º
                            </span>
                          ) : (
                            <span className="text-sac-gold">-</span>
                          )}
                        </td>
                        
                        <td className="py-3 md:py-4 px-3 md:px-6 text-center hidden md:table-cell">
                          {player.worst_position ? (
                            <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs md:text-sm font-medium border border-red-500/30">
                              {player.worst_position}º
                            </span>
                          ) : (
                            <span className="text-sac-gold">-</span>
                          )}
                        </td>
                        
                        <td className="py-3 md:py-4 px-3 md:px-6 hidden lg:table-cell">
                          <span className="text-sac-green text-xs md:text-sm font-mono">
                            {player.pix_key.length > 15 ? `${player.pix_key.substring(0, 15)}...` : player.pix_key}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stage-by-stage scores */}
          {stageScores && stageScores.stages.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-sac-gold/30 rounded-xl overflow-hidden mb-6 md:mb-8">
              <div className="p-4 md:p-6 border-b border-sac-gold/20">
                <h3 className="text-base md:text-lg font-semibold text-white">Pontuação por Etapa</h3>
                <p className="text-sac-green text-xs md:text-sm mt-1">
                  Desempenho detalhado em cada etapa do torneio
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sac-gold/20 bg-white/5">
                      <th className="text-left py-3 md:py-4 px-3 md:px-4 text-sac-yellow font-medium text-xs sticky left-0 bg-white/5 z-10">Pos.</th>
                      <th className="text-left py-3 md:py-4 px-3 md:px-4 text-sac-yellow font-medium text-xs sticky left-8 md:left-12 bg-white/5 z-10 min-w-[120px] md:min-w-[150px]">Jogador</th>
                      {stageScores.stages.map(stage => (
                        <th key={stage.id} className="text-center py-3 md:py-4 px-2 md:px-3 text-sac-yellow font-medium text-xs whitespace-nowrap">
                          E{stage.stage_number}
                        </th>
                      ))}
                      <th className="text-center py-3 md:py-4 px-2 md:px-3 text-sac-yellow font-medium text-xs whitespace-nowrap bg-sac-gold/20">
                        Média
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stageScores.players
                      .map((player) => ({ 
                        ...player, 
                        ranking: rankings.findIndex(r => r.player_id === player.player_id) + 1 
                      }))
                      .filter(player => rankings.find(r => r.player_id === player.player_id && r.total_points > 0))
                      .sort((a, b) => a.ranking - b.ranking)
                      .map((player) => {
                        const playerRanking = rankings.find(r => r.player_id === player.player_id);
                        const avgPoints = playerRanking?.average_points || 0;
                        
                        return (
                          <tr 
                            key={player.player_id}
                            className="border-b border-white/5 hover:bg-white/5 transition-all duration-200"
                          >
                            <td className="py-3 md:py-4 px-3 md:px-4 text-white font-medium text-xs sticky left-0 bg-black/40 backdrop-blur-sm z-10">
                              {player.ranking}
                            </td>
                            <td className="py-3 md:py-4 px-3 md:px-4 text-white text-xs sticky left-8 md:left-12 bg-black/40 backdrop-blur-sm z-10">
                              {player.player_name}
                            </td>
                            {player.stages.map((stage, idx) => (
                              <td key={idx} className="py-3 md:py-4 px-2 md:px-3 text-center">
                                {stage.points_earned !== null ? (
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPositionColor(stage.final_position)}`}>
                                      {stage.final_position}º
                                    </span>
                                    <span className="text-sac-green text-xs font-bold">
                                      {stage.points_earned}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-600 text-xs">-</span>
                                )}
                              </td>
                            ))}
                            <td className="py-3 md:py-4 px-2 md:px-3 text-center bg-sac-gold/10">
                              <span className="text-sac-yellow font-bold text-sm">
                                {avgPoints.toFixed(1)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Performance Chart */}
          {chartData.length > 0 && topPlayers.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-sac-gold/30 rounded-xl overflow-hidden mb-6 md:mb-8">
              <div className="p-4 md:p-6 border-b border-sac-gold/20">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-sac-gold" />
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-white">Gráfico de Desempenho</h3>
                    <p className="text-sac-green text-xs md:text-sm mt-1">
                      Evolução dos pontos dos 5 primeiros colocados por etapa
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 md:p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D4AF37" opacity={0.1} />
                    <XAxis 
                      dataKey="stage" 
                      stroke="#D4AF37" 
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#D4AF37" 
                      style={{ fontSize: '12px' }}
                      label={{ value: 'Pontos', angle: -90, position: 'insideLeft', fill: '#D4AF37' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                        border: '1px solid #D4AF37',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#D4AF37' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      iconType="line"
                    />
                    {topPlayers.map((player, idx) => (
                      <Line
                        key={player.player_id}
                        type="monotone"
                        dataKey={player.player_name}
                        stroke={colors[idx]}
                        strokeWidth={2}
                        dot={{ fill: colors[idx], r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Podium for Top 3 */}
          {rankings.length >= 3 && (
            <div className="bg-white/5 backdrop-blur-sm border border-sac-gold/30 rounded-xl p-6 md:p-8">
              <h3 className="text-base md:text-lg font-semibold text-white mb-6 text-center">🏆 Pódio</h3>
              
              <div className="flex items-end justify-center space-x-4 md:space-x-8">
                {/* 2nd Place */}
                <div className="text-center">
                  <div className="w-16 h-24 md:w-24 md:h-32 bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-lg flex items-end justify-center pb-3 md:pb-4 mb-4">
                    <span className="text-white font-bold text-base md:text-lg">2º</span>
                  </div>
                  <div className="space-y-2">
                    <Medal className="w-6 h-6 md:w-8 md:h-8 text-gray-400 mx-auto" />
                    <h4 className="text-white font-semibold text-xs md:text-base truncate max-w-[80px] md:max-w-none">{rankings[1].player_name}</h4>
                    <p className="text-gray-300 text-sm md:text-lg font-bold">{rankings[1].total_points} pts</p>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="text-center">
                  <div className="w-16 h-32 md:w-24 md:h-40 bg-gradient-to-t from-sac-gold to-sac-yellow rounded-t-lg flex items-end justify-center pb-3 md:pb-4 mb-4">
                    <span className="text-black font-bold text-lg md:text-xl">1º</span>
                  </div>
                  <div className="space-y-2">
                    <Trophy className="w-8 h-8 md:w-10 md:h-10 text-sac-yellow mx-auto" />
                    <h4 className="text-white font-semibold text-sm md:text-lg truncate max-w-[80px] md:max-w-none">{rankings[0].player_name}</h4>
                    <p className="text-sac-yellow text-base md:text-xl font-bold">{rankings[0].total_points} pts</p>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="text-center">
                  <div className="w-16 h-20 md:w-24 md:h-28 bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg flex items-end justify-center pb-3 md:pb-4 mb-4">
                    <span className="text-white font-bold text-base md:text-lg">3º</span>
                  </div>
                  <div className="space-y-2">
                    <Award className="w-6 h-6 md:w-8 md:h-8 text-orange-400 mx-auto" />
                    <h4 className="text-white font-semibold text-xs md:text-base truncate max-w-[80px] md:max-w-none">{rankings[2].player_name}</h4>
                    <p className="text-orange-300 text-sm md:text-lg font-bold">{rankings[2].total_points} pts</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
