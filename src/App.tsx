import { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import {
  Board,
  BoardCell,
  BOARD_SIZE,
  GamePhase,
  Orientation,
  PlacedShip,
  Position,
  SHIP_CONFIGS,
  ROW_LABELS,
  COL_LABELS,
} from './types';
import {
  createEmptyBoard,
  canPlaceShip,
  placeShip,
  fireAtBoard,
  allShipsSunk,
  randomPlacement,
} from './gameLogic';
import { createAIState, getAIMove, updateAIAfterShot } from './aiLogic';
import { ShipSVGMap } from './ShipSVGs';

// Sound effects using Web Audio API — single shared AudioContext (BUG-001 fix)
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioContext();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

function playSound(type: 'hit' | 'miss' | 'sunk' | 'splash') {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'hit':
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
        break;
      case 'miss':
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        break;
      case 'sunk':
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
        break;
      case 'splash':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        break;
    }
  } catch {
    // Audio not available
  }
}

function App() {
  // Game state
  const [gamePhase, setGamePhase] = useState<GamePhase>('placement');
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [hoverPos, setHoverPos] = useState<Position | null>(null);

  // Player boards
  const [playerBoard, setPlayerBoard] = useState<Board>(createEmptyBoard());
  const [playerShips, setPlayerShips] = useState<PlacedShip[]>([]);
  const [aiBoard, setAiBoard] = useState<Board>(createEmptyBoard());
  const [aiShips, setAiShips] = useState<PlacedShip[]>([]);

  // AI view of player board (what AI has shot)
  const [aiViewBoard, setAiViewBoard] = useState<Board>(createEmptyBoard());
  const [playerViewBoard, setPlayerViewBoard] = useState<Board>(createEmptyBoard());

  // Turn state
  const isFiringRef = useRef(false); // BUG-005 fix: synchronous guard against double-fire
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [aiState, setAiState] = useState(createAIState());
  const [message, setMessage] = useState('Place your Carrier (5 cells)');
  const [winner, setWinner] = useState<'human' | 'ai' | null>(null);
  const [lastHit, setLastHit] = useState<Position | null>(null);
  const [animatingCell, setAnimatingCell] = useState<Position | null>(null);

  // Stats
  const [playerShots, setPlayerShots] = useState(0);
  const [playerHits, setPlayerHits] = useState(0);
  const [aiShots, setAiShots] = useState(0);
  const [aiHits, setAiHits] = useState(0);
  const [turnNumber, setTurnNumber] = useState(0);

  // Cell size for responsive design — updates on window resize (BUG-002 fix)
  const computeCellSize = () => {
    if (typeof window === 'undefined') return 36;
    const width = window.innerWidth;
    if (width < 640) return 28;
    if (width < 1024) return 32;
    return 36;
  };
  const [cellSize, setCellSize] = useState(computeCellSize);

  useEffect(() => {
    const onResize = () => setCellSize(computeCellSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Initialize AI board on mount
  useEffect(() => {
    const { board, ships } = randomPlacement();
    setAiBoard(board);
    setAiShips(ships);
  }, []);

  // Handle ship placement
  const handlePlacementClick = useCallback(
    (row: number, col: number) => {
      if (gamePhase !== 'placement' || currentShipIndex >= SHIP_CONFIGS.length) return;

      const config = SHIP_CONFIGS[currentShipIndex];
      const startPos = { row, col };

      if (!canPlaceShip(playerBoard, startPos, config.size, orientation)) return;

      const result = placeShip(playerBoard, startPos, config.size, orientation, currentShipIndex);
      setPlayerBoard(result.board);
      setPlayerShips(prev => [...prev, result.ship]);

      const nextIdx = currentShipIndex + 1;
      if (nextIdx >= SHIP_CONFIGS.length) {
        setGamePhase('battle');
        setMessage("Battle begins! Click on the enemy board to fire.");
        setCurrentShipIndex(nextIdx);
      } else {
        setCurrentShipIndex(nextIdx);
        setMessage(`Place your ${SHIP_CONFIGS[nextIdx].name} (${SHIP_CONFIGS[nextIdx].size} cells)`);
      }
    },
    [gamePhase, currentShipIndex, orientation, playerBoard]
  );

  // Handle player firing — with ref guard to prevent double-fire (BUG-005 fix)
  const handleFireClick = useCallback(
    (row: number, col: number) => {
      if (gamePhase !== 'battle' || !isPlayerTurn || winner) return;
      if (isFiringRef.current) return; // BUG-005 fix: synchronous guard
      isFiringRef.current = true;

      const cell = playerViewBoard[row][col];
      if (cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk') {
        isFiringRef.current = false;
        return;
      }

      setPlayerShots(prev => prev + 1);
      setTurnNumber(prev => prev + 1);
      setAnimatingCell({ row, col });

      const result = fireAtBoard(aiBoard, aiShips, { row, col });
      setAiBoard(result.board);
      setAiShips(result.ships);

      // Update player's view of AI board
      const newViewBoard = playerViewBoard.map(r => r.map(c => ({ ...c })));
      newViewBoard[row][col] = result.board[row][col];
      if (result.result === 'sunk' && result.sunkShipIndex !== null) {
        const sunkShip = result.ships[result.sunkShipIndex];
        for (const p of sunkShip.positions) {
          newViewBoard[p.row][p.col] = { state: 'sunk', shipIndex: result.sunkShipIndex };
        }
      }
      setPlayerViewBoard(newViewBoard);
      setLastHit({ row, col });

      if (result.result === 'hit') {
        playSound('hit');
        setPlayerHits(prev => prev + 1);
        setMessage('Direct hit!');
      } else if (result.result === 'sunk') {
        playSound('sunk');
        setPlayerHits(prev => prev + 1);
        const sunkName = result.sunkShipIndex !== null ? result.ships[result.sunkShipIndex].name : 'ship';
        setMessage(`You sunk their ${sunkName}!`);
      } else {
        playSound('miss');
        setMessage('Miss!');
      }

      setTimeout(() => setAnimatingCell(null), 400);

      if (allShipsSunk(result.ships)) {
        setWinner('human');
        setGamePhase('gameOver');
        setMessage('Victory! You sunk all enemy ships!');
        isFiringRef.current = false;
        return;
      }

      setIsPlayerTurn(false);

      // AI turn after delay
      setTimeout(() => {
        const aiMove = getAIMove(playerBoard, aiState);
        const aiResult = fireAtBoard(playerBoard, playerShips, aiMove.pos);

        setPlayerBoard(aiResult.board);
        setPlayerShips(aiResult.ships);
        setAiShots(prev => prev + 1);

        const newAiView = aiViewBoard.map(r => r.map(c => ({ ...c })));
        newAiView[aiMove.pos.row][aiMove.pos.col] = aiResult.board[aiMove.pos.row][aiMove.pos.col];
        if (aiResult.result === 'sunk' && aiResult.sunkShipIndex !== null) {
          const sunkShip = aiResult.ships[aiResult.sunkShipIndex];
          for (const p of sunkShip.positions) {
            newAiView[p.row][p.col] = { state: 'sunk', shipIndex: aiResult.sunkShipIndex };
          }
        }
        setAiViewBoard(newAiView);

        const newAiState = updateAIAfterShot(aiMove.newState, aiMove.pos, aiResult.result);
        setAiState(newAiState);

        if (aiResult.result === 'hit') {
          playSound('hit');
          setAiHits(prev => prev + 1);
          setMessage('Enemy hit your ship! Your turn.');
        } else if (aiResult.result === 'sunk') {
          playSound('sunk');
          setAiHits(prev => prev + 1);
          const sunkName = aiResult.sunkShipIndex !== null ? aiResult.ships[aiResult.sunkShipIndex].name : 'ship';
          setMessage(`Enemy sunk your ${sunkName}! Your turn.`);
        } else {
          playSound('splash');
          setMessage('Enemy missed! Your turn.');
        }

        if (allShipsSunk(aiResult.ships)) {
          setWinner('ai');
          setGamePhase('gameOver');
          setMessage('Defeat! The enemy sunk all your ships.');
          isFiringRef.current = false;
          return;
        }

        setIsPlayerTurn(true);
        isFiringRef.current = false;
      }, 800);
    },
    [gamePhase, isPlayerTurn, winner, playerViewBoard, aiBoard, aiShips, playerBoard, playerShips, aiState, aiViewBoard]
  );

  // Random placement
  const handleRandomPlacement = useCallback(() => {
    const { board, ships } = randomPlacement();
    setPlayerBoard(board);
    setPlayerShips(ships);
    setCurrentShipIndex(SHIP_CONFIGS.length);
    setGamePhase('battle');
    setMessage("Battle begins! Click on the enemy board to fire.");
  }, []);

  // Reset game
  const handleReset = useCallback(() => {
    setGamePhase('placement');
    setCurrentShipIndex(0);
    setOrientation('horizontal');
    setHoverPos(null);
    setPlayerBoard(createEmptyBoard());
    setPlayerShips([]);
    const { board, ships } = randomPlacement();
    setAiBoard(board);
    setAiShips(ships);
    setAiViewBoard(createEmptyBoard());
    setPlayerViewBoard(createEmptyBoard());
    setIsPlayerTurn(true);
    isFiringRef.current = false;
    setAiState(createAIState());
    setMessage('Place your Carrier (5 cells)');
    setWinner(null);
    setLastHit(null);
    setPlayerShots(0);
    setPlayerHits(0);
    setAiShots(0);
    setAiHits(0);
    setTurnNumber(0);
  }, []);

  // Get placement preview cells
  const getPlacementPreview = useCallback(
    (row: number, col: number): { valid: boolean; cells: Position[] } => {
      if (gamePhase !== 'placement' || currentShipIndex >= SHIP_CONFIGS.length)
        return { valid: false, cells: [] };
      const config = SHIP_CONFIGS[currentShipIndex];
      const cells: Position[] = [];
      for (let i = 0; i < config.size; i++) {
        const r = orientation === 'vertical' ? row + i : row;
        const c = orientation === 'horizontal' ? col + i : col;
        if (r < BOARD_SIZE && c < BOARD_SIZE) { // BUG-006 fix: bounds check
          cells.push({ row: r, col: c });
        }
      }
      const valid = canPlaceShip(playerBoard, { row, col }, config.size, orientation);
      return { valid, cells };
    },
    [gamePhase, currentShipIndex, orientation, playerBoard]
  );

  // Render a cell on the board
  const renderCell = (
    cell: BoardCell,
    row: number,
    col: number,
    boardType: 'player' | 'enemy',
    placementPreview?: { valid: boolean; cells: Position[] }
  ) => {
    const isPreview =
      placementPreview &&
      placementPreview.cells.some(c => c.row === row && c.col === col);
    const isAnimating = animatingCell?.row === row && animatingCell?.col === col;
    const isLastHit = lastHit?.row === row && lastHit?.col === col && boardType === 'enemy';

    let bgClass = 'bg-blue-900/40';
    let content = null;
    let hoverClass = '';

    if (boardType === 'player') {
      if (cell.state === 'ship') {
        bgClass = 'bg-transparent';
      } else if (cell.state === 'hit') {
        bgClass = 'bg-red-600/70';
        content = (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-3 h-3 bg-red-400 rounded-full shadow-lg shadow-red-500/50" />
          </div>
        );
      } else if (cell.state === 'sunk') {
        bgClass = 'bg-red-800/80';
        content = (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <line x1="2" y1="2" x2="12" y2="12" stroke="#fca5a5" strokeWidth="2" />
              <line x1="12" y1="2" x2="2" y2="12" stroke="#fca5a5" strokeWidth="2" />
            </svg>
          </div>
        );
      } else if (cell.state === 'miss') {
        bgClass = 'bg-blue-800/50';
        content = (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-400 rounded-full opacity-60" />
          </div>
        );
      }

      if (isPreview) {
        bgClass = placementPreview!.valid
          ? 'bg-green-500/40 border-green-400'
          : 'bg-red-500/40 border-red-400';
      }

      if (gamePhase === 'placement' && cell.state === 'empty' && !isPreview) {
        hoverClass = 'hover:bg-blue-700/40 cursor-pointer';
      }
    } else {
      // Enemy board
      if (cell.state === 'hit') {
        bgClass = 'bg-red-600/70';
        content = (
          <div className={`w-full h-full flex items-center justify-center ${isAnimating ? 'animate-ping' : ''}`}>
            <div className="w-3 h-3 bg-red-400 rounded-full shadow-lg shadow-red-500/50" />
          </div>
        );
      } else if (cell.state === 'sunk') {
        bgClass = 'bg-red-800/80';
        content = (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <line x1="2" y1="2" x2="12" y2="12" stroke="#fca5a5" strokeWidth="2" />
              <line x1="12" y1="2" x2="2" y2="12" stroke="#fca5a5" strokeWidth="2" />
            </svg>
          </div>
        );
      } else if (cell.state === 'miss') {
        bgClass = 'bg-blue-800/50';
        content = (
          <div className={`w-full h-full flex items-center justify-center ${isAnimating ? 'animate-bounce' : ''}`}>
            <div className="w-2 h-2 bg-gray-400 rounded-full opacity-60" />
          </div>
        );
      } else if (gamePhase === 'battle' && isPlayerTurn && !winner) {
        hoverClass = 'hover:bg-cyan-500/30 cursor-crosshair';
      }
    }

    return (
      <div
        key={`${row}-${col}`}
        className={`border border-blue-700/30 ${bgClass} ${hoverClass} transition-all duration-150 relative ${
          isLastHit ? 'ring-2 ring-yellow-400/60' : ''
        }`}
        style={{ width: cellSize, height: cellSize }}
        onClick={() => {
          if (boardType === 'player' && gamePhase === 'placement') {
            handlePlacementClick(row, col);
          } else if (boardType === 'enemy' && gamePhase === 'battle') {
            handleFireClick(row, col);
          }
        }}
        onMouseEnter={() => {
          if (boardType === 'player' && gamePhase === 'placement') {
            setHoverPos({ row, col });
          }
        }}
        onMouseLeave={() => {
          if (boardType === 'player' && gamePhase === 'placement') {
            setHoverPos(null);
          }
        }}
      >
        {content}
      </div>
    );
  };

  // Render ship SVGs on a board
  const renderShipOverlays = (ships: PlacedShip[], showAll: boolean) => {
    return ships.map((ship, idx) => {
      if (!showAll && !ship.sunk) return null;
      const ShipComponent = ShipSVGMap[ship.name];
      if (!ShipComponent) return null;

      const startRow = ship.startPos.row;
      const startCol = ship.startPos.col;

      return (
        <div
          key={idx}
          style={{
            position: 'absolute',
            top: startRow * cellSize,
            left: startCol * cellSize,
            width: ship.orientation === 'horizontal' ? ship.size * cellSize : cellSize,
            height: ship.orientation === 'vertical' ? ship.size * cellSize : cellSize,
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          <ShipComponent
            cellSize={cellSize}
            shipSize={ship.size}
            orientation={ship.orientation}
            opacity={ship.sunk ? 0.5 : 1}
          />
        </div>
      );
    });
  };

  // Render the board grid
  const renderBoard = (
    board: Board,
    boardType: 'player' | 'enemy',
    ships: PlacedShip[],
    showShips: boolean
  ) => {
    const preview = hoverPos && boardType === 'player' ? getPlacementPreview(hoverPos.row, hoverPos.col) : undefined;

    return (
      <div className="relative">
        {/* Column labels */}
        <div className="flex" style={{ marginLeft: cellSize }}>
          {COL_LABELS.map(label => (
            <div
              key={label}
              className="text-center text-xs font-bold text-blue-300/70"
              style={{ width: cellSize }}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Row labels */}
          <div className="flex flex-col">
            {ROW_LABELS.map(label => (
              <div
                key={label}
                className="flex items-center justify-center text-xs font-bold text-blue-300/70"
                style={{ width: cellSize, height: cellSize }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div
            className="relative border-2 border-blue-600/50 rounded-sm"
            style={{
              width: BOARD_SIZE * cellSize,
              height: BOARD_SIZE * cellSize,
              background: 'linear-gradient(180deg, #0c1e3a 0%, #0a1628 100%)',
            }}
          >
            {/* Water pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent ${cellSize - 1}px,
                  rgba(59, 130, 246, 0.3) ${cellSize - 1}px,
                  rgba(59, 130, 246, 0.3) ${cellSize}px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent ${cellSize - 1}px,
                  rgba(59, 130, 246, 0.3) ${cellSize - 1}px,
                  rgba(59, 130, 246, 0.3) ${cellSize}px
                )`,
              }}
            />

            {/* Ship overlays */}
            {showShips && renderShipOverlays(ships, boardType === 'player')}
            {!showShips && renderShipOverlays(ships, false)}

            {/* Cells */}
            <div className="relative" style={{ zIndex: 10 }}>
              {Array.from({ length: BOARD_SIZE }, (_, row) => (
                <div key={row} className="flex">
                  {Array.from({ length: BOARD_SIZE }, (_, col) =>
                    renderCell(board[row][col], row, col, boardType, preview)
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Computed stats
  const playerMisses = playerShots - playerHits;
  const aiMisses = aiShots - aiHits;
  const playerAccuracy = playerShots > 0 ? Math.round((playerHits / playerShots) * 100) : 0;
  const aiAccuracy = aiShots > 0 ? Math.round((aiHits / aiShots) * 100) : 0;
  const playerSunk = aiShips.filter(s => s.sunk).length;
  const aiSunk = playerShips.filter(s => s.sunk).length;
  const playerShipsRemaining = 5 - aiSunk;
  const aiShipsRemaining = 5 - playerSunk;

  // Stat tracker panel
  const renderStatTracker = () => {
    if (gamePhase !== 'battle' && gamePhase !== 'gameOver') return null;

    const statRow = (label: string, playerVal: number | string, aiVal: number | string, highlight?: 'player' | 'ai' | null) => (
      <div className="flex items-center text-xs py-1 border-b border-blue-800/20 last:border-b-0">
        <div className={`w-16 text-right font-mono ${
          highlight === 'player' ? 'text-green-400 font-bold' : 'text-gray-300'
        }`}>{playerVal}</div>
        <div className="flex-1 text-center text-gray-500 font-medium px-2 text-[10px] uppercase tracking-wider">{label}</div>
        <div className={`w-16 text-left font-mono ${
          highlight === 'ai' ? 'text-red-400 font-bold' : 'text-gray-300'
        }`}>{aiVal}</div>
      </div>
    );

    return (
      <div className="bg-slate-800/70 rounded-lg border border-blue-700/30 overflow-hidden" style={{ minWidth: '220px' }}>
        {/* Header */}
        <div className="bg-slate-700/50 px-3 py-2 border-b border-blue-700/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">You</span>
            <span className="text-xs text-gray-400 font-semibold">Turn {turnNumber}</span>
            <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Enemy</span>
          </div>
        </div>
        {/* Stats rows */}
        <div className="px-3 py-1">
          {statRow('Shots', playerShots, aiShots)}
          {statRow('Hits', playerHits, aiHits,
            playerHits > aiHits ? 'player' : aiHits > playerHits ? 'ai' : null
          )}
          {statRow('Misses', playerMisses, aiMisses)}
          {statRow('Accuracy', `${playerAccuracy}%`, `${aiAccuracy}%`,
            playerAccuracy > aiAccuracy ? 'player' : aiAccuracy > playerAccuracy ? 'ai' : null
          )}
          {statRow('Sunk', playerSunk, aiSunk,
            playerSunk > aiSunk ? 'player' : aiSunk > playerSunk ? 'ai' : null
          )}
          {statRow('Remaining', aiShipsRemaining, playerShipsRemaining)}
        </div>
        {/* Accuracy bars */}
        <div className="px-3 pb-2 pt-1 border-t border-blue-800/20">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] text-blue-400 w-8">You</span>
            <div className="flex-1 h-2 bg-slate-900/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${playerAccuracy}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 w-8 text-right">{playerAccuracy}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-red-400 w-8">Foe</span>
            <div className="flex-1 h-2 bg-slate-900/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${aiAccuracy}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 w-8 text-right">{aiAccuracy}%</span>
          </div>
        </div>
      </div>
    );
  };

  // Ship status panel
  const renderShipStatus = (ships: PlacedShip[], label: string) => (
    <div className="bg-slate-800/60 rounded-lg p-3 border border-blue-700/30">
      <h3 className="text-sm font-bold text-blue-300 mb-2">{label}</h3>
      <div className="space-y-1">
        {SHIP_CONFIGS.map((config, idx) => {
          const ship = ships[idx];
          const isSunk = ship?.sunk;
          const hitCount = ship ? ship.hits.filter(h => h).length : 0;

          return (
            <div key={config.name} className="flex items-center gap-2 text-xs">
              <span className={`flex-1 ${isSunk ? 'text-red-400 line-through' : 'text-gray-300'}`}>
                {config.name}
              </span>
              <div className="flex gap-0.5">
                {Array.from({ length: config.size }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm border ${
                      isSunk
                        ? 'bg-red-700 border-red-600'
                        : i < hitCount
                        ? 'bg-orange-500 border-orange-400'
                        : ship
                        ? 'bg-green-600 border-green-500'
                        : 'bg-gray-600 border-gray-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #0c1e3a 60%, #0f172a 100%)',
      }}
    >
      {/* Header */}
      <header className="py-4 px-6 border-b border-blue-800/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            {/* Classic Battleship Logo - matching box art style */}
            <div className="relative flex items-center">
              <svg
                viewBox="0 0 380 56"
                className="relative"
                style={{ height: '52px', width: 'auto' }}
              >
                <defs>
                  <linearGradient id="logoTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="45%" stopColor="#f1f5f9" />
                    <stop offset="100%" stopColor="#94a3b8" />
                  </linearGradient>
                  {/* Hexagon clip pattern */}
                  <pattern id="hexPattern" x="0" y="0" width="14" height="12" patternUnits="userSpaceOnUse">
                    <polygon points="7,0 14,3.5 14,8.5 7,12 0,8.5 0,3.5" fill="none" stroke="#60a5fa" strokeWidth="0.4" opacity="0.3" />
                  </pattern>
                </defs>
                {/* Hex pattern background strip */}
                <rect x="0" y="36" width="380" height="18" fill="url(#hexPattern)" opacity="0.5" />
                {/* Bottom accent line */}
                <line x1="10" y1="54" x2="370" y2="54" stroke="#1e40af" strokeWidth="2" opacity="0.4" />
                {/* Shadow */}
                <text
                  x="192" y="42"
                  textAnchor="middle"
                  fill="#020617"
                  style={{
                    fontSize: '52px',
                    fontFamily: "Impact, 'Arial Black', 'Helvetica Neue', sans-serif",
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                  }}
                >
                  BATTLESHIP
                </text>
                {/* Thick navy stroke */}
                <text
                  x="190" y="40"
                  textAnchor="middle"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="8"
                  strokeLinejoin="round"
                  style={{
                    fontSize: '52px',
                    fontFamily: "Impact, 'Arial Black', 'Helvetica Neue', sans-serif",
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                  }}
                >
                  BATTLESHIP
                </text>
                {/* White/gradient fill */}
                <text
                  x="190" y="40"
                  textAnchor="middle"
                  fill="url(#logoTextGrad)"
                  style={{
                    fontSize: '52px',
                    fontFamily: "Impact, 'Arial Black', 'Helvetica Neue', sans-serif",
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                  }}
                >
                  BATTLESHIP
                </text>
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-blue-700/30 hover:bg-blue-600/40 text-blue-300 rounded-lg border border-blue-600/30 text-sm font-medium transition-colors"
            >
              New Game
            </button>
          </div>
        </div>
      </header>

      {/* Message bar */}
      <div className="py-3 px-6 bg-slate-800/30 border-b border-blue-800/20">
        <div className="max-w-7xl mx-auto text-center">
          <p
            className={`text-lg font-semibold ${
              winner === 'human'
                ? 'text-green-400'
                : winner === 'ai'
                ? 'text-red-400'
                : message.includes('hit') || message.includes('sunk')
                ? 'text-yellow-400'
                : 'text-blue-200'
            }`}
          >
            {message}
          </p>
          {!isPlayerTurn && !winner && (
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-xs text-yellow-400/60">Enemy is firing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Placement controls */}
          {gamePhase === 'placement' && (
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setOrientation(o => (o === 'horizontal' ? 'vertical' : 'horizontal'))}
                className="px-4 py-2 bg-indigo-600/40 hover:bg-indigo-500/50 text-indigo-200 rounded-lg border border-indigo-500/30 text-sm font-medium transition-colors flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2 7h12v2H2z" opacity={orientation === 'horizontal' ? 1 : 0.3} />
                  <path d="M7 2v12h2V2z" opacity={orientation === 'vertical' ? 1 : 0.3} />
                </svg>
                {orientation === 'horizontal' ? 'Horizontal' : 'Vertical'} (click to rotate)
              </button>
              <button
                onClick={handleRandomPlacement}
                className="px-4 py-2 bg-emerald-600/40 hover:bg-emerald-500/50 text-emerald-200 rounded-lg border border-emerald-500/30 text-sm font-medium transition-colors"
              >
                Random Placement
              </button>
            </div>
          )}

          {/* Boards */}
          <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
            {/* Player board */}
            <div className="flex flex-col items-center">
              <h2 className="text-sm font-bold text-blue-400 mb-3 tracking-widest uppercase">
                Your Fleet
              </h2>
              {renderBoard(playerBoard, 'player', playerShips, true)}
              <div className="mt-3 w-full">
                {renderShipStatus(playerShips, 'Your Ships')}
              </div>
            </div>

            {/* Divider / VS / Stats */}
            <div className="hidden lg:flex flex-col items-center justify-center py-8 gap-3">
              {(gamePhase === 'battle' || gamePhase === 'gameOver') ? (
                <>{renderStatTracker()}</>
              ) : (
                <>
                  <div className="w-px h-16 bg-blue-700/30" />
                  <div className="my-4 px-4 py-2 rounded-full bg-slate-800/50 border border-blue-700/30">
                    <span className="text-blue-400 font-bold text-sm">VS</span>
                  </div>
                  <div className="w-px h-16 bg-blue-700/30" />
                </>
              )}
            </div>

            {/* Mobile stat tracker */}
            {(gamePhase === 'battle' || gamePhase === 'gameOver') && (
              <div className="lg:hidden w-full flex justify-center my-4">
                {renderStatTracker()}
              </div>
            )}

            {/* Enemy board */}
            <div className="flex flex-col items-center">
              <h2 className="text-sm font-bold text-red-400 mb-3 tracking-widest uppercase">
                Enemy Waters
              </h2>
              {renderBoard(
                playerViewBoard,
                'enemy',
                aiShips,
                gamePhase === 'gameOver'
              )}
              <div className="mt-3 w-full">
                {renderShipStatus(
                  aiShips.map(s => {
                    // Only show hits/sunk info the player knows about
                    if (gamePhase === 'gameOver') return s;
                    return {
                      ...s,
                      hits: s.hits.map((h, i) => {
                        const pos = s.positions[i];
                        const viewCell = playerViewBoard[pos.row][pos.col];
                        return viewCell.state === 'hit' || viewCell.state === 'sunk' ? h : false;
                      }),
                      sunk: s.sunk,
                    };
                  }),
                  'Enemy Ships'
                )}
              </div>
            </div>
          </div>

          {/* Game Over */}
          {gamePhase === 'gameOver' && (
            <div className="mt-8 text-center">
              <div
                className={`inline-block px-8 py-4 rounded-xl border ${
                  winner === 'human'
                    ? 'bg-green-900/30 border-green-500/30'
                    : 'bg-red-900/30 border-red-500/30'
                }`}
              >
                <h2
                  className={`text-3xl font-bold mb-2 ${
                    winner === 'human' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {winner === 'human' ? 'VICTORY!' : 'DEFEAT!'}
                </h2>
                <div className="text-sm text-gray-400 space-y-1">
                  <p>
                    Your accuracy: {playerShots > 0 ? Math.round((playerHits / playerShots) * 100) : 0}%
                    ({playerHits}/{playerShots})
                  </p>
                  <p>
                    Enemy accuracy: {aiShots > 0 ? Math.round((aiHits / aiShots) * 100) : 0}%
                    ({aiHits}/{aiShots})
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 px-6 border-t border-blue-800/20 text-center">
        <p className="text-xs text-gray-500">
          Battleship &mdash; Classic Naval Combat Game
        </p>
      </footer>
    </div>
  );
}

export default App
