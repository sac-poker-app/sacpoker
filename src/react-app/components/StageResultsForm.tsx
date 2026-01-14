import { useState, useEffect } from 'react';
import { X, Trophy, Users, Plus, Trash2, Save, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { Stage, Player, CreateStageResult, StageResultWithPlayer } from '@/shared/types';
import { useApi } from '@/react-app/hooks/useApi';

interface StageResultsFormProps {
  stage: Stage;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing?: boolean;
}

interface ResultEntry {
  player_id: number;
  final_position: number;
  player_name?: string;
}

export default function StageResultsForm({ stage, onSubmit, onCancel, isEditing = false }: StageResultsFormProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { apiCall } = useApi();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const playersResponse = await apiCall('/api/players');
      if (playersResponse.success) {
        setPlayers(playersResponse.data || []);
      }
      
      if (isEditing) {
        const resultsResponse = await apiCall(`/api/stages/${stage.id}/results`);
        if (resultsResponse.success && resultsResponse.data) {
          const existingResults: StageResultWithPlayer[] = resultsResponse.data;
          setResults(existingResults.map(r => ({
            player_id: r.player_id,
            final_position: r.final_position,
            player_name: r.player_name
          })));
        }
      } else {
        if (playersResponse.data && playersResponse.data.length > 0) {
          setResults([{ player_id: playersResponse.data[0].id, final_position: 1 }]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addResult = () => {
    const nextPosition = results.length + 1;
    const availablePlayers = players.filter(p => !results.some(r => r.player_id === p.id));
    
    if (availablePlayers.length > 0) {
      setResults([...results, { 
        player_id: availablePlayers[0].id, 
        final_position: nextPosition 
      }]);
    }
  };

  const removeResult = (index: number) => {
    const newResults = results.filter((_, i) => i !== index);
    const reorderedResults = newResults.map((result, i) => ({
      ...result,
      final_position: i + 1
    }));
    setResults(reorderedResults);
  };

  const updateResult = (index: number, field: keyof ResultEntry, value: number) => {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], [field]: value };
    setResults(newResults);
    setErrors([]);
  };

  const moveResult = (index: number, direction: 'up' | 'down') => {
    const newResults = [...results];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newResults.length) {
      [newResults[index], newResults[targetIndex]] = [newResults[targetIndex], newResults[index]];
      newResults[index].final_position = index + 1;
      newResults[targetIndex].final_position = targetIndex + 1;
      setResults(newResults);
    }
  };

  const validateResults = (): boolean => {
    const validationErrors: string[] = [];

    if (results.length === 0) {
      validationErrors.push('Adicione pelo menos um resultado');
      setErrors(validationErrors);
      return false;
    }

    const playerIds = results.map(r => r.player_id);
    const uniquePlayerIds = new Set(playerIds);
    if (playerIds.length !== uniquePlayerIds.size) {
      validationErrors.push('Jogador não pode aparecer mais de uma vez');
    }

    const positions = results.map(r => r.final_position);
    const uniquePositions = new Set(positions);
    if (positions.length !== uniquePositions.size) {
      validationErrors.push('Posições duplicadas não são permitidas');
    }

    const sortedPositions = [...positions].sort((a, b) => a - b);
    for (let i = 0; i < sortedPositions.length; i++) {
      if (sortedPositions[i] !== i + 1) {
        validationErrors.push('Posições devem ser consecutivas começando do 1º lugar');
        break;
      }
    }

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateResults()) return;

    try {
      setSubmitting(true);
      
      const submitData: CreateStageResult[] = results.map(result => ({
        player_id: result.player_id,
        final_position: result.final_position,
      }));

      const response = await apiCall(`/api/stages/${stage.id}/results`, 'POST', submitData);
      
      if (response.success) {
        alert(isEditing ? 'Resultados atualizados com sucesso!' : 'Resultados salvos com sucesso!');
        onSubmit();
      } else {
        alert(response.error || 'Erro ao salvar resultados');
      }
    } catch (error) {
      console.error('Error saving results:', error);
      alert('Erro ao salvar resultados');
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailablePlayers = (currentPlayerId: number) => {
    return players.filter(p => 
      p.id === currentPlayerId || !results.some(r => r.player_id === p.id)
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="animate-pulse space-y-4 w-full max-w-2xl">
          <div className="h-8 bg-white/10 rounded-lg w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/10 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-4 md:p-6 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={`p-2 rounded-xl flex-shrink-0 ${
              stage.is_final_stage 
                ? 'bg-gradient-to-br from-yellow-500 to-orange-600' 
                : 'bg-gradient-to-br from-blue-500 to-cyan-600'
            }`}>
              <Trophy className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg md:text-xl font-bold text-white truncate">{stage.name}</h3>
              <p className="text-xs md:text-sm text-purple-300 truncate">
                {isEditing ? 'Editar resultados' : 'Lançar resultados'}
              </p>
              {stage.is_final_stage && (
                <p className="text-yellow-300 text-xs md:text-sm font-medium">⭐ Etapa Final</p>
              )}
            </div>
          </div>
          
          <button
            onClick={onCancel}
            className="p-2 text-purple-400 hover:text-purple-300 hover:bg-white/10 rounded-lg transition-all duration-200 flex-shrink-0"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 md:p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
              <h4 className="text-red-300 font-medium text-sm md:text-base">Erros de Validação</h4>
            </div>
            <ul className="text-red-300 text-xs md:text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 md:p-4 mb-4">
          <p className="text-blue-300 text-xs md:text-sm">
            <strong>📝 Instruções:</strong> Adicione os jogadores na ordem de classificação final. 
            {stage.is_final_stage && (
              <span className="block mt-1">
                <strong>⭐ Etapa Final:</strong> Pontuação especial com valores maiores!
              </span>
            )}
          </p>
        </div>

        {/* Results List */}
        <div className="space-y-4 mb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base md:text-lg font-semibold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 md:w-5 md:h-5" />
              <span>Resultados ({results.length})</span>
            </h4>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 md:w-12 md:h-12 text-purple-400 mx-auto mb-3" />
              <p className="text-purple-300 text-sm md:text-base mb-4">Nenhum resultado adicionado</p>
            </div>
          ) : (
            <div className="space-y-2 md:space-y-3">
              {results
                .sort((a, b) => a.final_position - b.final_position)
                .map((result, index) => {
                  const availablePlayers = getAvailablePlayers(result.player_id);
                  const selectedPlayer = players.find(p => p.id === result.player_id);
                  
                  return (
                    <div
                      key={index}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 md:p-4"
                    >
                      <div className="flex items-center gap-2 md:gap-4">
                        {/* Position */}
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-sm md:text-lg font-bold ${
                            result.final_position === 1 
                              ? 'bg-yellow-500/20 text-yellow-300 border-2 border-yellow-500/50'
                              : result.final_position === 2
                              ? 'bg-gray-500/20 text-gray-300 border-2 border-gray-500/50'
                              : result.final_position === 3
                              ? 'bg-orange-500/20 text-orange-300 border-2 border-orange-500/50'
                              : 'bg-white/10 text-white border-2 border-white/20'
                          }`}>
                            {result.final_position}º
                          </div>
                        </div>

                        {/* Player Selection */}
                        <div className="flex-1 min-w-0">
                          <select
                            value={result.player_id}
                            onChange={(e) => updateResult(index, 'player_id', parseInt(e.target.value))}
                            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 md:px-4 py-2 md:py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                          >
                            {availablePlayers.map(player => (
                              <option key={player.id} value={player.id} className="bg-gray-800">
                                {player.full_name}
                              </option>
                            ))}
                          </select>
                          {selectedPlayer && (
                            <p className="text-xs md:text-sm text-purple-300 mt-1 truncate">
                              PIX: {selectedPlayer.pix_key}
                            </p>
                          )}
                        </div>

                        {/* Move Buttons */}
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            onClick={() => moveResult(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mover para cima"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveResult(index, 'down')}
                            disabled={index === results.length - 1}
                            className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Mover para baixo"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeResult(index)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200 flex-shrink-0"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
          
          {/* Add Button - Below results */}
          <button
            onClick={addResult}
            disabled={results.length >= players.length}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm md:text-base"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span>Adicionar Participante</span>
          </button>
        </div>
      </div>

      {/* Actions - Fixed Bottom */}
      <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:space-x-4 p-4 md:p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl">
        <button
          onClick={onCancel}
          className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-3 text-purple-300 hover:text-white hover:bg-white/10 rounded-xl font-medium transition-all duration-200 text-sm md:text-base"
        >
          Cancelar
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={submitting || results.length === 0}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base shadow-lg"
        >
          <Save className="w-4 h-4 md:w-5 md:h-5" />
          <span>{submitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}</span>
        </button>
      </div>
    </div>
  );
}
