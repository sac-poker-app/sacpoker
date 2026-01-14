import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import {
  CreatePlayerSchema,
  UpdatePlayerSchema,
  CreateTournamentSchema,
  UpdateTournamentSchema,
  CreateStageResultSchema,
  type Player,
  type Tournament,
  type Stage,
  type StageResultWithPlayer,
  type PlayerRanking
} from "@/shared/types";
import { Env, executeQuery, executeQueryFirst, executeInsert, executeUpdate } from "./database";
import { calculatePoints, validateStageResults } from "./scoring";

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for all routes
app.use("/*", cors());

// Health check
app.get("/api/health", (c) => {
  return c.json({ success: true, message: "PokerMaster API is running" });
});

// Players endpoints
app.get("/api/players", async (c) => {
  try {
    const players = await executeQuery<Player>(
      c.env.DB,
      "SELECT * FROM players WHERE is_active = 1 ORDER BY full_name"
    );
    return c.json({ success: true, data: players });
  } catch (error) {
    console.error("Error fetching players:", error);
    return c.json({ success: false, error: "Failed to fetch players" }, 500);
  }
});

app.post("/api/players", zValidator("json", CreatePlayerSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    
    // Check if unique_identifier already exists
    const existing = await executeQueryFirst(
      c.env.DB,
      "SELECT id FROM players WHERE unique_identifier = ?",
      [data.unique_identifier]
    );
    
    if (existing) {
      return c.json({ success: false, error: "Identificador único já existe" }, 400);
    }
    
    const result = await executeInsert(
      c.env.DB,
      "INSERT INTO players (full_name, pix_key, unique_identifier) VALUES (?, ?, ?)",
      [data.full_name, data.pix_key, data.unique_identifier]
    );
    
    const player = await executeQueryFirst<Player>(
      c.env.DB,
      "SELECT * FROM players WHERE id = ?",
      [result.id]
    );
    
    return c.json({ success: true, data: player, message: "Jogador cadastrado com sucesso" });
  } catch (error) {
    console.error("Error creating player:", error);
    return c.json({ success: false, error: "Failed to create player" }, 500);
  }
});

app.put("/api/players/:id", zValidator("json", UpdatePlayerSchema), async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const data = c.req.valid("json");
    
    if (data.unique_identifier) {
      // Check if unique_identifier already exists for another player
      const existing = await executeQueryFirst(
        c.env.DB,
        "SELECT id FROM players WHERE unique_identifier = ? AND id != ?",
        [data.unique_identifier, id]
      );
      
      if (existing) {
        return c.json({ success: false, error: "Identificador único já existe" }, 400);
      }
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.full_name) {
      updates.push("full_name = ?");
      values.push(data.full_name);
    }
    if (data.pix_key) {
      updates.push("pix_key = ?");
      values.push(data.pix_key);
    }
    if (data.unique_identifier) {
      updates.push("unique_identifier = ?");
      values.push(data.unique_identifier);
    }
    
    if (updates.length === 0) {
      return c.json({ success: false, error: "Nenhum campo para atualizar" }, 400);
    }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    await executeUpdate(
      c.env.DB,
      `UPDATE players SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
    
    const player = await executeQueryFirst<Player>(
      c.env.DB,
      "SELECT * FROM players WHERE id = ?",
      [id]
    );
    
    return c.json({ success: true, data: player, message: "Jogador atualizado com sucesso" });
  } catch (error) {
    console.error("Error updating player:", error);
    return c.json({ success: false, error: "Failed to update player" }, 500);
  }
});

app.delete("/api/players/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    
    await executeUpdate(
      c.env.DB,
      "UPDATE players SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );
    
    return c.json({ success: true, message: "Jogador removido com sucesso" });
  } catch (error) {
    console.error("Error deleting player:", error);
    return c.json({ success: false, error: "Failed to delete player" }, 500);
  }
});

// Tournaments endpoints
app.get("/api/tournaments", async (c) => {
  try {
    const tournaments = await executeQuery<Tournament>(
      c.env.DB,
      "SELECT * FROM tournaments WHERE is_active = 1 ORDER BY created_at DESC"
    );
    return c.json({ success: true, data: tournaments });
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return c.json({ success: false, error: "Failed to fetch tournaments" }, 500);
  }
});

app.post("/api/tournaments", zValidator("json", CreateTournamentSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    
    const result = await executeInsert(
      c.env.DB,
      "INSERT INTO tournaments (name, description, start_date, end_date, year) VALUES (?, ?, ?, ?, ?)",
      [data.name, data.description || null, data.start_date || null, data.end_date || null, data.year || null]
    );
    
    // Create 12 stages for the tournament
    for (let i = 1; i <= 12; i++) {
      await executeInsert(
        c.env.DB,
        "INSERT INTO stages (tournament_id, stage_number, name, is_final_stage) VALUES (?, ?, ?, ?)",
        [result.id, i, `Etapa ${i}`, i === 12]
      );
    }
    
    const tournament = await executeQueryFirst<Tournament>(
      c.env.DB,
      "SELECT * FROM tournaments WHERE id = ?",
      [result.id]
    );
    
    return c.json({ success: true, data: tournament, message: "Torneio criado com sucesso" });
  } catch (error) {
    console.error("Error creating tournament:", error);
    return c.json({ success: false, error: "Failed to create tournament" }, 500);
  }
});

app.put("/api/tournaments/:id", zValidator("json", UpdateTournamentSchema), async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const data = c.req.valid("json");
    
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name) {
      updates.push("name = ?");
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      values.push(data.description || null);
    }
    if (data.start_date !== undefined) {
      updates.push("start_date = ?");
      values.push(data.start_date || null);
    }
    if (data.end_date !== undefined) {
      updates.push("end_date = ?");
      values.push(data.end_date || null);
    }
    if (data.year !== undefined) {
      updates.push("year = ?");
      values.push(data.year || null);
    }
    
    if (updates.length === 0) {
      return c.json({ success: false, error: "Nenhum campo para atualizar" }, 400);
    }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    await executeUpdate(
      c.env.DB,
      `UPDATE tournaments SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
    
    const tournament = await executeQueryFirst<Tournament>(
      c.env.DB,
      "SELECT * FROM tournaments WHERE id = ?",
      [id]
    );
    
    return c.json({ success: true, data: tournament, message: "Torneio atualizado com sucesso" });
  } catch (error) {
    console.error("Error updating tournament:", error);
    return c.json({ success: false, error: "Failed to update tournament" }, 500);
  }
});

