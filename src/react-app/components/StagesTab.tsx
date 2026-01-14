import { useState, useEffect } from 'react';
import { Target, Calendar, Users, Trophy, Award, CheckCircle, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { Tournament, Stage, StageResultWithPlayer } from '@/shared/types';
import { useApi } from '@/react-app/hooks/useApi';
import StageResultsForm from './StageResultsForm';

interface StagesTabProps {
  tournament: Tournament;
}

export default function StagesTab({ tournament }: StagesTabProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [stageResults, setStageResults] = useState<StageResultWithPlayer[]>([]);
  const [showResultsForm, setShowResultsForm] = useState(false);
  const [showStagesList, setShowStagesList] = useState(true);
  const [loading, setLoading] = useState(true);
  const { apiCall } = useApi();

  useEffect(() => {
    loadStages();
  }, [tournament.id]);

  useEffect(() => {
    if (selectedStage) {
      loadStageResults(selectedStage.id);
      // On mobile, hide stages list when stage is selected
      if (window.innerWidth < 768) {
        setShowStagesList(false);
      }
    }
  }, [selectedStage]);

  const loadStages = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/tournaments/${tournament.id}/stages`);
      if (response.success) {
        setStages(response.data || []);
        // Auto-select first incomplete stage
        const firstIncomplete = response.data?.find((stage: Stage) => !stage.is_completed);
        if (firstIncomplete) {
          setSelectedStage(firstIncomplete);
        } else if (response.data?.length > 0) {
          setSelectedStage(response.data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading stages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStageResults = async (stageId: number) => {
    try {
      const response = await apiCall(`/api/stages/${stageId}/results`);
      if (response.success) {
        setStageResults(response.data || []);
      }
    } catch (error) {
      console.error('Error loading stage results:', error);
    }
  };

  const handleStageSelect = (stage: Stage) => {
    setSelectedStage(stage);
    setShowResultsForm(false);
    if (window.innerWidth < 768) {
      setShowStagesList(false);
    }
  };

  const handleResultsSubmitted = () => {
    setShowResultsForm(false);
    loadStages();
    if (selectedStage) {
      loadStageResults(selectedStage.id);
    }
  };

  const handleDeleteResults = async () => {
    if (!selectedStage) return;
    
    if (!confirm(`Tem certeza que deseja excluir todos os resultados da ${selectedStage.name}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    try {
      const response = await apiCall(`/api/stages/${selectedStage.id}/results`, 'DELETE');
      if (response.success) {
        alert('Resultados excluídos com sucesso!');
        loadStages();
        if (selectedStage) {
          loadStageResults(selectedStage.id);
        }
      } else {
        alert(response.error || 'Erro ao excluir resultados');
      }
    } catch (error) {
      console.error('Error deleting results:', error);
      alert('Erro ao excluir resultados');
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-white/10 rounded-lg"></div>
              ))}
            </div>
            <div className="md:col-span-2 h-96 bg-white/10 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
            <Target className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Etapas</h2>
            <p className="text-sm md:text-base text-purple-300 line-clamp-1">{tournament.name}</p>
          </div>
        </div>
        
        {selectedStage && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowStagesList(true)}
              className="md:hidden flex items-center space-x-2 bg-white/10 text-white px-4 py-2 rounded-xl font-medium hover:bg-white/20 transition-all duration-200 text-sm"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>Etapas</span>
            </button>
            {selectedStage.is_completed && (
              <button
                onClick={handleDeleteResults}
                className="flex items-center space-x-2 bg-red-500/20 text-red-300 px-4 py-2 rounded-xl font-medium hover:bg-red-500/30 transition-all duration-200 border border-red-500/30 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Excluir Resultados</span>
              </button>
            )}
            <button
              onClick={() => setShowResultsForm(true)}
              className="flex-1 md:flex-initial flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-green-500/25 text-sm md:text-base"
            >
              <Trophy className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">{selectedStage.is_completed ? 'Editar Resultados' : 'Lançar Resultados'}</span>
              <span className="sm:hidden">Resultados</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Stages List */}
        <div className={`space-y-3 ${showStagesList ? 'block' : 'hidden md:block'}`}>
          <h3 className="text-base md:text-lg font-semibold text-white mb-4">Etapas do Torneio</h3>
          
          {stages.map((stage) => {
            const isSelected = selectedStage?.id === stage.id;
            const isCompleted = stage.is_completed;
            const isFinal = stage.is_final_stage;
            
            return (
              <button
                key={stage.id}
                onClick={() => handleStageSelect(stage)}
                className={`w-full text-left p-3 md:p-4 rounded-xl transition-all duration-200 border ${
                  isSelected 
                    ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/25' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                    <div className={`p-1.5 md:p-2 rounded-lg flex-shrink-0 ${
                      isFinal 
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-600' 
                        : isCompleted
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                        : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                    }`}>
                      {isFinal ? (
                        <Award className="w-3 h-3 md:w-4 md:h-4 text-white" />
                      ) : isCompleted ? (
                        <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                      ) : (
                        <Clock className="w-3 h-3 md:w-4 md:h-4 text-white" />
                      )}
                    </div>
                    <span className="font-medium text-white text-sm md:text-base truncate">{stage.name}</span>
                  </div>
                  
                  {isFinal && (
                    <span className="bg-yellow-500/20 text-yellow-300 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-xs font-medium border border-yellow-500/30 flex-shrink-0">
                      FINAL
                    </span>
                  )}
                </div>
                
                <div className="text-xs md:text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={isCompleted ? 'text-green-300' : 'text-purple-300'}>
                      {isCompleted ? 'Concluída' : 'Pendente'}
                    </span>
                    {isCompleted && (
                      <span className="text-purple-300">
                        {stage.total_participants} part.
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Stage Details */}
        <div className={`md:col-span-2 ${!showStagesList ? 'block' : 'hidden md:block'}`}>
          {selectedStage ? (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 md:mb-6 gap-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`p-2 md:p-3 rounded-xl flex-shrink-0 ${
                    selectedStage.is_final_stage 
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-600' 
                      : selectedStage.is_completed
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                  }`}>
                    {selectedStage.is_final_stage ? (
                      <Award className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    ) : selectedStage.is_completed ? (
                      <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    ) : (
                      <Target className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg md:text-xl font-bold text-white truncate">{selectedStage.name}</h3>
                    {selectedStage.is_final_stage && (
                      <p className="text-yellow-300 font-medium text-xs md:text-sm truncate">⭐ Etapa Final</p>
                    )}
                  </div>
                </div>
                
                <div className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium border flex-shrink-0 ${
                  selectedStage.is_completed 
                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                    : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                }`}>
                  {selectedStage.is_completed ? 'Concluída' : 'Pendente'}
                </div>
              </div>

              {/* Stage Stats */}
              {selectedStage.is_completed && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="bg-white/5 rounded-lg p-3 md:p-4 text-center">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-lg md:text-2xl font-bold text-white">{selectedStage.total_participants}</div>
                    <div className="text-xs md:text-sm text-purple-300">Participantes</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-3 md:p-4 text-center col-span-2 md:col-span-1">
                    <Trophy className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 mx-auto mb-2" />
                    <div className="text-base md:text-2xl font-bold text-white truncate">
                      {stageResults.find(r => r.final_position === 1)?.player_name || '-'}
                    </div>
                    <div className="text-xs md:text-sm text-purple-300">Campeão</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-3 md:p-4 text-center col-span-2 md:col-span-1">
                    <Calendar className="w-5 h-5 md:w-6 md:h-6 text-green-400 mx-auto mb-2" />
                    <div className="text-base md:text-2xl font-bold text-white">
                      {new Date(selectedStage.updated_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs md:text-sm text-purple-300">Finalizada</div>
                  </div>
                </div>
              )}

              {/* Results Table */}
              {selectedStage.is_completed && stageResults.length > 0 ? (
                <div>
                  <h4 className="text-base md:text-lg font-semibold text-white mb-4">Resultados</h4>
                  <div className="overflow-x-auto -mx-4 md:mx-0">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-2 md:py-3 px-4 text-purple-300 font-medium text-xs md:text-sm">Pos.</th>
                          <th className="text-left py-2 md:py-3 px-4 text-purple-300 font-medium text-xs md:text-sm">Jogador</th>
                          <th className="text-right py-2 md:py-3 px-4 text-purple-300 font-medium text-xs md:text-sm">Pontos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stageResults
                          .sort((a, b) => a.final_position - b.final_position)
                          .map((result) => (
                            <tr key={result.id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="py-2 md:py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <span className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold ${
                                    result.final_position === 1 
                                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                      : result.final_position === 2
                                      ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                                      : result.final_position === 3
                                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                      : 'bg-white/10 text-white'
                                  }`}>
                                    {result.final_position}º
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 md:py-3 px-4">
                                <span className="text-white font-medium text-xs md:text-base truncate block max-w-[150px] md:max-w-none">{result.player_name}</span>
                              </td>
                              <td className="py-2 md:py-3 px-4 text-right">
                                <span className="text-green-300 font-bold text-xs md:text-base">{result.points_earned}</span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : !selectedStage.is_completed ? (
                <div className="text-center py-8 md:py-12">
                  <Target className="w-12 h-12 md:w-16 md:h-16 text-blue-400 mx-auto mb-4" />
                  <h4 className="text-lg md:text-xl font-semibold text-white mb-2">Etapa Pendente</h4>
                  <p className="text-sm md:text-base text-purple-300 mb-6 px-4">
                    Esta etapa ainda não foi realizada. Clique em "Lançar Resultados" para registrar os posicionamentos.
                  </p>
                  {selectedStage.is_final_stage && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 mx-4">
                      <p className="text-yellow-300 text-xs md:text-sm">
                        <strong>⭐ Etapa Final:</strong> Esta etapa possui pontuação especial com valores maiores!
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => setShowResultsForm(true)}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 text-sm md:text-base"
                  >
                    Lançar Resultados
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 md:py-12">
                  <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-green-400 mx-auto mb-4" />
                  <h4 className="text-lg md:text-xl font-semibold text-white mb-2">Etapa Concluída</h4>
                  <p className="text-sm md:text-base text-purple-300">Nenhum resultado registrado.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 md:p-8 text-center">
              <Target className="w-12 h-12 md:w-16 md:h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Selecione uma Etapa</h3>
              <p className="text-sm md:text-base text-purple-300">Escolha uma etapa na lista ao lado para visualizar detalhes e gerenciar resultados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Stage Results Form Modal */}
      {showResultsForm && selectedStage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-0 md:pt-[5vh]">
          <div className="bg-white/10 backdrop-blur-xl border-0 md:border border-white/20 md:rounded-2xl w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] overflow-hidden">
            <StageResultsForm
              stage={selectedStage}
              onSubmit={handleResultsSubmitted}
              onCancel={() => setShowResultsForm(false)}
              isEditing={selectedStage.is_completed}
            />
          </div>
        </div>
      )}
    </div>
  );
}
