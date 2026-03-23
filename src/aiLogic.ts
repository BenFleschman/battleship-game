import { Board, BOARD_SIZE, Position } from './types';

interface AIState {
  mode: 'hunt' | 'target';
  targetQueue: Position[];
  firstHit: Position | null;
  hitDirection: 'horizontal' | 'vertical' | null;
  consecutiveHits: Position[];
}

export function createAIState(): AIState {
  return {
    mode: 'hunt',
    targetQueue: [],
    firstHit: null,
    hitDirection: null,
    consecutiveHits: [],
  };
}

function isValidTarget(board: Board, pos: Position): boolean {
  if (pos.row < 0 || pos.row >= BOARD_SIZE || pos.col < 0 || pos.col >= BOARD_SIZE) {
    return false;
  }
  const cell = board[pos.row][pos.col];
  return cell.state === 'empty' || cell.state === 'ship';
}

function getAdjacentCells(pos: Position): Position[] {
  return [
    { row: pos.row - 1, col: pos.col },
    { row: pos.row + 1, col: pos.col },
    { row: pos.row, col: pos.col - 1 },
    { row: pos.row, col: pos.col + 1 },
  ];
}

export function getAIMove(board: Board, aiState: AIState): { pos: Position; newState: AIState } {
  const newState = {
    ...aiState,
    targetQueue: [...aiState.targetQueue],
    consecutiveHits: [...aiState.consecutiveHits],
  };

  if (newState.mode === 'target' && newState.targetQueue.length > 0) {
    // Filter out already-shot targets
    while (newState.targetQueue.length > 0) {
      const target = newState.targetQueue.shift()!;
      if (isValidTarget(board, target)) {
        return { pos: target, newState };
      }
    }
    // If no valid targets left, go back to hunt mode
    newState.mode = 'hunt';
    newState.firstHit = null;
    newState.hitDirection = null;
    newState.consecutiveHits = [];
  }

  // Hunt mode: use checkerboard pattern for efficiency
  const candidates: Position[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if ((r + c) % 2 === 0 && isValidTarget(board, { row: r, col: c })) {
        candidates.push({ row: r, col: c });
      }
    }
  }

  // If no checkerboard cells left, try all remaining
  if (candidates.length === 0) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (isValidTarget(board, { row: r, col: c })) {
          candidates.push({ row: r, col: c });
        }
      }
    }
  }

  // BUG-004 fix: guard against empty candidates
  if (candidates.length === 0) {
    // Should never happen in normal play — all ships should be sunk before this
    return { pos: { row: 0, col: 0 }, newState };
  }

  const pos = candidates[Math.floor(Math.random() * candidates.length)];
  return { pos, newState };
}

