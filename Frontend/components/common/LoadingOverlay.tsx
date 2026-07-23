import React, { useMemo } from "react";
import { useLoading } from "../../context/LoadingContext";
import "./LoadingOverlay.css";

interface Particle {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
}

const LoadingOverlay: React.FC = () => {
  const { isLoading, label } = useLoading();

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 0.5,
    }));
  }, []);

  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-container">
        {/* Backdrop blur */}
        <div className="loading-backdrop" />

        {/* Main content */}
        <div className="loading-content">
          {/* Orbital rings */}
          <div className="orbital-system">
            <div className="orbital-ring ring-1" />
            <div className="orbital-ring ring-2" />
            <div className="orbital-ring ring-3" />

            {/* Pulsing core with logo */}
            <div className="logo-container">
              <img
                src="/CaaMedia.png"
                alt="CaapMedia"
                className="logo-image"
              />

              {/* Glow effect */}
              <div className="logo-glow" />

              {/* Pulse rings */}
              <div className="pulse-ring pulse-1" />
              <div className="pulse-ring pulse-2" />
              <div className="pulse-ring pulse-3" />
            </div>

            {/* Rotating elements */}
            <div className="rotating-dots">
              <div className="dot dot-1" />
              <div className="dot dot-2" />
              <div className="dot dot-3" />
              <div className="dot dot-4" />
            </div>
          </div>

          {/* Particles background */}
          <div className="particles-container">
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="particle"
                style={{
                  left: particle.left,
                  top: particle.top,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  animation: `float ${particle.duration}s linear ${particle.delay}s infinite`,
                }}
              />
            ))}
          </div>

          {/* Loading text */}
          <div className="loading-text">
            <h2>CaapMedia</h2>
            <div className="status-bar">
              <div className="progress-line" />
            </div>
            {label && <p className="loading-label">{label}</p>}
          </div>

          {/* Tech specs display */}
          <div className="tech-specs">
            <span className="spec-item">
              <span className="spec-dot" />
              Processing
            </span>
            <span className="spec-item">
              <span className="spec-dot" />
              Initializing
            </span>
            <span className="spec-item">
              <span className="spec-dot" />
              Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
