"use client";

type MascotMode = "neutral" | "peeking" | "away";

interface InteractiveMascotProps {
  mode: MascotMode;
}

interface Point {
  x: number;
  y: number;
}

const VIEWBOX = { width: 260, height: 210 };
const LEFT_EYE_CENTER: Point = { x: 102, y: 116 };
const RIGHT_EYE_CENTER: Point = { x: 158, y: 116 };

export function InteractiveMascot({ mode }: InteractiveMascotProps) {
  const leftOffset =
    mode === "away" ? { x: -8, y: -8 } : mode === "peeking" ? { x: -8, y: 0 } : { x: 0, y: 0 };
  const rightOffset =
    mode === "away" ? { x: 8, y: -8 } : mode === "peeking" ? { x: -8, y: 0 } : { x: 0, y: 0 };

  return (
    <div className="w-full max-w-[260px]">
      <svg
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        className="h-auto w-full drop-shadow-[0_16px_40px_rgba(15,23,42,0.28)]"
        role="img"
        aria-label="Friendly fox login mascot"
      >
        <defs>
          <linearGradient id="foxFace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="58%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#9a3412" />
          </linearGradient>
          <linearGradient id="foxHighlight" x1="18%" y1="10%" x2="82%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="foxEarOuter" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#9a3412" />
          </linearGradient>
          <linearGradient id="foxEarInner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff7ed" />
            <stop offset="100%" stopColor="#fed7aa" />
          </linearGradient>
          <linearGradient id="eyeRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <radialGradient id="noseShade" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#111827" />
          </radialGradient>
        </defs>

        <path d="M70 60L88 18L106 60Z" fill="url(#foxEarOuter)" />
        <path d="M154 60L172 18L190 60Z" fill="url(#foxEarOuter)" />
        <path d="M76 56L88 30L100 56Z" fill="url(#foxEarInner)" />
        <path d="M160 56L172 30L184 56Z" fill="url(#foxEarInner)" />

        <path
          d="M48 122C48 75 83 44 130 44C177 44 212 75 212 122C212 165 180 192 130 192C80 192 48 165 48 122Z"
          fill="url(#foxFace)"
        />
        <path
          d="M48 122C48 75 83 44 130 44C177 44 212 75 212 122C212 165 180 192 130 192C80 192 48 165 48 122Z"
          fill="url(#foxHighlight)"
        />

        <path
          d="M80 130C80 105 99 86 124 86H136C161 86 180 105 180 130C180 151 164 168 143 168H117C96 168 80 151 80 130Z"
          fill="#fff7ed"
        />

        <circle cx={LEFT_EYE_CENTER.x} cy={LEFT_EYE_CENTER.y} r="24" fill="url(#eyeRing)" />
        <circle cx={RIGHT_EYE_CENTER.x} cy={RIGHT_EYE_CENTER.y} r="24" fill="url(#eyeRing)" />
        <circle cx={LEFT_EYE_CENTER.x} cy={LEFT_EYE_CENTER.y} r="18" fill="#ffffff" />
        <circle cx={RIGHT_EYE_CENTER.x} cy={RIGHT_EYE_CENTER.y} r="18" fill="#ffffff" />

        <circle
          cx={LEFT_EYE_CENTER.x + leftOffset.x}
          cy={LEFT_EYE_CENTER.y + leftOffset.y}
          r="8"
          fill="#0f172a"
        />
        <circle
          cx={RIGHT_EYE_CENTER.x + rightOffset.x}
          cy={RIGHT_EYE_CENTER.y + rightOffset.y}
          r="8"
          fill="#0f172a"
        />

        <circle
          cx={LEFT_EYE_CENTER.x + leftOffset.x + 2.8}
          cy={LEFT_EYE_CENTER.y + leftOffset.y - 2.8}
          r="2.3"
          fill="#ffffff"
        />
        <circle
          cx={RIGHT_EYE_CENTER.x + rightOffset.x + 2.8}
          cy={RIGHT_EYE_CENTER.y + rightOffset.y - 2.8}
          r="2.3"
          fill="#ffffff"
        />
        <path d="M118 145L130 158L142 145Z" fill="url(#noseShade)" />
      </svg>
    </div>
  );
}