export function updateAIAfterShot(
  aiState: AIState,
  pos: Position,
  result: 'hit' | 'miss' | 'sunk'
): AIState {
  const newState = {
    ...aiState,
    targetQueue: [...aiState.targetQueue],
    consecutiveHits: [...aiState.consecutiveHits],
  };

  if (result === 'sunk') {
    // BUG-003 fix: remove sunk ship positions from consecutiveHits,
    // but keep any remaining hits that belong to other ships
    newState.consecutiveHits.push(pos);

    // Find which positions belong to the sunk ship by checking the board.
    // The sunk ship's positions are the connected group containing `pos`.
    const sunkPositions = new Set<string>();
    const toCheck = [pos];
    const checked = new Set<string>();
    while (toCheck.length > 0) {
      const p = toCheck.pop()!;
      const key = `${p.row},${p.col}`;
      if (checked.has(key)) continue;
      checked.add(key);
      // Check if this position is in our consecutiveHits
      const inHits = newState.consecutiveHits.some(h => h.row === p.row && h.col === p.col);
      if (!inHits) continue;
      sunkPositions.add(key);
      // Check adjacent cells
      const adj = [
        { row: p.row - 1, col: p.col },
        { row: p.row + 1, col: p.col },
        { row: p.row, col: p.col - 1 },
        { row: p.row, col: p.col + 1 },
      ];
      for (const a of adj) {
        if (a.row >= 0 && a.row < BOARD_SIZE && a.col >= 0 && a.col < BOARD_SIZE) {
          toCheck.push(a);
        }
      }
    }

    // Remove sunk positions from consecutiveHits
    const remaining = newState.consecutiveHits.filter(
      h => !sunkPositions.has(`${h.row},${h.col}`)
    );

    if (remaining.length > 0) {
      // Still have unsunk hits — stay in target mode and rebuild queue
      newState.consecutiveHits = remaining;
      newState.firstHit = remaining[0];
      if (remaining.length >= 2) {
        // Determine direction from remaining hits
        if (remaining[0].row === remaining[1].row) {
          newState.hitDirection = 'horizontal';
          const sorted = remaining.sort((a, b) => a.col - b.col);
          newState.targetQueue = [
            { row: sorted[0].row, col: sorted[0].col - 1 },
            { row: sorted[0].row, col: sorted[sorted.length - 1].col + 1 },
          ];
        } else {
          newState.hitDirection = 'vertical';
          const sorted = remaining.sort((a, b) => a.row - b.row);
          newState.targetQueue = [
            { row: sorted[0].row - 1, col: sorted[0].col },
            { row: sorted[sorted.length - 1].row + 1, col: sorted[0].col },
          ];
        }
      } else {
        // Single remaining hit — add all adjacent cells
        newState.hitDirection = null;
        newState.targetQueue = getAdjacentCells(remaining[0]);
      }
    } else {
      // All hits accounted for — reset to hunt mode
      newState.mode = 'hunt';
      newState.targetQueue = [];
      newState.firstHit = null;
      newState.hitDirection = null;
      newState.consecutiveHits = [];
    }
    return newState;
  }

  if (result === 'hit') {
    newState.mode = 'target';
    newState.consecutiveHits.push(pos);

    if (newState.firstHit === null) {
      // First hit - add all adjacent cells
      newState.firstHit = pos;
      const adjacents = getAdjacentCells(pos);
      newState.targetQueue = adjacents;
    } else if (newState.hitDirection === null) {
      // Second hit - determine direction
      if (pos.row === newState.firstHit.row) {
        newState.hitDirection = 'horizontal';
        // Continue in both directions along the row
        const hits = newState.consecutiveHits.sort((a, b) => a.col - b.col);
        const minCol = hits[0].col;
        const maxCol = hits[hits.length - 1].col;
        newState.targetQueue = [
          { row: pos.row, col: minCol - 1 },
          { row: pos.row, col: maxCol + 1 },
        ];
      } else {
        newState.hitDirection = 'vertical';
        const hits = newState.consecutiveHits.sort((a, b) => a.row - b.row);
        const minRow = hits[0].row;
        const maxRow = hits[hits.length - 1].row;
        newState.targetQueue = [
          { row: minRow - 1, col: pos.col },
          { row: maxRow + 1, col: pos.col },
        ];
      }
    } else {
      // Continue in the known direction
      const hits = [...newState.consecutiveHits];
      if (newState.hitDirection === 'horizontal') {
        hits.sort((a, b) => a.col - b.col);
        const minCol = hits[0].col;
        const maxCol = hits[hits.length - 1].col;
        newState.targetQueue = [
          { row: pos.row, col: minCol - 1 },
          { row: pos.row, col: maxCol + 1 },
        ];
      } else {
        hits.sort((a, b) => a.row - b.row);
        const minRow = hits[0].row;
        const maxRow = hits[hits.length - 1].row;
        newState.targetQueue = [
          { row: minRow - 1, col: pos.col },
          { row: maxRow + 1, col: pos.col },
        ];
      }
    }
  }

  // If miss while in target mode and we have a direction, try the other end
  if (result === 'miss' && newState.mode === 'target' && newState.hitDirection !== null) {
    // The queue should already have the other end, just let it continue
  }

  return newState;
}
