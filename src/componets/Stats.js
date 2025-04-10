// src/components/Stats.js
import React from 'react';
import { useStats } from '../contexts/StatsContext';
import { motion } from 'framer-motion';

function formatTime(seconds) {
  if (seconds === null) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function Stats() {
  const { gameStats, resetStats } = useStats();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="stats-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h2>Game Statistics</h2>
      
      <div className="stats-grid">
        {['easy', 'medium', 'hard'].map((level) => (
          <motion.div 
            key={level} 
            className="stats-card"
            variants={itemVariants}
          >
            <h3>{level.charAt(0).toUpperCase() + level.slice(1)} Level</h3>
            <div className="stats-details">
              <div className="stat-item">
                <span className="stat-label">Games Played:</span>
                <span className="stat-value">{gameStats[level].gamesPlayed}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Best Time:</span>
                <span className="stat-value">{formatTime(gameStats[level].bestTime)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Average Time:</span>
                <span className="stat-value">{formatTime(Math.round(gameStats[level].averageTime))}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Words Found:</span>
                <span className="stat-value">{gameStats[level].wordsFound}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">High Score:</span>
                <span className="stat-value">{gameStats[level].highScore}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <button className="reset-stats-btn" onClick={resetStats}>
        Reset Statistics
      </button>
    </motion.div>
  );
}

export default Stats;