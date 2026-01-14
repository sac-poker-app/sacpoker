
CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  pix_key TEXT NOT NULL,
  unique_identifier TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  stage_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  stage_date DATE,
  is_final_stage BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  total_participants INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stage_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stage_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  final_position INTEGER NOT NULL,
  points_earned INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_players_unique_identifier ON players(unique_identifier);
CREATE INDEX idx_players_pix_key ON players(pix_key);
CREATE INDEX idx_stages_tournament_id ON stages(tournament_id);
CREATE INDEX idx_stage_results_stage_id ON stage_results(stage_id);
CREATE INDEX idx_stage_results_player_id ON stage_results(player_id);
