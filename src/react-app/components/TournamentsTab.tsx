import { useState, useEffect } from 'react';
import { Plus, Trophy, Calendar, FileText, Play, Filter, Edit2, Trash2, X } from 'lucide-react';
import { Tournament, CreateTournament, UpdateTournament } from '@/shared/types';
import { useApi } from '@/react-app/hooks/useApi';
import TournamentForm from './TournamentForm';

interface TournamentsTabProps {
  onTournamentSelect: (tournament: Tournament) => void;
}

export default function TournamentsTab({ onTournamentSelect }: TournamentsTabProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const { apiCall } = useApi();

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/tournaments');
      if (response.success) {
        setTournaments(response.data || []);
      }
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (data: CreateTournament) => {
    try {
      const response = await apiCall('/api/tournaments', 'POST', data);
      if (response.success) {
        setTournaments([response.data, ...tournaments]);
        setShowForm(false);
        alert('Torneio criado com sucesso! 12 etapas foram criadas automaticamente.');
      } else {
        alert(response.error || 'Erro ao criar torneio');
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      alert('Erro ao criar torneio');
    }
  };

  const handleUpdateTournament = async (data: UpdateTournament) => {
    if (!editingTournament) return;
    
    try {
      const response = await apiCall(`/api/tournaments/${editingTournament.id}`, 'PUT', data);
      if (response.success) {
        setTournaments(tournaments.map(t => t.id === editingTournament.id ? response.data : t));
        setEditingTournament(null);
        setShowForm(false);
        alert('Torneio atualizado com sucesso!');
      } else {
        alert(response.error || 'Erro ao atualizar torneio');
      }
    } catch (error) {
      console.error('Error updating tournament:', error);
      alert('Erro ao atualizar torneio');
    }
  };

  const handleDeleteTournament = async (tournament: Tournament, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Tem certeza que deseja excluir o torneio "${tournament.name}"? Esta ação não pode ser desfeita e todos os dados das etapas e resultados serão perdidos.`)) {
      return;
    }
    
    try {
      const response = await apiCall(`/api/tournaments/${tournament.id}`, 'DELETE');
      if (response.success) {
        setTournaments(tournaments.filter(t => t.id !== tournament.id));
        alert('Torneio excluído com sucesso!');
      } else {
        alert(response.error || 'Erro ao excluir torneio');
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert('Erro ao excluir torneio');
    }
  };

  const handleEditTournament = (tournament: Tournament, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTournament(tournament);
    setShowForm(true);
  };

  // Get unique years from tournaments
  const availableYears = Array.from(new Set(
    tournaments
      .map(t => t.year)
      .filter((year): year is number => year !== null && year !== undefined)
  )).sort((a, b) => b - a);

  // Filter tournaments by selected year
  const filteredTournaments = selectedYear === 'all'
    ? tournaments
    : tournaments.filter(t => t.year === selectedYear);

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded-lg w-1/3"></div>
          <div className="h-12 bg-white/10 rounded-lg"></div>
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-white/10 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-sac-gold to-sac-yellow rounded-xl">
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-black" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Torneios</h2>
            <p className="text-sm md:text-base text-sac-yellow">Gerencie os torneios de poker</p>
          </div>
        </div>
        
        <button
          onClick={() => {
            setEditingTournament(null);
            setShowForm(true);
          }}
          className="w-full md:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-sac-gold to-sac-yellow text-black px-4 md:px-6 py-3 rounded-xl font-medium hover:from-sac-yellow hover:to-sac-gold transition-all duration-200 shadow-lg hover:shadow-sac-gold/25 text-sm md:text-base"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span>Novo Torneio</span>
        </button>
      </div>

      {/* Year Filter */}
      {availableYears.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-sac-gold" />
            <label className="text-sm font-medium text-sac-yellow">Filtrar por ano:</label>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setSelectedYear('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                selectedYear === 'all'
                  ? 'bg-gradient-to-r from-sac-gold to-sac-yellow text-black'
                  : 'bg-white/10 text-sac-yellow hover:bg-white/20'
              }`}
            >
              Todos
            </button>
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                  selectedYear === year
                    ? 'bg-gradient-to-r from-sac-gold to-sac-yellow text-black'
                    : 'bg-white/10 text-sac-yellow hover:bg-white/20'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tournaments Grid */}
      {filteredTournaments.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 md:w-16 md:h-16 text-sac-gold mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
            {selectedYear === 'all' 
              ? 'Nenhum torneio cadastrado' 
              : `Nenhum torneio encontrado para ${selectedYear}`
            }
          </h3>
          <p className="text-sm md:text-base text-sac-yellow mb-6">
            {selectedYear === 'all'
              ? 'Comece criando seu primeiro torneio'
              : 'Tente selecionar outro ano ou crie um novo torneio'
            }
          </p>
          <button
            onClick={() => {
              setEditingTournament(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-sac-gold to-sac-yellow text-black px-6 py-3 rounded-xl font-medium hover:from-sac-yellow hover:to-sac-gold transition-all duration-200"
          >
            Criar Novo Torneio
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-white/5 backdrop-blur-sm border border-sac-gold/30 rounded-xl p-4 md:p-6 hover:bg-sac-gold/10 transition-all duration-200 group cursor-pointer"
              onClick={() => onTournamentSelect(tournament)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 md:p-3 bg-gradient-to-br from-sac-gold to-sac-yellow rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Trophy className="w-5 h-5 md:w-6 md:h-6 text-black" />
                </div>
                <div className="flex items-center space-x-2">
                  {tournament.year && (
                    <span className="bg-sac-gold/30 text-sac-yellow px-3 py-1 rounded-full text-xs font-medium border border-sac-gold/50">
                      {tournament.year}
                    </span>
                  )}
                  <button
                    onClick={(e) => handleEditTournament(tournament, e)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteTournament(tournament, e)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                  <button className="p-2 text-sac-green hover:text-sac-yellow hover:bg-sac-green/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100">
                    <Play className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-base md:text-lg font-semibold text-white mb-2 group-hover:text-sac-yellow transition-colors duration-200 line-clamp-2">
                {tournament.name}
              </h3>
              
              {tournament.description && (
                <p className="text-sac-green text-xs md:text-sm mb-4 line-clamp-2">
                  {tournament.description}
                </p>
              )}
              
              <div className="space-y-2 text-xs md:text-sm">
                {tournament.start_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 text-green-400 flex-shrink-0" />
                    <span className="text-green-300 truncate">
                      Início: {tournament.start_date.split('T')[0].split('-').reverse().join('/')}
                    </span>
                  </div>
                )}
                
                {tournament.end_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 text-red-400 flex-shrink-0" />
                    <span className="text-red-300 truncate">
                      Fim: {tournament.end_date.split('T')[0].split('-').reverse().join('/')}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <FileText className="w-3 h-3 md:w-4 md:h-4 text-sac-gold flex-shrink-0" />
                  <span className="text-sac-yellow">12 etapas configuradas</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-sac-gold/20">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-sac-green">
                    Criado em {new Date(tournament.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs font-medium border border-green-500/30">
                    Ativo
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tournament Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white/10 backdrop-blur-xl border border-sac-gold/30 rounded-2xl p-6 md:p-8 w-full max-w-md my-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white/10 backdrop-blur-xl -mx-6 md:-mx-8 px-6 md:px-8 py-4 border-b border-sac-gold/30 rounded-t-2xl z-10">
              <h3 className="text-xl font-bold text-white">
                {editingTournament ? 'Editar Torneio' : 'Novo Torneio'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingTournament(null);
                }}
                className="p-2 text-sac-yellow hover:text-sac-gold hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-sac-gold/50 scrollbar-track-white/10">
              <TournamentForm
                tournament={editingTournament}
                onSubmit={(data) => {
                  if (editingTournament) {
                    handleUpdateTournament(data as UpdateTournament);
                  } else {
                    handleCreateTournament(data as CreateTournament);
                  }
                }}
                onCancel={() => {
                  setShowForm(false);
                  setEditingTournament(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
