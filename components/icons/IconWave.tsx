import React from 'react';

const IconWave: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <rect width="24" height="24" rx="4" fill="#48D196"/>
    <path d="M5 12.5C5.833 11.167 8.6 8 12 8S18.167 11.167 19 12.5c-.833 1.333-3.6 4.5-7 4.5S5.833 13.833 5 12.5Z" fill="#fff"/>
  </svg>
);

export default IconWave;
