import { useState, useCallback, useEffect } from 'react'
import './App.css'
import { Anchor, RotateCw, Play, RefreshCw } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk'
type Phase = 'placement' | 'playing' | 'gameover'
type Board = CellState[][]

interface Ship {
  name: string
  size: number
  color: string
}

interface PlacedShip {
  ship: Ship
  cells: [number, number][]
}

// ─── Constants ───────────────────────────────────────────────────────────────
const BOARD_SIZE = 10
const SHIPS: Ship[] = [
  { name: 'Carrier', size: 5, color: '#6366f1' },
  { name: 'Battleship', size: 4, color: '#8b5cf6' },
  { name: 'Cruiser', size: 3, color: '#a855f7' },
  { name: 'Submarine', size: 3, color: '#d946ef' },
  { name: 'Destroyer', size: 2, color: '#ec4899' },
]
const ROW_LABELS = 'ABCDEFGHIJ'.split('')
const COL_LABELS = Array.from({ length: 10 }, (_, i) => String(i + 1))

// ─── Helpers ─────────────────────────────────────────────────────────────────
function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 'empty' as CellState)
  )
}

function canPlaceShip(
  board: Board,
  row: number,
  col: number,
  size: number,
  horizontal: boolean
): boolean {
  for (let i = 0; i < size; i++) {
    const r = horizontal ? row : row + i
    const c = horizontal ? col + i : col
    if (r >= BOARD_SIZE || c >= BOARD_SIZE) return false
    if (board[r][c] !== 'empty') return false
  }
  return true
}

function getShipCells(
  row: number,
  col: number,
  size: number,
  horizontal: boolean
): [number, number][] {
  const cells: [number, number][] = []
  for (let i = 0; i < size; i++) {
    const r = horizontal ? row : row + i
    const c = horizontal ? col + i : col
    if (r < BOARD_SIZE && c < BOARD_SIZE) {
      cells.push([r, c])
    }
  }
  return cells
}

function placeShipOnBoard(
  board: Board,
  cells: [number, number][]
): Board {
  const newBoard = board.map(row => [...row])
  cells.forEach(([r, c]) => {
    newBoard[r][c] = 'ship'
  })
  return newBoard
}

function randomPlaceShips(): { board: Board; placed: PlacedShip[] } {
  let board = createEmptyBoard()
  const placed: PlacedShip[] = []
  for (const ship of SHIPS) {
    let attempts = 0
    while (attempts < 1000) {
      const horizontal = Math.random() > 0.5
      const row = Math.floor(Math.random() * BOARD_SIZE)
      const col = Math.floor(Math.random() * BOARD_SIZE)
      if (canPlaceShip(board, row, col, ship.size, horizontal)) {
        const cells = getShipCells(row, col, ship.size, horizontal)
        board = placeShipOnBoard(board, cells)
        placed.push({ ship, cells })
        break
      }
      attempts++
    }
  }
  return { board, placed }
}

function isShipSunk(shipCells: [number, number][], board: Board): boolean {
  return shipCells.every(([r, c]) => board[r][c] === 'hit' || board[r][c] === 'sunk')
}

function markSunkShip(board: Board, cells: [number, number][]): Board {
  const newBoard = board.map(row => [...row])
  cells.forEach(([r, c]) => {
    newBoard[r][c] = 'sunk'
  })
  return newBoard
}

function allShipsSunk(placed: PlacedShip[], board: Board): boolean {
  return placed.every(ps => isShipSunk(ps.cells, board))
}

// ─── AI Logic ────────────────────────────────────────────────────────────────
interface AIState {
  mode: 'hunt' | 'target'
  hitQueue: [number, number][]
}

function createAIState(): AIState {
  return {
    mode: 'hunt',
    hitQueue: [],
  }
}

function getAdjacentCells(r: number, c: number): [number, number][] {
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  return dirs
    .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
    .filter(([nr, nc]) => nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE)
}