app.delete("/api/tournaments/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    
    // Delete all stage results for all stages of this tournament
    await executeUpdate(
      c.env.DB,
      `DELETE FROM stage_results WHERE stage_id IN (SELECT id FROM stages WHERE tournament_id = ?)`,
      [id]
    );
    
    // Delete all stages for this tournament
    await executeUpdate(
      c.env.DB,
      "DELETE FROM stages WHERE tournament_id = ?",
      [id]
    );
    
    // Delete the tournament
    await executeUpdate(
      c.env.DB,
      "DELETE FROM tournaments WHERE id = ?",
      [id]
    );
    
    return c.json({ success: true, message: "Torneio excluído com sucesso" });
  } catch (error) {
    console.error("Error deleting tournament:", error);
    return c.json({ success: false, error: "Failed to delete tournament" }, 500);
  }
});

// Stages endpoints
app.get("/api/tournaments/:tournamentId/stages", async (c) => {
  try {
    const tournamentId = parseInt(c.req.param("tournamentId"));
    
    const stages = await executeQuery<Stage>(
      c.env.DB,
      "SELECT * FROM stages WHERE tournament_id = ? ORDER BY stage_number",
      [tournamentId]
    );
    
    return c.json({ success: true, data: stages });
  } catch (error) {
    console.error("Error fetching stages:", error);
    return c.json({ success: false, error: "Failed to fetch stages" }, 500);
  }
});

// Stage results endpoints
app.get("/api/stages/:stageId/results", async (c) => {
  try {
    const stageId = parseInt(c.req.param("stageId"));
    
    const results = await executeQuery<StageResultWithPlayer>(
      c.env.DB,
      `SELECT sr.*, p.full_name as player_name 
       FROM stage_results sr 
       JOIN players p ON sr.player_id = p.id 
       WHERE sr.stage_id = ? 
       ORDER BY sr.final_position`,
      [stageId]
    );
    
    return c.json({ success: true, data: results });
  } catch (error) {
    console.error("Error fetching stage results:", error);
    return c.json({ success: false, error: "Failed to fetch stage results" }, 500);
  }
});

app.post("/api/stages/:stageId/results", zValidator("json", CreateStageResultSchema.array()), async (c) => {
  try {
    const stageId = parseInt(c.req.param("stageId"));
    const results = c.req.valid("json");
    
    // Validate results
    const validation = validateStageResults(results);
    if (!validation.isValid) {
      return c.json({ success: false, error: validation.errors.join(", ") }, 400);
    }
    
    // Get stage info
    const stage = await executeQueryFirst<Stage>(
      c.env.DB,
      "SELECT * FROM stages WHERE id = ?",
      [stageId]
    );
    
    if (!stage) {
      return c.json({ success: false, error: "Etapa não encontrada" }, 404);
    }
    
    const totalParticipants = results.length;
    
    // Clear existing results for this stage
    await executeUpdate(
      c.env.DB,
      "DELETE FROM stage_results WHERE stage_id = ?",
      [stageId]
    );
    
    // Insert new results with calculated points
    for (const result of results) {
      const points = calculatePoints(result.final_position, totalParticipants, stage.is_final_stage);
      
      await executeInsert(
        c.env.DB,
        "INSERT INTO stage_results (stage_id, player_id, final_position, points_earned) VALUES (?, ?, ?, ?)",
        [stageId, result.player_id, result.final_position, points]
      );
    }
    
    // Update stage status
    await executeUpdate(
      c.env.DB,
      "UPDATE stages SET is_completed = 1, total_participants = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [totalParticipants, stageId]
    );
    
    return c.json({ success: true, message: "Resultados salvos com sucesso" });
  } catch (error) {
    console.error("Error saving stage results:", error);
    return c.json({ success: false, error: "Failed to save stage results" }, 500);
  }
});

