export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

export type Orientation = 'horizontal' | 'vertical';

export interface Position {
  row: number;
  col: number;
}

export interface Ship {
  name: string;
  size: number;
  positions: Position[];
  hits: boolean[];
  sunk: boolean;
}

export interface PlacedShip extends Ship {
  orientation: Orientation;
  startPos: Position;
}

export type BoardCell = {
  state: CellState;
  shipIndex: number | null;
};

export type Board = BoardCell[][];

export type GamePhase = 'placement' | 'battle' | 'gameOver';

export type Player = 'human' | 'ai';

export const BOARD_SIZE = 10;

export const SHIP_CONFIGS = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
] as const;

export const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
export const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
