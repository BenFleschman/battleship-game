import React, { useId } from 'react';

interface ShipSVGProps {
  cellSize: number;
  shipSize: number;
  orientation: 'horizontal' | 'vertical';
  color?: string;
  opacity?: number;
}

// Carrier - 5 cells, large aircraft carrier with flat deck and control tower
export const CarrierSVG: React.FC<ShipSVGProps> = ({ cellSize, shipSize, orientation, color = '#4a5568', opacity = 1 }) => {
  const uid = useId();
  const gradId = `carrierGrad-${uid}`;
  const length = cellSize * shipSize;
  const width = cellSize;
  const isH = orientation === 'horizontal';
  const svgW = isH ? length : width;
  const svgH = isH ? width : length;

  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ opacity, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
      </defs>
      {isH ? (
        <g>
          {/* Hull */}
          <path d={`M ${length * 0.02} ${width * 0.5} 
            Q ${length * 0.0} ${width * 0.2} ${length * 0.08} ${width * 0.18}
            L ${length * 0.92} ${width * 0.15}
            Q ${length * 1.0} ${width * 0.3} ${length * 0.98} ${width * 0.5}
            Q ${length * 1.0} ${width * 0.7} ${length * 0.92} ${width * 0.82}
            L ${length * 0.08} ${width * 0.82}
            Q ${length * 0.0} ${width * 0.8} ${length * 0.02} ${width * 0.5} Z`}
            fill={`url(#${gradId})`} stroke="#1f2937" strokeWidth="1.5" />
          {/* Flight deck */}
          <rect x={length * 0.1} y={width * 0.22} width={length * 0.78} height={width * 0.56} rx="2" fill="#6b7280" stroke="#4b5563" strokeWidth="0.5" />
          {/* Deck lines */}
          <line x1={length * 0.15} y1={width * 0.5} x2={length * 0.85} y2={width * 0.5} stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="4 3" />
          {/* Control tower */}
          <rect x={length * 0.55} y={width * 0.12} width={length * 0.12} height={width * 0.25} rx="1" fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <rect x={length * 0.56} y={width * 0.08} width={length * 0.1} height={width * 0.06} rx="1" fill="#4b5563" />
          {/* Antenna */}
          <line x1={length * 0.61} y1={width * 0.08} x2={length * 0.61} y2={width * 0.02} stroke="#9ca3af" strokeWidth="0.8" />
          {/* Bow mark */}
          <path d={`M ${length * 0.04} ${width * 0.5} L ${length * 0.1} ${width * 0.35} L ${length * 0.1} ${width * 0.65} Z`} fill="#374151" opacity="0.5" />
        </g>
      ) : (
        <g>
          <path d={`M ${width * 0.5} ${length * 0.02}
            Q ${width * 0.2} ${length * 0.0} ${width * 0.18} ${length * 0.08}
            L ${width * 0.15} ${length * 0.92}
            Q ${width * 0.3} ${length * 1.0} ${width * 0.5} ${length * 0.98}
            Q ${width * 0.7} ${length * 1.0} ${width * 0.82} ${length * 0.92}
            L ${width * 0.82} ${length * 0.08}
            Q ${width * 0.8} ${length * 0.0} ${width * 0.5} ${length * 0.02} Z`}
            fill={`url(#${gradId})`} stroke="#1f2937" strokeWidth="1.5" />
          <rect x={width * 0.22} y={length * 0.1} width={width * 0.56} height={length * 0.78} rx="2" fill="#6b7280" stroke="#4b5563" strokeWidth="0.5" />
          <line x1={width * 0.5} y1={length * 0.15} x2={width * 0.5} y2={length * 0.85} stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="4 3" />
          <rect x={width * 0.12} y={length * 0.55} width={width * 0.25} height={length * 0.12} rx="1" fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <rect x={width * 0.08} y={length * 0.56} width={width * 0.06} height={length * 0.1} rx="1" fill="#4b5563" />
          <line x1={width * 0.08} y1={length * 0.61} x2={width * 0.02} y2={length * 0.61} stroke="#9ca3af" strokeWidth="0.8" />
        </g>
      )}
    </svg>
  );
};

