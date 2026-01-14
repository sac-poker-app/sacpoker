import { useState } from 'react';
import { X, User } from 'lucide-react';
import { Player } from '@/shared/types';

interface PlayerFormProps {
  player?: Player | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function PlayerForm({ player, onSubmit, onCancel }: PlayerFormProps) {
  const [formData, setFormData] = useState({
    full_name: player?.full_name || '',
    pix_key: player?.pix_key || '',
    unique_identifier: player?.unique_identifier || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome é obrigatório';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.pix_key.trim()) {
      newErrors.pix_key = 'Chave PIX é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        ...formData,
        unique_identifier: formData.full_name,
      };
      onSubmit(submitData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="p-2 bg-gradient-to-br from-sac-gold to-sac-yellow rounded-xl flex-shrink-0">
            <User className="w-5 h-5 md:w-6 md:h-6 text-black" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg md:text-xl font-bold text-white truncate">
              {player ? 'Editar Jogador' : 'Novo Jogador'}
            </h3>
            <p className="text-xs md:text-sm text-sac-yellow truncate">
              {player ? 'Atualize as informações' : 'Cadastre um novo participante'}
            </p>
          </div>
        </div>
        
        <button
          onClick={onCancel}
          className="p-2 text-sac-yellow hover:text-sac-gold hover:bg-white/10 rounded-lg transition-all duration-200 flex-shrink-0"
        >
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Nome Completo */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-sac-yellow mb-2">
            Nome Completo *
          </label>
          <div className="relative">
            <User className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-sac-gold" />
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              placeholder="Digite o nome completo do jogador"
              className={`w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-sac-green focus:outline-none focus:ring-2 transition-all duration-200 text-sm md:text-base ${
                errors.full_name 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-sac-gold/30 focus:ring-sac-yellow focus:border-sac-yellow'
              }`}
            />
          </div>
          {errors.full_name && (
            <p className="mt-1 text-xs md:text-sm text-red-400">{errors.full_name}</p>
          )}
        </div>

        {/* Chave PIX */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-sac-yellow mb-2">
            Chave PIX *
          </label>
          <div className="relative">
            <User className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-sac-gold" />
            <input
              type="text"
              value={formData.pix_key}
              onChange={(e) => handleChange('pix_key', e.target.value)}
              placeholder="Digite a chave PIX do jogador"
              className={`w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-sac-green focus:outline-none focus:ring-2 transition-all duration-200 text-sm md:text-base ${
                errors.pix_key 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-sac-gold/30 focus:ring-sac-yellow focus:border-sac-yellow'
              }`}
            />
          </div>
          {errors.pix_key && (
            <p className="mt-1 text-xs md:text-sm text-red-400">{errors.pix_key}</p>
          )}
          <p className="mt-1 text-xs md:text-sm text-sac-green">
            CPF, e-mail, telefone ou chave aleatória
          </p>
        </div>

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
            {player ? 'Atualizar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </div>
  );
}
