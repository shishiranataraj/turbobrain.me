import { useState } from "react";

export default function Penguin({ size = 120 }) {
  const [state] = useState(() =>
    Math.random() < 0.5 ? "sleeping" : "frustrated"
  );

  return (
    <div className="penguin-wrap" title={state === "sleeping" ? "zzz..." : "why won't it compile"}>
      {state === "sleeping" ? (
        <Sleeping size={size} />
      ) : (
        <Frustrated size={size} />
      )}
    </div>
  );
}

function Sleeping({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ZZZ */}
      <text x="66" y="26" fontSize="8" fill="#7c3aed" fontWeight="bold" opacity="0.5">z</text>
      <text x="73" y="19" fontSize="10" fill="#7c3aed" fontWeight="bold" opacity="0.75">z</text>
      <text x="81" y="12" fontSize="12" fill="#7c3aed" fontWeight="bold">Z</text>

      {/* Body */}
      <ellipse cx="50" cy="70" rx="26" ry="28" fill="#1a1a1a" />

      {/* White belly */}
      <ellipse cx="50" cy="73" rx="15" ry="19" fill="#f0f0f0" />

      {/* Left flipper */}
      <ellipse cx="22" cy="68" rx="7" ry="16" fill="#1a1a1a" transform="rotate(20 22 68)" />

      {/* Right flipper */}
      <ellipse cx="78" cy="68" rx="7" ry="16" fill="#1a1a1a" transform="rotate(-20 78 68)" />

      {/* Head */}
      <circle cx="50" cy="38" r="20" fill="#1a1a1a" />

      {/* White face patch */}
      <ellipse cx="50" cy="40" rx="12" ry="13" fill="#f0f0f0" />

      {/* Closed eyes — cute arcs */}
      <path d="M41 37 Q44 34 47 37" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M53 37 Q56 34 59 37" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Beak — small triangle */}
      <polygon points="50,46 46,50 54,50" fill="#f59e0b" />

      {/* Feet */}
      <ellipse cx="40" cy="97" rx="10" ry="4" fill="#f59e0b" />
      <ellipse cx="60" cy="97" rx="10" ry="4" fill="#f59e0b" />

      {/* Toe lines on feet */}
      <line x1="34" y1="95" x2="34" y2="99" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="40" y1="94" x2="40" y2="99" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="46" y1="95" x2="46" y2="99" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="54" y1="95" x2="54" y2="99" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="60" y1="94" x2="60" y2="99" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="66" y1="95" x2="66" y2="99" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function Frustrated({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Steam lines */}
      <path d="M28 12 C27 9 29 7 28 4" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M34 10 C33 7 35 5 34 2" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M40 9 C39 6 41 4 40 1" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Body */}
      <ellipse cx="50" cy="68" rx="26" ry="26" fill="#1a1a1a" />

      {/* White belly */}
      <ellipse cx="50" cy="70" rx="15" ry="17" fill="#f0f0f0" />

      {/* Left flipper — raised slightly in frustration */}
      <ellipse cx="21" cy="62" rx="7" ry="16" fill="#1a1a1a" transform="rotate(30 21 62)" />

      {/* Right flipper — raised slightly */}
      <ellipse cx="79" cy="62" rx="7" ry="16" fill="#1a1a1a" transform="rotate(-30 79 62)" />

      {/* Head */}
      <circle cx="50" cy="36" r="20" fill="#1a1a1a" />

      {/* White face patch */}
      <ellipse cx="50" cy="38" rx="12" ry="13" fill="#f0f0f0" />

      {/* Angry eyebrows */}
      <line x1="40" y1="28" x2="48" y2="32" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />
      <line x1="52" y1="32" x2="60" y2="28" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" />

      {/* Eyes — open, annoyed dots */}
      <circle cx="44" cy="36" r="3" fill="#1a1a1a" />
      <circle cx="56" cy="36" r="3" fill="#1a1a1a" />
      {/* Eye shine */}
      <circle cx="45.5" cy="34.5" r="1" fill="#fff" />
      <circle cx="57.5" cy="34.5" r="1" fill="#fff" />

      {/* Beak — small triangle, slightly open for grumbling */}
      <polygon points="50,43 46,48 54,48" fill="#f59e0b" />
      <line x1="46" y1="48" x2="54" y2="48" stroke="#d97706" strokeWidth="1.5" />

      {/* Laptop — screen lid */}
      <rect x="30" y="68" width="40" height="21" rx="2" fill="#2a2a3e" />
      {/* Screen bezel */}
      <rect x="32" y="70" width="36" height="17" rx="1" fill="#0d0d1f" />
      {/* Screen purple glow */}
      <rect x="32" y="70" width="36" height="17" rx="1" fill="#7c3aed" opacity="0.3" />
      {/* Code lines on screen */}
      <line x1="35" y1="74" x2="54" y2="74" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
      <line x1="35" y1="79" x2="47" y2="79" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <line x1="35" y1="84" x2="58" y2="84" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      {/* Hinge */}
      <rect x="30" y="89" width="40" height="2" rx="1" fill="#111128" />
      {/* Laptop base / keyboard */}
      <rect x="28" y="91" width="44" height="7" rx="2" fill="#2a2a3e" />
      <rect x="31" y="93" width="28" height="3" rx="1" fill="#1a1a2e" />
      {/* Trackpad */}
      <rect x="39" y="93" width="10" height="3" rx="1" fill="#222240" />
      {/* Bottom lip */}
      <rect x="26" y="97" width="48" height="2" rx="1" fill="#1a1a2e" />

      {/* Sweat drop */}
      <path d="M67 26 Q69 21 71 26 Q71 30 69 30 Q67 30 67 26Z" fill="#60a5fa" opacity="0.9" />

      {/* Feet */}
      <ellipse cx="40" cy="97" rx="8" ry="3" fill="#f59e0b" />
      <ellipse cx="60" cy="97" rx="8" ry="3" fill="#f59e0b" />
    </svg>
  );
}