// Battleship - 4 cells, classic warship with gun turrets
export const BattleshipSVG: React.FC<ShipSVGProps> = ({ cellSize, shipSize, orientation, color = '#1e40af', opacity = 1 }) => {
  const uid = useId();
  const gradId = `battleshipGrad-${uid}`;
  const length = cellSize * shipSize;
  const width = cellSize;
  const isH = orientation === 'horizontal';
  const svgW = isH ? length : width;
  const svgH = isH ? width : length;

  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ opacity, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
      </defs>
      {isH ? (
        <g>
          {/* Hull */}
          <path d={`M ${length * 0.03} ${width * 0.5}
            Q ${length * 0.0} ${width * 0.25} ${length * 0.1} ${width * 0.2}
            L ${length * 0.88} ${width * 0.18}
            Q ${length * 1.0} ${width * 0.35} ${length * 0.97} ${width * 0.5}
            Q ${length * 1.0} ${width * 0.65} ${length * 0.88} ${width * 0.8}
            L ${length * 0.1} ${width * 0.8}
            Q ${length * 0.0} ${width * 0.75} ${length * 0.03} ${width * 0.5} Z`}
            fill={`url(#${gradId})`} stroke="#1e3a5f" strokeWidth="1.5" />
          {/* Superstructure */}
          <rect x={length * 0.35} y={width * 0.2} width={length * 0.3} height={width * 0.25} rx="2" fill="#2563eb" stroke="#1e3a5f" strokeWidth="0.5" />
          {/* Bridge */}
          <rect x={length * 0.42} y={width * 0.12} width={length * 0.16} height={width * 0.12} rx="1" fill="#1d4ed8" stroke="#1e3a5f" strokeWidth="0.5" />
          {/* Mast */}
          <line x1={length * 0.5} y1={width * 0.12} x2={length * 0.5} y2={width * 0.04} stroke="#6b7280" strokeWidth="1" />
          {/* Forward turrets */}
          <circle cx={length * 0.18} cy={width * 0.48} r={width * 0.1} fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <line x1={length * 0.18} y1={width * 0.48} x2={length * 0.08} y2={width * 0.48} stroke="#374151" strokeWidth="2" />
          <circle cx={length * 0.3} cy={width * 0.48} r={width * 0.1} fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <line x1={length * 0.3} y1={width * 0.48} x2={length * 0.2} y2={width * 0.48} stroke="#374151" strokeWidth="2" />
          {/* Aft turrets */}
          <circle cx={length * 0.75} cy={width * 0.48} r={width * 0.1} fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <line x1={length * 0.75} y1={width * 0.48} x2={length * 0.85} y2={width * 0.48} stroke="#374151" strokeWidth="2" />
          <circle cx={length * 0.87} cy={width * 0.48} r={width * 0.1} fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <line x1={length * 0.87} y1={width * 0.48} x2={length * 0.95} y2={width * 0.48} stroke="#374151" strokeWidth="2" />
        </g>
      ) : (
        <g>
          <path d={`M ${width * 0.5} ${length * 0.03}
            Q ${width * 0.25} ${length * 0.0} ${width * 0.2} ${length * 0.1}
            L ${width * 0.18} ${length * 0.88}
            Q ${width * 0.35} ${length * 1.0} ${width * 0.5} ${length * 0.97}
            Q ${width * 0.65} ${length * 1.0} ${width * 0.8} ${length * 0.88}
            L ${width * 0.8} ${length * 0.1}
            Q ${width * 0.75} ${length * 0.0} ${width * 0.5} ${length * 0.03} Z`}
            fill={`url(#${gradId})`} stroke="#1e3a5f" strokeWidth="1.5" />
          <rect x={width * 0.2} y={length * 0.35} width={width * 0.25} height={length * 0.3} rx="2" fill="#2563eb" stroke="#1e3a5f" strokeWidth="0.5" />
          <rect x={width * 0.12} y={length * 0.42} width={width * 0.12} height={length * 0.16} rx="1" fill="#1d4ed8" stroke="#1e3a5f" strokeWidth="0.5" />
          <line x1={width * 0.12} y1={length * 0.5} x2={width * 0.04} y2={length * 0.5} stroke="#6b7280" strokeWidth="1" />
          <circle cx={width * 0.48} cy={length * 0.18} r={width * 0.1} fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <line x1={width * 0.48} y1={length * 0.18} x2={width * 0.48} y2={length * 0.08} stroke="#374151" strokeWidth="2" />
          <circle cx={width * 0.48} cy={length * 0.3} r={width * 0.1} fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <line x1={width * 0.48} y1={length * 0.3} x2={width * 0.48} y2={length * 0.2} stroke="#374151" strokeWidth="2" />
          <circle cx={width * 0.48} cy={length * 0.75} r={width * 0.1} fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <line x1={width * 0.48} y1={length * 0.75} x2={width * 0.48} y2={length * 0.85} stroke="#374151" strokeWidth="2" />
          <circle cx={width * 0.48} cy={length * 0.87} r={width * 0.1} fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <line x1={width * 0.48} y1={length * 0.87} x2={width * 0.48} y2={length * 0.95} stroke="#374151" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
};

// Cruiser - 3 cells, sleek warship
export const CruiserSVG: React.FC<ShipSVGProps> = ({ cellSize, shipSize, orientation, color = '#065f46', opacity = 1 }) => {
  const uid = useId();
  const gradId = `cruiserGrad-${uid}`;
  const length = cellSize * shipSize;
  const width = cellSize;
  const isH = orientation === 'horizontal';
  const svgW = isH ? length : width;
  const svgH = isH ? width : length;

  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ opacity, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
      </defs>
      {isH ? (
        <g>
          {/* Hull - sleek */}
          <path d={`M ${length * 0.02} ${width * 0.5}
            Q ${length * 0.0} ${width * 0.28} ${length * 0.12} ${width * 0.22}
            L ${length * 0.85} ${width * 0.2}
            Q ${length * 1.0} ${width * 0.38} ${length * 0.98} ${width * 0.5}
            Q ${length * 1.0} ${width * 0.62} ${length * 0.85} ${width * 0.78}
            L ${length * 0.12} ${width * 0.78}
            Q ${length * 0.0} ${width * 0.72} ${length * 0.02} ${width * 0.5} Z`}
            fill={`url(#${gradId})`} stroke="#064e3b" strokeWidth="1.5" />
          {/* Superstructure */}
          <rect x={length * 0.35} y={width * 0.22} width={length * 0.3} height={width * 0.22} rx="2" fill="#059669" stroke="#064e3b" strokeWidth="0.5" />
          {/* Bridge */}
          <rect x={length * 0.42} y={width * 0.14} width={length * 0.16} height={width * 0.1} rx="1" fill="#047857" stroke="#064e3b" strokeWidth="0.5" />
          {/* Mast */}
          <line x1={length * 0.5} y1={width * 0.14} x2={length * 0.5} y2={width * 0.06} stroke="#6b7280" strokeWidth="0.8" />
          {/* Forward turret */}
          <circle cx={length * 0.18} cy={width * 0.48} r={width * 0.09} fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <line x1={length * 0.18} y1={width * 0.48} x2={length * 0.06} y2={width * 0.48} stroke="#374151" strokeWidth="1.8" />
          {/* Aft turret */}
          <circle cx={length * 0.82} cy={width * 0.48} r={width * 0.09} fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <line x1={length * 0.82} y1={width * 0.48} x2={length * 0.94} y2={width * 0.48} stroke="#374151" strokeWidth="1.8" />
        </g>
      ) : (
        <g>
          <path d={`M ${width * 0.5} ${length * 0.02}
            Q ${width * 0.28} ${length * 0.0} ${width * 0.22} ${length * 0.12}
            L ${width * 0.2} ${length * 0.85}
            Q ${width * 0.38} ${length * 1.0} ${width * 0.5} ${length * 0.98}
            Q ${width * 0.62} ${length * 1.0} ${width * 0.78} ${length * 0.85}
            L ${width * 0.78} ${length * 0.12}
            Q ${width * 0.72} ${length * 0.0} ${width * 0.5} ${length * 0.02} Z`}
            fill={`url(#${gradId})`} stroke="#064e3b" strokeWidth="1.5" />
          <rect x={width * 0.22} y={length * 0.35} width={width * 0.22} height={length * 0.3} rx="2" fill="#059669" stroke="#064e3b" strokeWidth="0.5" />
          <rect x={width * 0.14} y={length * 0.42} width={width * 0.1} height={length * 0.16} rx="1" fill="#047857" stroke="#064e3b" strokeWidth="0.5" />
          <line x1={width * 0.14} y1={length * 0.5} x2={width * 0.06} y2={length * 0.5} stroke="#6b7280" strokeWidth="0.8" />
          <circle cx={width * 0.48} cy={length * 0.18} r={width * 0.09} fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <line x1={width * 0.48} y1={length * 0.18} x2={width * 0.48} y2={length * 0.06} stroke="#374151" strokeWidth="1.8" />
          <circle cx={width * 0.48} cy={length * 0.82} r={width * 0.09} fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <line x1={width * 0.48} y1={length * 0.82} x2={width * 0.48} y2={length * 0.94} stroke="#374151" strokeWidth="1.8" />
        </g>
      )}
    </svg>
  );
};

// Submarine - 3 cells, rounded submarine shape
export const SubmarineSVG: React.FC<ShipSVGProps> = ({ cellSize, shipSize, orientation, color = '#7c2d12', opacity = 1 }) => {
  const uid = useId();
  const gradId = `subGrad-${uid}`;
  const length = cellSize * shipSize;
  const width = cellSize;
  const isH = orientation === 'horizontal';
  const svgW = isH ? length : width;
  const svgH = isH ? width : length;

  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ opacity, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="#450a0a" />
        </linearGradient>
      </defs>
      {isH ? (
        <g>
          {/* Hull - rounded cigar shape */}
          <ellipse cx={length * 0.5} cy={width * 0.52} rx={length * 0.48} ry={width * 0.28} fill={`url(#${gradId})`} stroke="#450a0a" strokeWidth="1.5" />
          {/* Conning tower */}
          <rect x={length * 0.4} y={width * 0.18} width={length * 0.2} height={width * 0.18} rx="3" fill="#991b1b" stroke="#450a0a" strokeWidth="0.5" />
          {/* Periscope */}
          <line x1={length * 0.5} y1={width * 0.18} x2={length * 0.5} y2={width * 0.08} stroke="#6b7280" strokeWidth="1" />
          <circle cx={length * 0.5} cy={width * 0.07} r="2" fill="#9ca3af" />
          {/* Propeller lines */}
          <line x1={length * 0.95} y1={width * 0.4} x2={length * 0.99} y2={width * 0.3} stroke="#6b7280" strokeWidth="0.8" />
          <line x1={length * 0.95} y1={width * 0.52} x2={length * 0.99} y2={width * 0.52} stroke="#6b7280" strokeWidth="0.8" />
          <line x1={length * 0.95} y1={width * 0.64} x2={length * 0.99} y2={width * 0.74} stroke="#6b7280" strokeWidth="0.8" />
          {/* Porthole dots */}
          <circle cx={length * 0.2} cy={width * 0.52} r="1.5" fill="#fca5a5" opacity="0.4" />
          <circle cx={length * 0.3} cy={width * 0.52} r="1.5" fill="#fca5a5" opacity="0.4" />
          <circle cx={length * 0.7} cy={width * 0.52} r="1.5" fill="#fca5a5" opacity="0.4" />
          <circle cx={length * 0.8} cy={width * 0.52} r="1.5" fill="#fca5a5" opacity="0.4" />
        </g>
      ) : (
        <g>
          <ellipse cx={width * 0.52} cy={length * 0.5} rx={width * 0.28} ry={length * 0.48} fill={`url(#${gradId})`} stroke="#450a0a" strokeWidth="1.5" />
          <rect x={width * 0.18} y={length * 0.4} width={width * 0.18} height={length * 0.2} rx="3" fill="#991b1b" stroke="#450a0a" strokeWidth="0.5" />
          <line x1={width * 0.18} y1={length * 0.5} x2={width * 0.08} y2={length * 0.5} stroke="#6b7280" strokeWidth="1" />
          <circle cx={width * 0.07} cy={length * 0.5} r="2" fill="#9ca3af" />
          <line x1={width * 0.4} y1={length * 0.95} x2={width * 0.3} y2={length * 0.99} stroke="#6b7280" strokeWidth="0.8" />
          <line x1={width * 0.52} y1={length * 0.95} x2={width * 0.52} y2={length * 0.99} stroke="#6b7280" strokeWidth="0.8" />
          <line x1={width * 0.64} y1={length * 0.95} x2={width * 0.74} y2={length * 0.99} stroke="#6b7280" strokeWidth="0.8" />
          <circle cx={width * 0.52} cy={length * 0.2} r="1.5" fill="#fca5a5" opacity="0.4" />
          <circle cx={width * 0.52} cy={length * 0.3} r="1.5" fill="#fca5a5" opacity="0.4" />
          <circle cx={width * 0.52} cy={length * 0.7} r="1.5" fill="#fca5a5" opacity="0.4" />
          <circle cx={width * 0.52} cy={length * 0.8} r="1.5" fill="#fca5a5" opacity="0.4" />
        </g>
      )}
    </svg>
  );
};

