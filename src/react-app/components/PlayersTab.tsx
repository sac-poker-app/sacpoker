import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, CreditCard, Download } from 'lucide-react';
import { Player, CreatePlayer } from '@/shared/types';
import { useApi } from '@/react-app/hooks/useApi';
import PlayerForm from './PlayerForm';

export default function PlayersTab() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const { apiCall } = useApi();

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/players');
      if (response.success) {
        setPlayers(response.data || []);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlayer = async (data: CreatePlayer) => {
    try {
      const response = await apiCall('/api/players', 'POST', data);
      if (response.success) {
        setPlayers([...players, response.data]);
        setShowForm(false);
        alert('Jogador cadastrado com sucesso!');
      } else {
        alert(response.error || 'Erro ao cadastrar jogador');
      }
    } catch (error) {
      console.error('Error creating player:', error);
      alert('Erro ao cadastrar jogador');
    }
  };

  const handleUpdatePlayer = async (data: any) => {
    if (!editingPlayer) return;
    
    try {
      const response = await apiCall(`/api/players/${editingPlayer.id}`, 'PUT', data);
      if (response.success) {
        setPlayers(players.map(p => p.id === editingPlayer.id ? response.data : p));
        setEditingPlayer(null);
        alert('Jogador atualizado com sucesso!');
      } else {
        alert(response.error || 'Erro ao atualizar jogador');
      }
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Erro ao atualizar jogador');
    }
  };

  const handleDeletePlayer = async (player: Player) => {
    if (!confirm(`Tem certeza que deseja remover ${player.full_name}?`)) return;
    
    try {
      const response = await apiCall(`/api/players/${player.id}`, 'DELETE');
      if (response.success) {
        setPlayers(players.filter(p => p.id !== player.id));
        alert('Jogador removido com sucesso!');
      } else {
        alert(response.error || 'Erro ao remover jogador');
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Erro ao remover jogador');
    }
  };

  const handleExportExcel = async () => {
    try {
      // Dynamically import xlsx
      const XLSX = await import('xlsx');
      
      // Prepare data for export
      const excelData = players.map(player => ({
        'Nome': player.full_name,
        'PIX': player.pix_key
      }));
      
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 30 }, // Nome column width
        { wch: 25 }  // PIX column width
      ];
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Participantes');
      
      // Generate file name with current date
      const fileName = `Participantes_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Erro ao exportar para Excel. Tente novamente.');
    }
  };

  const filteredPlayers = players.filter(player =>
    player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.pix_key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded-lg w-1/3"></div>
          <div className="h-12 bg-white/10 rounded-lg"></div>
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
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-sac-gold to-sac-yellow rounded-xl">
            <Users className="w-5 h-5 md:w-6 md:h-6 text-black" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">Participantes</h2>
            <p className="text-sm md:text-base text-sac-yellow">Gerencie os jogadores do torneio</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {players.length > 0 && (
            <button
              onClick={handleExportExcel}
              className="flex-1 md:flex-initial flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 md:px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-blue-500/25 text-sm md:text-base"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5" />
              <span>Exportar Excel</span>
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex-1 md:flex-initial flex items-center justify-center space-x-2 bg-gradient-to-r from-sac-green to-green-600 text-white px-4 md:px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-sac-green transition-all duration-200 shadow-lg hover:shadow-sac-green/25 text-sm md:text-base"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span>Novo Jogador</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-sac-gold" />
        <input
          type="text"
          placeholder="Buscar por nome ou chave PIX..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 md:pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-sac-gold/30 rounded-xl text-white placeholder-sac-green focus:outline-none focus:ring-2 focus:ring-sac-yellow focus:border-sac-yellow text-sm md:text-base"
        />
      </div>

      {/* Players List */}
      <div className="space-y-3 md:space-y-4">
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 md:w-16 md:h-16 text-sac-gold mx-auto mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
              {searchTerm ? 'Nenhum jogador encontrado' : 'Nenhum jogador cadastrado'}
            </h3>
            <p className="text-sm md:text-base text-sac-yellow mb-6">
              {searchTerm ? 'Tente buscar com outros termos' : 'Comece cadastrando o primeiro jogador'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-sac-gold to-sac-yellow text-black px-6 py-3 rounded-xl font-medium hover:from-sac-yellow hover:to-sac-gold transition-all duration-200"
              >
                Cadastrar Primeiro Jogador
              </button>
            )}
          </div>
        ) : (
          filteredPlayers.map((player) => (
            <div
              key={player.id}
              className="bg-white/5 backdrop-blur-sm border border-sac-gold/30 rounded-xl p-4 md:p-6 hover:bg-sac-gold/10 transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 md:space-x-4 mb-2 md:mb-3">
                    <h3 className="text-base md:text-lg font-semibold text-white truncate">{player.full_name}</h3>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs md:text-sm">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-3 h-3 md:w-4 md:h-4 text-sac-green flex-shrink-0" />
                      <span className="text-sac-green truncate">PIX: {player.pix_key}</span>
                    </div>
                    <span className="text-sac-yellow">
                      {new Date(player.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingPlayer(player)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                    title="Editar jogador"
                  >
                    <Edit className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={() => handleDeletePlayer(player)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                    title="Remover jogador"
                  >
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Player Form Modal */}
      {(showForm || editingPlayer) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-0 md:pt-[5vh]">
          <div className="bg-white/10 backdrop-blur-xl border-0 md:border border-sac-gold/30 md:rounded-2xl p-4 md:p-8 w-full h-full md:h-auto md:max-w-md md:max-h-[90vh] overflow-y-auto">
            <PlayerForm
              player={editingPlayer}
              onSubmit={editingPlayer ? handleUpdatePlayer : handleCreatePlayer}
              onCancel={() => {
                setShowForm(false);
                setEditingPlayer(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
