import React from 'react';
import './BackgroundEmbers.css';

const BackgroundEmbers = () => {
  // Generate 40 random flakes
  const flakes = Array.from({ length: 40 });

  return (
    <div className="embers-container">
      {flakes.map((_, i) => {
        // Randomize the starting position, speed, and size for an organic look
        const randomLeft = Math.random() * 100;
        const randomDuration = Math.random() * 4 + 3; 
        const randomDelay = Math.random() * 5;
        const randomSize = Math.random() * 4 + 2;

        return (
          <div
            key={i}
            className="ember"
            style={{
              left: `${randomLeft}vw`,
              animationDuration: `${randomDuration}s`,
              animationDelay: `${randomDelay}s`,
              width: `${randomSize}px`,
              height: `${randomSize}px`,
            }}
          />
        );
      })}
    </div>
  );
};

export default BackgroundEmbers;