import { useState, useEffect } from 'react';
import { Trophy, FileText, Calendar } from 'lucide-react';
import { CreateTournament, UpdateTournament, Tournament } from '@/shared/types';

interface TournamentFormProps {
  tournament?: Tournament | null;
  onSubmit: (data: CreateTournament | UpdateTournament) => void;
  onCancel: () => void;
}

export default function TournamentForm({ tournament, onSubmit, onCancel }: TournamentFormProps) {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    year: currentYear,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tournament) {
      // Extract just YYYY-MM-DD from the date strings, avoiding timezone conversions
      const startDate = tournament.start_date ? tournament.start_date.split('T')[0] : '';
      const endDate = tournament.end_date ? tournament.end_date.split('T')[0] : '';
      
      setFormData({
        name: tournament.name || '',
        description: tournament.description || '',
        start_date: startDate,
        end_date: endDate,
        year: tournament.year || currentYear,
      });
    }
  }, [tournament]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome do torneio é obrigatório';
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate <= startDate) {
        newErrors.end_date = 'Data de término deve ser posterior à data de início';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData: CreateTournament | UpdateTournament = {
        name: formData.name.trim(),
        year: formData.year,
        ...(formData.description.trim() && { description: formData.description.trim() }),
        ...(formData.start_date && { start_date: formData.start_date }),
        ...(formData.end_date && { end_date: formData.end_date }),
      };
      onSubmit(submitData);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Generate year options (current year - 5 to current year + 5)
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      {/* Nome do Torneio */}
      <div>
        <label className="block text-xs md:text-sm font-medium text-sac-yellow mb-2">
          Nome do Torneio *
        </label>
        <div className="relative">
          <Trophy className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-sac-gold" />
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Ex: Campeonato SAC 2026"
            className={`w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-sac-green focus:outline-none focus:ring-2 transition-all duration-200 text-sm md:text-base ${
              errors.name 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-sac-gold/30 focus:ring-sac-yellow focus:border-sac-yellow'
            }`}
          />
        </div>
        {errors.name && (
          <p className="mt-1 text-xs md:text-sm text-red-400">{errors.name}</p>
        )}
      </div>

      {/* Ano */}
      <div>
        <label className="block text-xs md:text-sm font-medium text-sac-yellow mb-2">
          Ano do Torneio *
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-sac-gold" />
          <select
            value={formData.year}
            onChange={(e) => handleChange('year', parseInt(e.target.value))}
            className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border border-sac-gold/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sac-yellow focus:border-sac-yellow text-sm md:text-base"
          >
            {yearOptions.map(year => (
              <option key={year} value={year} className="bg-sac-black text-white">
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-xs md:text-sm font-medium text-sac-yellow mb-2">
          Descrição
        </label>
        <div className="relative">
          <FileText className="absolute left-3 md:left-4 top-3 md:top-4 w-4 h-4 md:w-5 md:h-5 text-sac-gold" />
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Descrição opcional do torneio..."
            rows={3}
            className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border border-sac-gold/30 rounded-xl text-white placeholder-sac-green focus:outline-none focus:ring-2 focus:ring-sac-yellow focus:border-sac-yellow resize-none text-sm md:text-base"
          />
        </div>
      </div>

      {/* Datas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs md:text-sm font-medium text-sac-yellow mb-2">
            Data de Início
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-sac-gold" />
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
              className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border border-sac-gold/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-sac-yellow focus:border-sac-yellow text-sm md:text-base"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs md:text-sm font-medium text-sac-yellow mb-2">
            Data de Término
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-sac-gold" />
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
              min={formData.start_date}
              className={`w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white focus:outline-none focus:ring-2 transition-all duration-200 text-sm md:text-base ${
                errors.end_date 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-sac-gold/30 focus:ring-sac-yellow focus:border-sac-yellow'
              }`}
            />
          </div>
          {errors.end_date && (
            <p className="mt-1 text-xs md:text-sm text-red-400">{errors.end_date}</p>
          )}
        </div>
      </div>

      {/* Info */}
      {!tournament && (
        <div className="bg-sac-green/20 border border-sac-green/40 rounded-xl p-3 md:p-4">
          <p className="text-sac-green text-xs md:text-sm">
            <strong>📝 Importante:</strong> Ao criar o torneio, 12 etapas serão criadas automaticamente. 
            A 12ª etapa será configurada como etapa final com pontuação especial.
          </p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:space-x-4 pt-4 md:pt-6 border-t border-sac-gold/20">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-3 text-sac-yellow hover:text-white hover:bg-white/10 rounded-xl font-medium transition-all duration-200 text-sm md:text-base"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-sac-gold to-sac-yellow text-black rounded-xl font-medium hover:from-sac-yellow hover:to-sac-gold transition-all duration-200 shadow-lg hover:shadow-sac-gold/25 text-sm md:text-base"
        >
          {tournament ? 'Salvar Alterações' : 'Criar Torneio'}
        </button>
      </div>
    </form>
  );
}
