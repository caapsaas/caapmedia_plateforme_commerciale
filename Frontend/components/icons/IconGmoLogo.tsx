
import React from 'react';

const IconGmoLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      {/* Gradient for the outer ring */}
      <linearGradient id="logo-ring-gradient" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="#1eff00" />
        <stop offset="100%" stopColor="#a5ff00" />
      </linearGradient>
      
      {/* Gradient for the inner circle, simulating a cone reflection */}
      <radialGradient id="logo-center-gradient" cx="0.5" cy="0.5" r="0.65" fx="0.55" fy="0.35">
        <stop offset="0%" stopColor="#d4ff00" />
        <stop offset="100%" stopColor="#948b94" />
      </radialGradient>
    </defs>

    {/* Outer Ring */}
    <circle cx="50" cy="50" r="50" fill="url(#logo-ring-gradient)" />
    
    {/* Inner Circle */}
    <circle cx="50" cy="50" r="42" fill="url(#logo-center-gradient)" />

    {/* The Letter 'C' */}
    <text
      x="50"
      y="68"
      fontFamily="serif"
      fontSize="55"
      fill="#00dd00"
      textAnchor="middle"
      fontWeight="bold"
    >
      C
    </text>
  </svg>
);

export default IconGmoLogo;