app.delete("/api/stages/:stageId/results", async (c) => {
  try {
    const stageId = parseInt(c.req.param("stageId"));
    
    // Clear all results for this stage
    await executeUpdate(
      c.env.DB,
      "DELETE FROM stage_results WHERE stage_id = ?",
      [stageId]
    );
    
    // Reset stage status
    await executeUpdate(
      c.env.DB,
      "UPDATE stages SET is_completed = 0, total_participants = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [stageId]
    );
    
    return c.json({ success: true, message: "Resultados da etapa excluídos com sucesso" });
  } catch (error) {
    console.error("Error deleting stage results:", error);
    return c.json({ success: false, error: "Failed to delete stage results" }, 500);
  }
});

// Rankings endpoint - MUST be filtered by tournament_id
app.get("/api/tournaments/:tournamentId/ranking", async (c) => {
  try {
    const tournamentId = parseInt(c.req.param("tournamentId"));
    
    if (!tournamentId) {
      return c.json({ success: false, error: "tournament_id is required" }, 400);
    }
    
    // This query ONLY considers results from stages belonging to the specified tournament
    // No global aggregation - each tournament has its own independent ranking
    const rankings = await executeQuery<PlayerRanking>(
      c.env.DB,
      `SELECT 
        p.id as player_id,
        p.full_name as player_name,
        p.pix_key,
        COALESCE(SUM(CASE WHEN s.tournament_id = ? THEN sr.points_earned ELSE 0 END), 0) as total_points,
        COUNT(CASE WHEN s.tournament_id = ? THEN sr.id ELSE NULL END) as stages_played,
        CASE 
          WHEN COUNT(CASE WHEN s.tournament_id = ? THEN sr.id ELSE NULL END) > 0 
          THEN ROUND(CAST(SUM(CASE WHEN s.tournament_id = ? THEN sr.points_earned ELSE 0 END) AS FLOAT) / COUNT(CASE WHEN s.tournament_id = ? THEN sr.id ELSE NULL END), 2) 
          ELSE 0 
        END as average_points,
        MIN(CASE WHEN s.tournament_id = ? THEN sr.final_position ELSE NULL END) as best_position,
        MAX(CASE WHEN s.tournament_id = ? THEN sr.final_position ELSE NULL END) as worst_position
       FROM players p
       LEFT JOIN stage_results sr ON p.id = sr.player_id
       LEFT JOIN stages s ON sr.stage_id = s.id
       WHERE p.is_active = 1
       GROUP BY p.id, p.full_name, p.pix_key
       HAVING COUNT(CASE WHEN s.tournament_id = ? THEN sr.id ELSE NULL END) > 0 OR 1=1
       ORDER BY total_points DESC, best_position ASC`,
      [tournamentId, tournamentId, tournamentId, tournamentId, tournamentId, tournamentId, tournamentId, tournamentId]
    );
    
    return c.json({ success: true, data: rankings });
  } catch (error) {
    console.error("Error fetching rankings:", error);
    return c.json({ success: false, error: "Failed to fetch rankings" }, 500);
  }
});

// Stage-by-stage scores endpoint
app.get("/api/tournaments/:tournamentId/stage-scores", async (c) => {
  try {
    const tournamentId = parseInt(c.req.param("tournamentId"));
    
    // Get all stages for this tournament
    const stages = await executeQuery<Stage>(
      c.env.DB,
      "SELECT * FROM stages WHERE tournament_id = ? AND is_completed = 1 ORDER BY stage_number",
      [tournamentId]
    );
    
    // Get all players with their stage results
    const playersWithScores = await executeQuery<any>(
      c.env.DB,
      `SELECT 
        p.id as player_id,
        p.full_name as player_name,
        s.id as stage_id,
        s.stage_number,
        sr.final_position,
        sr.points_earned
       FROM players p
       CROSS JOIN stages s
       LEFT JOIN stage_results sr ON p.id = sr.player_id AND s.id = sr.stage_id
       WHERE p.is_active = 1 AND s.tournament_id = ? AND s.is_completed = 1
       ORDER BY p.full_name, s.stage_number`,
      [tournamentId]
    );
    
    // Group by player
    const playerScoresMap = new Map();
    for (const row of playersWithScores) {
      if (!playerScoresMap.has(row.player_id)) {
        playerScoresMap.set(row.player_id, {
          player_id: row.player_id,
          player_name: row.player_name,
          stages: []
        });
      }
      
      playerScoresMap.get(row.player_id).stages.push({
        stage_number: row.stage_number,
        final_position: row.final_position,
        points_earned: row.points_earned
      });
    }
    
    const result = {
      stages: stages.map(s => ({ id: s.id, stage_number: s.stage_number, name: s.name })),
      players: Array.from(playerScoresMap.values())
    };
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching stage scores:", error);
    return c.json({ success: false, error: "Failed to fetch stage scores" }, 500);
  }
});

export default app;