// Destroyer - 2 cells, small fast ship
export const DestroyerSVG: React.FC<ShipSVGProps> = ({ cellSize, shipSize, orientation, color = '#4c1d95', opacity = 1 }) => {
  const uid = useId();
  const gradId = `destroyerGrad-${uid}`;
  const length = cellSize * shipSize;
  const width = cellSize;
  const isH = orientation === 'horizontal';
  const svgW = isH ? length : width;
  const svgH = isH ? width : length;

  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ opacity, position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="#2e1065" />
        </linearGradient>
      </defs>
      {isH ? (
        <g>
          {/* Hull - sharp and fast */}
          <path d={`M ${length * 0.02} ${width * 0.5}
            Q ${length * 0.0} ${width * 0.3} ${length * 0.15} ${width * 0.24}
            L ${length * 0.82} ${width * 0.22}
            Q ${length * 1.0} ${width * 0.4} ${length * 0.98} ${width * 0.5}
            Q ${length * 1.0} ${width * 0.6} ${length * 0.82} ${width * 0.76}
            L ${length * 0.15} ${width * 0.76}
            Q ${length * 0.0} ${width * 0.7} ${length * 0.02} ${width * 0.5} Z`}
            fill={`url(#${gradId})`} stroke="#2e1065" strokeWidth="1.5" />
          {/* Bridge */}
          <rect x={length * 0.4} y={width * 0.2} width={length * 0.22} height={width * 0.2} rx="2" fill="#6d28d9" stroke="#2e1065" strokeWidth="0.5" />
          {/* Mast */}
          <line x1={length * 0.51} y1={width * 0.2} x2={length * 0.51} y2={width * 0.1} stroke="#6b7280" strokeWidth="0.8" />
          {/* Forward gun */}
          <circle cx={length * 0.2} cy={width * 0.48} r={width * 0.08} fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <line x1={length * 0.2} y1={width * 0.48} x2={length * 0.08} y2={width * 0.48} stroke="#374151" strokeWidth="1.5" />
          {/* Aft gun */}
          <circle cx={length * 0.78} cy={width * 0.48} r={width * 0.08} fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <line x1={length * 0.78} y1={width * 0.48} x2={length * 0.9} y2={width * 0.48} stroke="#374151" strokeWidth="1.5" />
          {/* Wake */}
          <path d={`M ${length * 0.96} ${width * 0.42} Q ${length * 1.02} ${width * 0.5} ${length * 0.96} ${width * 0.58}`} fill="none" stroke="#a78bfa" strokeWidth="0.5" opacity="0.5" />
        </g>
      ) : (
        <g>
          <path d={`M ${width * 0.5} ${length * 0.02}
            Q ${width * 0.3} ${length * 0.0} ${width * 0.24} ${length * 0.15}
            L ${width * 0.22} ${length * 0.82}
            Q ${width * 0.4} ${length * 1.0} ${width * 0.5} ${length * 0.98}
            Q ${width * 0.6} ${length * 1.0} ${width * 0.76} ${length * 0.82}
            L ${width * 0.76} ${length * 0.15}
            Q ${width * 0.7} ${length * 0.0} ${width * 0.5} ${length * 0.02} Z`}
            fill={`url(#${gradId})`} stroke="#2e1065" strokeWidth="1.5" />
          <rect x={width * 0.2} y={length * 0.4} width={width * 0.2} height={length * 0.22} rx="2" fill="#6d28d9" stroke="#2e1065" strokeWidth="0.5" />
          <line x1={width * 0.2} y1={length * 0.51} x2={width * 0.1} y2={length * 0.51} stroke="#6b7280" strokeWidth="0.8" />
          <circle cx={width * 0.48} cy={length * 0.2} r={width * 0.08} fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <line x1={width * 0.48} y1={length * 0.2} x2={width * 0.48} y2={length * 0.08} stroke="#374151" strokeWidth="1.5" />
          <circle cx={width * 0.48} cy={length * 0.78} r={width * 0.08} fill="#374151" stroke="#1f2937" strokeWidth="0.5" />
          <line x1={width * 0.48} y1={length * 0.78} x2={width * 0.48} y2={length * 0.9} stroke="#374151" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
};

// Component map for easy access
export const ShipSVGMap: Record<string, React.FC<ShipSVGProps>> = {
  Carrier: CarrierSVG,
  Battleship: BattleshipSVG,
  Cruiser: CruiserSVG,
  Submarine: SubmarineSVG,
  Destroyer: DestroyerSVG,
};
