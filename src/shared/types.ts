import { z } from "zod";

// Player types
export const CreatePlayerSchema = z.object({
  full_name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  pix_key: z.string().min(1, "Chave PIX é obrigatória"),
  unique_identifier: z.string().min(1, "Identificador único é obrigatório"),
});

export const UpdatePlayerSchema = z.object({
  full_name: z.string().min(2).optional(),
  pix_key: z.string().min(1).optional(),
  unique_identifier: z.string().min(1).optional(),
});

export type CreatePlayer = z.infer<typeof CreatePlayerSchema>;
export type UpdatePlayer = z.infer<typeof UpdatePlayerSchema>;

export interface Player {
  id: number;
  full_name: string;
  pix_key: string;
  unique_identifier: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tournament types
export const CreateTournamentSchema = z.object({
  name: z.string().min(1, "Nome do torneio é obrigatório"),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  year: z.number().optional(),
});

export const UpdateTournamentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  year: z.number().optional(),
});

export type CreateTournament = z.infer<typeof CreateTournamentSchema>;
export type UpdateTournament = z.infer<typeof UpdateTournamentSchema>;

export interface Tournament {
  id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  year?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Stage types
export interface Stage {
  id: number;
  tournament_id: number;
  stage_number: number;
  name: string;
  stage_date?: string;
  is_final_stage: boolean;
  is_completed: boolean;
  total_participants: number;
  created_at: string;
  updated_at: string;
}

// Stage results types
export const CreateStageResultSchema = z.object({
  player_id: z.number(),
  final_position: z.number().min(1),
});

export type CreateStageResult = z.infer<typeof CreateStageResultSchema>;

export interface StageResult {
  id: number;
  stage_id: number;
  player_id: number;
  final_position: number;
  points_earned: number;
  created_at: string;
  updated_at: string;
}

export interface StageResultWithPlayer extends StageResult {
  player_name: string;
}

// Ranking types
export interface PlayerRanking {
  player_id: number;
  player_name: string;
  pix_key: string;
  total_points: number;
  stages_played: number;
  average_points: number;
  best_position: number | null;
  worst_position: number | null;
}

// Scoring configuration based on specifications
export const SCORING_CONFIG = {
  NORMAL_STAGES: {
    POSITIONS: [
      { position: 1, base_points: 46 },
      { position: 2, base_points: 37 },
      { position: 3, base_points: 29 },
      { position: 4, base_points: 22 },
      { position: 5, base_points: 16 },
      { position: 6, base_points: 11 },
      { position: 7, base_points: 7 },
      { position: 8, base_points: 4 },
      { position: 9, base_points: 2 },
    ],
    POSITION_10_PLUS_BASE: 1, // Base points for 10th position and below
  },
  FINAL_STAGE: {
    POSITIONS: [
      { position: 1, base_points: 69 },
      { position: 2, base_points: 55 },
      { position: 3, base_points: 43 },
      { position: 4, base_points: 33 },
      { position: 5, base_points: 24 },
      { position: 6, base_points: 16 },
      { position: 7, base_points: 10 },
      { position: 8, base_points: 6 },
      { position: 9, base_points: 3 },
    ],
    POSITION_10_PLUS_BASE: 1, // Base points for 10th position and below
  },
};

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Tab types for UI
export type TabType = 'ranking-view' | 'players' | 'tournaments' | 'stages';

export interface TabItem {
  id: TabType;
  label: string;
  icon: string;
}
