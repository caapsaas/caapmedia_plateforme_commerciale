import React from 'react';

const IconBell: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg 
    className={className} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 011.858 11.858l-5.586 5.586a2 2 0 01-2.828 0L12 16m0 0l7-7m-7 7v7a2 2 0 002-2h3a2 2 0 002-2V9a2 2 0 00-2-2h-3a2 2 0 00-2 2v7m0 0a9 9 0 018 0 9 9 0 01-18 0H9a9 9 0 00-18 0z" 
    />
  </svg>
);

export default IconBell;
