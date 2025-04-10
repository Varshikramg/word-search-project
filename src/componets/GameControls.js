// src/components/GameControls.js
import React from 'react';
import { motion } from 'framer-motion';

function GameControls({ timer, score, isPaused, onTogglePause, onReset, level }) {
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-controls">
      <div className="game-info">
        <div className="level-badge">
          Level: <span>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
        </div>
        <div className="timer">
          Time: <span>{formatTime(timer)}</span>
        </div>
        <div className="score">
          Score: <span>{score}</span>
        </div>
      </div>
      <div className="control-buttons">
        <motion.button
          className={`pause-button ${isPaused ? 'paused' : ''}`}
          onClick={onTogglePause}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </motion.button>
        <motion.button
          className="reset-button"
          onClick={onReset}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          New Game
        </motion.button>
      </div>
    </div>
  );
}

export default GameControls;