function aiChooseTarget(
  board: Board,
  aiState: AIState
): { target: [number, number]; newAIState: AIState } {
  const state = { ...aiState, hitQueue: [...aiState.hitQueue] }

  // Target mode: try cells adjacent to hits
  while (state.hitQueue.length > 0) {
    const [hr, hc] = state.hitQueue[0]
    const adj = getAdjacentCells(hr, hc)
    const untried = adj.filter(([r, c]) => board[r][c] === 'empty' || board[r][c] === 'ship')
    if (untried.length > 0) {
      const target = untried[Math.floor(Math.random() * untried.length)]
      return { target, newAIState: { ...state, mode: 'target' } }
    }
    state.hitQueue.shift()
  }

  // Hunt mode: random targeting with checkerboard pattern for efficiency
  state.mode = 'hunt'
  const candidates: [number, number][] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if ((board[r][c] === 'empty' || board[r][c] === 'ship') && (r + c) % 2 === 0) {
        candidates.push([r, c])
      }
    }
  }
  if (candidates.length === 0) {
    // Fallback: try odd parity
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === 'empty' || board[r][c] === 'ship') {
          candidates.push([r, c])
        }
      }
    }
  }
  const target = candidates[Math.floor(Math.random() * candidates.length)]
  return { target, newAIState: state }
}

