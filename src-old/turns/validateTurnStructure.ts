export function validateTurnStructure(turn: any): turn is PCTGLBattleLog.Turn {
  if (!turn || typeof turn !== 'object') return false;
  
  // Check required properties
  if (typeof turn.turnNumber !== 'number' ||
      typeof turn.player !== 'string' ||
      !turn.cardsInHandEndOfTurn ||
      !Array.isArray(turn.actions) ||
      !Array.isArray(turn.attacks) ||
      !turn.prizeCardsTaken ||
      typeof turn.prizeCardsTaken !== 'object' ||
      !turn.newActivePokemonAfterKnockout ||
      typeof turn.newActivePokemonAfterKnockout !== 'object') {
    return false;
  }

  // Validate actions array
  if (!turn.actions.every((action: { type: string; cardType?: string; location?: string; target?: string; result?: unknown[] }) => 
    action.type && 
    typeof action.type === 'string' && 
    (!action.cardType || typeof action.cardType === 'string') &&
    (!action.location || typeof action.location === 'string') &&
    (!action.target || typeof action.target === 'string') &&
    (!action.result || Array.isArray(action.result))
  )) {
    return false;
  }

  // Validate attacks array
  if (!turn.attacks.every((attack: { attacker: string; move: string; target: string; damage: number; result: 'knockout' | 'hit' }) =>
    typeof attack.attacker === 'string' &&
    typeof attack.move === 'string' &&
    typeof attack.target === 'string' &&
    typeof attack.damage === 'number' &&
    (attack.result === 'knockout' || attack.result === 'hit')
  )) {
    return false;
  }

  return true;
}