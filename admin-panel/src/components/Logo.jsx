import React from 'react';

export default function Logo({ size = 36, className = "" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`text-slate-100 ${className}`}
    >
      <g stroke="currentColor" strokeWidth="5.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* 5 Radial Inner Dumbbells */}
        {[0, 72, 144, 216, 288].map((deg) => (
          <g key={`inner-${deg}`} transform={`rotate(${deg} 50 50)`}>
            <path d="M 45,21 A 5,5 0 1,1 55,21 Q 52,28.5 55,36 A 5,5 0 1,1 45,36 Q 48,28.5 45,21 Z" />
          </g>
        ))}

        {/* 5 Tangential Outer Dumbbells */}
        {[36, 108, 180, 252, 324].map((deg) => (
          <g key={`outer-${deg}`} transform={`rotate(${deg} 50 50)`}>
            <path d="M 42,10 A 5,5 0 1,1 42,20 Q 50,17.5 58,20 A 5,5 0 1,1 58,10 Q 50,12.5 42,10 Z" />
          </g>
        ))}
      </g>
    </svg>
  );
}
