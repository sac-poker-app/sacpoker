import { SCORING_CONFIG } from "@/shared/types";

/**
 * Calculate points for a player based on their position and stage configuration
 * @param position Final position in the stage (1-indexed)
 * @param totalParticipants Total number of participants in the stage
 * @param isFinalStage Whether this is the final stage (stage 12)
 * @returns Points earned
 */
export function calculatePoints(
  position: number,
  totalParticipants: number,
  isFinalStage: boolean = false
): number {
  const config = isFinalStage ? SCORING_CONFIG.FINAL_STAGE : SCORING_CONFIG.NORMAL_STAGES;
  
  // Number of players eliminated above this position
  const eliminatedAbove = totalParticipants - position;
  
  // Check if position is in the top 9 positions
  const positionConfig = config.POSITIONS.find(p => p.position === position);
  
  if (positionConfig) {
    // Top 9 positions: base points + eliminated above
    return positionConfig.base_points + eliminatedAbove;
  } else {
    // 10th position and below: 1 point + eliminated above
    return config.POSITION_10_PLUS_BASE + eliminatedAbove;
  }
}

/**
 * Calculate points for all positions in a stage
 * @param positions Array of positions to calculate
 * @param totalParticipants Total number of participants
 * @param isFinalStage Whether this is the final stage
 * @returns Map of position to points
 */
export function calculateAllPositionPoints(
  positions: number[],
  totalParticipants: number,
  isFinalStage: boolean = false
): Map<number, number> {
  const pointsMap = new Map<number, number>();
  
  for (const position of positions) {
    const points = calculatePoints(position, totalParticipants, isFinalStage);
    pointsMap.set(position, points);
  }
  
  return pointsMap;
}

/**
 * Validate stage results to ensure no duplicate positions
 * @param results Array of stage results with positions
 * @returns Validation result
 */
export function validateStageResults(results: Array<{ player_id: number; final_position: number }>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const positions = results.map(r => r.final_position);
  const uniquePositions = new Set(positions);
  
  if (positions.length !== uniquePositions.size) {
    errors.push("Posições duplicadas não são permitidas");
  }
  
  const playerIds = results.map(r => r.player_id);
  const uniquePlayerIds = new Set(playerIds);
  
  if (playerIds.length !== uniquePlayerIds.size) {
    errors.push("Jogador não pode aparecer mais de uma vez na mesma etapa");
  }
  
  // Check for gaps in positions (optional validation)
  const sortedPositions = [...positions].sort((a, b) => a - b);
  const expectedPositions = Array.from({ length: positions.length }, (_, i) => i + 1);
  
  for (let i = 0; i < sortedPositions.length; i++) {
    if (sortedPositions[i] !== expectedPositions[i]) {
      errors.push(`Posições devem ser consecutivas começando do 1º lugar`);
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