// ─── Board Component ─────────────────────────────────────────────────────────
function GameBoard({
  board,
  isEnemy,
  onCellClick,
  placedShips,
  previewCells,
  previewValid,
  onCellHover,
  onCellLeave,
  disabled,
  lastHit,
}: {
  board: Board
  isEnemy: boolean
  onCellClick?: (r: number, c: number) => void
  placedShips?: PlacedShip[]
  previewCells?: [number, number][]
  previewValid?: boolean
  onCellHover?: (r: number, c: number) => void
  onCellLeave?: () => void
  disabled?: boolean
  lastHit?: [number, number] | null
}) {
  const isPreview = (r: number, c: number) =>
    previewCells?.some(([pr, pc]) => pr === r && pc === c) ?? false

  const getShipColor = (r: number, c: number): string | null => {
    if (!placedShips) return null
    const ps = placedShips.find(p => p.cells.some(([cr, cc]) => cr === r && cc === c))
    return ps ? ps.ship.color : null
  }

  const getCellClasses = (r: number, c: number): string => {
    const state = board[r][c]
    const preview = isPreview(r, c)
    const isLast = lastHit && lastHit[0] === r && lastHit[1] === c

    let base = 'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 border border-slate-600/40 rounded-sm transition-all duration-200 flex items-center justify-center text-sm font-bold cursor-pointer'

    if (preview) {
      base += previewValid
        ? ' bg-indigo-400/50 border-indigo-400 scale-105'
        : ' bg-red-400/50 border-red-400 scale-105'
      return base
    }

    switch (state) {
      case 'empty':
        base += isEnemy
          ? ' bg-slate-800/60 hover:bg-slate-700/80 hover:scale-105'
          : ' bg-slate-800/40'
        break
      case 'ship':
        if (isEnemy) {
          base += ' bg-slate-800/60 hover:bg-slate-700/80 hover:scale-105'
        } else {
          const color = getShipColor(r, c)
          if (color) {
            base += ' border-opacity-60 shadow-inner'
          } else {
            base += ' bg-indigo-600/60 border-indigo-400/60'
          }
        }
        break
      case 'hit':
        base += ' bg-red-600/80 border-red-500'
        if (isLast) base += ' animate-pulse'
        break
      case 'miss':
        base += ' bg-slate-600/40 border-slate-500/40'
        break
      case 'sunk':
        base += ' bg-red-900/80 border-red-700'
        break
    }

    if (disabled) base += ' cursor-not-allowed opacity-75'

    return base
  }

  const getCellContent = (r: number, c: number) => {
    const state = board[r][c]
    if (state === 'hit') return <span className="text-yellow-300 drop-shadow-lg">🔥</span>
    if (state === 'miss') return <span className="text-slate-400 text-xs">•</span>
    if (state === 'sunk') return <span className="text-red-300 drop-shadow-lg">💀</span>
    return null
  }

  return (
    <div className="inline-block">
      {/* Column labels */}
      <div className="flex ml-8 sm:ml-9 md:ml-10 mb-1">
        {COL_LABELS.map(label => (
          <div
            key={label}
            className="w-8 h-5 sm:w-9 md:w-10 flex items-center justify-center text-xs font-semibold text-slate-400"
          >
            {label}
          </div>
        ))}
      </div>
      {/* Board rows */}
      {board.map((row, r) => (
        <div key={r} className="flex">
          {/* Row label */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center text-xs font-semibold text-slate-400">
            {ROW_LABELS[r]}
          </div>
          {row.map((_, c) => (
            <div
              key={`${r}-${c}`}
              className={getCellClasses(r, c)}
              style={
                !isEnemy && board[r][c] === 'ship' && getShipColor(r, c)
                  ? { backgroundColor: getShipColor(r, c)! + '99' }
                  : undefined
              }
              onClick={() => !disabled && onCellClick?.(r, c)}
              onMouseEnter={() => onCellHover?.(r, c)}
              onMouseLeave={() => onCellLeave?.()}
            >
              {getCellContent(r, c)}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Ship List Component ─────────────────────────────────────────────────────
function ShipList({
  ships,
  placedShips,
  currentIndex,
  isPlacement,
  sunkTracker,
}: {
  ships: Ship[]
  placedShips: PlacedShip[]
  currentIndex?: number
  isPlacement?: boolean
  sunkTracker?: boolean[]
}) {
  return (
    <div className="space-y-1.5">
      {ships.map((ship, i) => {
        const isPlaced = placedShips.some(ps => ps.ship.name === ship.name)
        const isCurrent = isPlacement && currentIndex === i
        const isSunk = sunkTracker?.[i] ?? false
        return (
          <div
            key={ship.name}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm ${
              isCurrent
                ? 'bg-indigo-500/20 border border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                : isSunk
                ? 'bg-red-900/30 border border-red-700/30 opacity-60'
                : isPlaced
                ? 'bg-slate-700/30 border border-slate-600/20'
                : 'bg-slate-800/30 border border-slate-700/20 opacity-50'
            }`}
          >
            <div className="flex gap-0.5">
              {Array.from({ length: ship.size }).map((_, j) => (
                <div
                  key={j}
                  className={`w-4 h-4 rounded-sm ${isSunk ? 'bg-red-800/60' : ''}`}
                  style={!isSunk ? { backgroundColor: ship.color + (isPlaced || isCurrent ? 'cc' : '44') } : undefined}
                />
              ))}
            </div>
            <span className={`font-medium ${isSunk ? 'line-through text-red-400/60' : 'text-slate-300'}`}>
              {ship.name}
            </span>
            {isSunk && <span className="text-red-400 text-xs ml-auto">SUNK</span>}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────────────────
function App() {
  // Game state
  const [phase, setPhase] = useState<Phase>('placement')
  const [playerBoard, setPlayerBoard] = useState<Board>(createEmptyBoard)
  const [enemyBoard, setEnemyBoard] = useState<Board>(createEmptyBoard)
  const [playerShips, setPlayerShips] = useState<PlacedShip[]>([])
  const [enemyShips, setEnemyShips] = useState<PlacedShip[]>([])
  const [currentShipIndex, setCurrentShipIndex] = useState(0)
  const [horizontal, setHorizontal] = useState(true)
  const [previewCells, setPreviewCells] = useState<[number, number][]>([])
  const [previewValid, setPreviewValid] = useState(false)
  const [playerTurn, setPlayerTurn] = useState(true)
  const [message, setMessage] = useState('Place your Carrier (5 cells)')
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null)
  const [aiState, setAiState] = useState<AIState>(createAIState)
  const [playerLastHit, setPlayerLastHit] = useState<[number, number] | null>(null)
  const [enemyLastHit, setEnemyLastHit] = useState<[number, number] | null>(null)
  const [playerSunkTracker, setPlayerSunkTracker] = useState<boolean[]>(SHIPS.map(() => false))
  const [enemySunkTracker, setEnemySunkTracker] = useState<boolean[]>(SHIPS.map(() => false))
  const [stats, setStats] = useState({ playerShots: 0, playerHits: 0, aiShots: 0, aiHits: 0 })
  const [aiTurnTrigger, setAiTurnTrigger] = useState(0)

  // ─── Placement ───────────────────────────────────────────────────────────
  const handlePlacementHover = useCallback(
    (r: number, c: number) => {
      if (phase !== 'placement' || currentShipIndex >= SHIPS.length) return
      const ship = SHIPS[currentShipIndex]
      const cells = getShipCells(r, c, ship.size, horizontal)
      const valid = canPlaceShip(playerBoard, r, c, ship.size, horizontal)
      setPreviewCells(cells)
      setPreviewValid(valid)
    },
    [phase, currentShipIndex, horizontal, playerBoard]
  )

  const handlePlacementLeave = useCallback(() => {
    setPreviewCells([])
  }, [])

  const handlePlacementClick = useCallback(
    (r: number, c: number) => {
      if (phase !== 'placement' || currentShipIndex >= SHIPS.length) return
      const ship = SHIPS[currentShipIndex]
      if (!canPlaceShip(playerBoard, r, c, ship.size, horizontal)) return
      const cells = getShipCells(r, c, ship.size, horizontal)
      const newBoard = placeShipOnBoard(playerBoard, cells)
      const newPlaced = [...playerShips, { ship, cells }]
      setPlayerBoard(newBoard)
      setPlayerShips(newPlaced)
      setPreviewCells([])

      const nextIndex = currentShipIndex + 1
      setCurrentShipIndex(nextIndex)
      if (nextIndex < SHIPS.length) {
        setMessage(`Place your ${SHIPS[nextIndex].name} (${SHIPS[nextIndex].size} cells)`)
      } else {
        setMessage('All ships placed! Click "Start Battle" to begin.')
      }
    },
    [phase, currentShipIndex, horizontal, playerBoard, playerShips]
  )

  const handleRandomPlacement = useCallback(() => {
    const { board, placed } = randomPlaceShips()
    setPlayerBoard(board)
    setPlayerShips(placed)
    setCurrentShipIndex(SHIPS.length)
    setPreviewCells([])
    setMessage('Ships randomly placed! Click "Start Battle" to begin.')
  }, [])

  const handleStartGame = useCallback(() => {
    if (playerShips.length < SHIPS.length) return
    const { board, placed } = randomPlaceShips()
    setEnemyBoard(board)
    setEnemyShips(placed)
    setPhase('playing')
    setPlayerTurn(true)
    setMessage('Your turn! Click on the enemy board to fire.')
  }, [playerShips])

  // ─── Attack ──────────────────────────────────────────────────────────────
  const handlePlayerAttack = useCallback(
    (r: number, c: number) => {
      if (phase !== 'playing' || !playerTurn) return
      if (enemyBoard[r][c] === 'hit' || enemyBoard[r][c] === 'miss' || enemyBoard[r][c] === 'sunk') return

      let newBoard = enemyBoard.map(row => [...row])
      const wasShip = newBoard[r][c] === 'ship'
      newBoard[r][c] = wasShip ? 'hit' : 'miss'
      setStats(prev => ({
        ...prev,
        playerShots: prev.playerShots + 1,
        playerHits: prev.playerHits + (wasShip ? 1 : 0),
      }))
      setPlayerLastHit(wasShip ? [r, c] : null)

      // Check for sunk ships
      const newSunkTracker = [...enemySunkTracker]
      let sunkShipName: string | null = null
      if (wasShip) {
        enemyShips.forEach((ps, idx) => {
          if (!newSunkTracker[idx] && isShipSunk(ps.cells, newBoard)) {
            newBoard = markSunkShip(newBoard, ps.cells)
            newSunkTracker[idx] = true
            sunkShipName = ps.ship.name
          }
        })
      }
      setEnemySunkTracker(newSunkTracker)
      setEnemyBoard(newBoard)

      if (allShipsSunk(enemyShips, newBoard)) {
        setPhase('gameover')
        setWinner('player')
        setMessage('Victory! You sank all enemy ships! 🎉')
        return
      }

      if (wasShip) {
        setMessage(sunkShipName ? `You sunk the enemy's ${sunkShipName}! Fire again!` : 'Direct hit! Fire again!')
      } else {
        setMessage("Miss! Enemy's turn...")
        setPlayerTurn(false)
      }
    },
    [phase, playerTurn, enemyBoard, enemyShips, enemySunkTracker]
  )

  // ─── AI Turn ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || playerTurn) return

    const timeout = setTimeout(() => {
      const { target, newAIState } = aiChooseTarget(playerBoard, aiState)
      if (!target) return

      const [r, c] = target
      let newBoard = playerBoard.map(row => [...row])
      const wasShip = newBoard[r][c] === 'ship'
      newBoard[r][c] = wasShip ? 'hit' : 'miss'
      setStats(prev => ({
        ...prev,
        aiShots: prev.aiShots + 1,
        aiHits: prev.aiHits + (wasShip ? 1 : 0),
      }))
      setEnemyLastHit(wasShip ? [r, c] : null)

      let updatedAIState = { ...newAIState }
      if (wasShip) {
        updatedAIState.hitQueue = [...updatedAIState.hitQueue, [r, c]]
        updatedAIState.mode = 'target'
      }

      // Check for sunk ships
      const newSunkTracker = [...playerSunkTracker]
      let sunkShipName: string | null = null
      if (wasShip) {
        playerShips.forEach((ps, idx) => {
          if (!newSunkTracker[idx] && isShipSunk(ps.cells, newBoard)) {
            newBoard = markSunkShip(newBoard, ps.cells)
            newSunkTracker[idx] = true
            sunkShipName = ps.ship.name
            // Remove sunk ship cells from hitQueue
            updatedAIState.hitQueue = updatedAIState.hitQueue.filter(
              ([hr, hc]) => !ps.cells.some(([sr, sc]) => sr === hr && sc === hc)
            )
          }
        })
      }
      setPlayerSunkTracker(newSunkTracker)
      setPlayerBoard(newBoard)
      setAiState(updatedAIState)

      if (allShipsSunk(playerShips, newBoard)) {
        setPhase('gameover')
        setWinner('ai')
        setMessage('Defeat! The AI sank all your ships. 💥')
        return
      }

      if (wasShip) {
        setMessage(sunkShipName ? `Enemy sunk your ${sunkShipName}! Enemy fires again...` : `Enemy hit your ship at ${ROW_LABELS[r]}${c + 1}! Enemy fires again...`)
        setAiTurnTrigger(prev => prev + 1)
      } else {
        setMessage(`Enemy missed at ${ROW_LABELS[r]}${c + 1}. Your turn!`)
        setPlayerTurn(true)
      }
    }, 800)

    return () => clearTimeout(timeout)
  }, [phase, playerTurn, playerBoard, aiState, playerShips, playerSunkTracker, aiTurnTrigger])

  // ─── Reset ───────────────────────────────────────────────────────────────
  const handleReset = () => {
    setPhase('placement')
    setPlayerBoard(createEmptyBoard())
    setEnemyBoard(createEmptyBoard())
    setPlayerShips([])
    setEnemyShips([])
    setCurrentShipIndex(0)
    setHorizontal(true)
    setPreviewCells([])
    setPreviewValid(false)
    setPlayerTurn(true)
    setMessage('Place your Carrier (5 cells)')
    setWinner(null)
    setAiState(createAIState())
    setPlayerLastHit(null)
    setEnemyLastHit(null)
    setPlayerSunkTracker(SHIPS.map(() => false))
    setEnemySunkTracker(SHIPS.map(() => false))
    setStats({ playerShots: 0, playerHits: 0, aiShots: 0, aiHits: 0 })
    setAiTurnTrigger(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Anchor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                BATTLESHIP
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wider">NAVAL WARFARE</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600/50 text-sm font-medium transition-all hover:scale-105"
          >
            <RefreshCw className="w-4 h-4" />
            New Game
          </button>
        </div>
      </header>

      {/* Status bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div
          className={`text-center py-3 px-6 rounded-xl font-semibold text-lg border backdrop-blur-sm ${
            winner === 'player'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : winner === 'ai'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : phase === 'playing' && playerTurn
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              : phase === 'playing'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-slate-800/50 border-slate-700/30 text-slate-300'
          }`}
        >
          {message}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Placement controls */}
        {phase === 'placement' && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <button
              onClick={() => setHorizontal(!horizontal)}
              disabled={currentShipIndex >= SHIPS.length}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-all hover:scale-105 shadow-lg shadow-indigo-600/20"
            >
              <RotateCw className="w-4 h-4" />
              {horizontal ? 'Horizontal' : 'Vertical'}
            </button>
            <button
              onClick={handleRandomPlacement}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold transition-all hover:scale-105 shadow-lg shadow-purple-600/20"
            >
              Random Placement
            </button>
            {currentShipIndex >= SHIPS.length && (
              <button
                onClick={handleStartGame}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-bold transition-all hover:scale-105 shadow-lg shadow-emerald-600/20 animate-pulse"
              >
                <Play className="w-4 h-4" />
                Start Battle!
              </button>
            )}
          </div>
        )}

        {/* Game stats */}
        {phase !== 'placement' && (
          <div className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg px-4 py-2 flex gap-4">
              <span className="text-slate-400">Your Shots: <span className="text-white font-bold">{stats.playerShots}</span></span>
              <span className="text-slate-400">Hits: <span className="text-emerald-400 font-bold">{stats.playerHits}</span></span>
              <span className="text-slate-400">Accuracy: <span className="text-indigo-400 font-bold">{stats.playerShots > 0 ? Math.round((stats.playerHits / stats.playerShots) * 100) : 0}%</span></span>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/30 rounded-lg px-4 py-2 flex gap-4">
              <span className="text-slate-400">AI Shots: <span className="text-white font-bold">{stats.aiShots}</span></span>
              <span className="text-slate-400">Hits: <span className="text-red-400 font-bold">{stats.aiHits}</span></span>
              <span className="text-slate-400">Accuracy: <span className="text-amber-400 font-bold">{stats.aiShots > 0 ? Math.round((stats.aiHits / stats.aiShots) * 100) : 0}%</span></span>
            </div>
          </div>
        )}

        {/* Boards */}
        <div className="flex flex-wrap justify-center gap-8 lg:gap-12">
          {/* Player board */}
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-bold text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              YOUR FLEET
            </h2>
            <GameBoard
              board={playerBoard}
              isEnemy={false}
              placedShips={playerShips}
              onCellClick={phase === 'placement' ? handlePlacementClick : undefined}
              previewCells={phase === 'placement' ? previewCells : undefined}
              previewValid={phase === 'placement' ? previewValid : undefined}
              onCellHover={phase === 'placement' ? handlePlacementHover : undefined}
              onCellLeave={phase === 'placement' ? handlePlacementLeave : undefined}
              lastHit={enemyLastHit}
            />
            <div className="mt-4 w-full">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Your Ships</h3>
              <ShipList
                ships={SHIPS}
                placedShips={playerShips}
                currentIndex={phase === 'placement' ? currentShipIndex : undefined}
                isPlacement={phase === 'placement'}
                sunkTracker={playerSunkTracker}
              />
            </div>
          </div>

          {/* Enemy board */}
          {phase !== 'placement' && (
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-bold text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                ENEMY WATERS
              </h2>
              <GameBoard
                board={enemyBoard}
                isEnemy={true}
                onCellClick={handlePlayerAttack}
                placedShips={enemyShips}
                disabled={!playerTurn || phase === 'gameover'}
                lastHit={playerLastHit}
              />
              <div className="mt-4 w-full">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Enemy Ships</h3>
                <ShipList
                  ships={SHIPS}
                  placedShips={enemyShips}
                  sunkTracker={enemySunkTracker}
                />
              </div>
            </div>
          )}
        </div>

        {/* Game Over overlay */}
        {phase === 'gameover' && (
          <div className="mt-8 text-center">
            <button
              onClick={handleReset}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-lg font-bold transition-all hover:scale-105 shadow-xl shadow-indigo-600/20"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/50 py-4 text-center text-xs text-slate-600">
        Battleship — Naval Warfare Simulator
      </footer>
    </div>
  )
}

export default App
