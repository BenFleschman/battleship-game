import { Board, BoardCell, BOARD_SIZE, Orientation, PlacedShip, Position, SHIP_CONFIGS } from './types';

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, (): BoardCell => ({
      state: 'empty',
      shipIndex: null,
    }))
  );
}

export function canPlaceShip(
  board: Board,
  startPos: Position,
  size: number,
  orientation: Orientation
): boolean {
  for (let i = 0; i < size; i++) {
    const row = orientation === 'vertical' ? startPos.row + i : startPos.row;
    const col = orientation === 'horizontal' ? startPos.col + i : startPos.col;

    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return false;
    }

    if (board[row][col].shipIndex !== null) {
      return false;
    }
  }
  return true;
}

export function placeShip(
  board: Board,
  startPos: Position,
  size: number,
  orientation: Orientation,
  shipIndex: number
): { board: Board; ship: PlacedShip } {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const positions: Position[] = [];

  for (let i = 0; i < size; i++) {
    const row = orientation === 'vertical' ? startPos.row + i : startPos.row;
    const col = orientation === 'horizontal' ? startPos.col + i : startPos.col;
    positions.push({ row, col });
    newBoard[row][col] = { state: 'ship', shipIndex };
  }

  const config = SHIP_CONFIGS[shipIndex];
  const ship: PlacedShip = {
    name: config.name,
    size: config.size,
    positions,
    hits: new Array(size).fill(false),
    sunk: false,
    orientation,
    startPos,
  };

  return { board: newBoard, ship };
}

export function fireAtBoard(
  board: Board,
  ships: PlacedShip[],
  pos: Position
): { board: Board; ships: PlacedShip[]; result: 'hit' | 'miss' | 'sunk'; sunkShipIndex: number | null } {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const newShips = ships.map(s => ({ ...s, hits: [...s.hits], positions: [...s.positions] }));
  const cell = newBoard[pos.row][pos.col];

  if (cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk') {
    return { board: newBoard, ships: newShips, result: 'miss', sunkShipIndex: null };
  }

  if (cell.shipIndex !== null) {
    const shipIdx = cell.shipIndex;
    const ship = newShips[shipIdx];
    const hitIndex = ship.positions.findIndex(p => p.row === pos.row && p.col === pos.col);
    ship.hits[hitIndex] = true;
    newBoard[pos.row][pos.col] = { state: 'hit', shipIndex: shipIdx };

    if (ship.hits.every(h => h)) {
      ship.sunk = true;
      for (const p of ship.positions) {
        newBoard[p.row][p.col] = { state: 'sunk', shipIndex: shipIdx };
      }
      return { board: newBoard, ships: newShips, result: 'sunk', sunkShipIndex: shipIdx };
    }

    return { board: newBoard, ships: newShips, result: 'hit', sunkShipIndex: null };
  }

  newBoard[pos.row][pos.col] = { state: 'miss', shipIndex: null };
  return { board: newBoard, ships: newShips, result: 'miss', sunkShipIndex: null };
}

export function allShipsSunk(ships: PlacedShip[]): boolean {
  return ships.length > 0 && ships.every(s => s.sunk);
}

export function randomPlacement(): { board: Board; ships: PlacedShip[] } {
  let board = createEmptyBoard();
  const ships: PlacedShip[] = [];

  for (let i = 0; i < SHIP_CONFIGS.length; i++) {
    const config = SHIP_CONFIGS[i];
    let placed = false;

    while (!placed) {
      const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const maxRow = orientation === 'vertical' ? BOARD_SIZE - config.size : BOARD_SIZE - 1;
      const maxCol = orientation === 'horizontal' ? BOARD_SIZE - config.size : BOARD_SIZE - 1;
      const startPos: Position = {
        row: Math.floor(Math.random() * (maxRow + 1)),
        col: Math.floor(Math.random() * (maxCol + 1)),
      };

      if (canPlaceShip(board, startPos, config.size, orientation)) {
        const result = placeShip(board, startPos, config.size, orientation, i);
        board = result.board;
        ships.push(result.ship);
        placed = true;
      }
    }
  }

  return { board, ships };
}
