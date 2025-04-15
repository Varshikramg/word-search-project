// src/components/Stats.js - Improved version

import React, { useEffect, useState } from 'react';
import { useStats } from '../contexts/StatsContext';
import { motion } from 'framer-motion';

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60); // Ensure it's an integer
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function Stats() {
  const { gameStats, resetStats } = useStats();
  // Add state to force rerender
  const [refresh, setRefresh] = useState(0);
  
  useEffect(() => {
    // Log stats data to help debug
    console.log("Current game stats:", gameStats);
    console.log("Medium level best time:", gameStats.medium.bestTime);
    
    // Force a re-render once when component mounts
    setRefresh(prev => prev + 1);
  }, [gameStats]);

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
        {['easy', 'medium', 'hard'].map((level) => {
          const levelStats = gameStats[level] || {
            gamesPlayed: 0,
            bestTime: null,
            averageTime: 0,
            wordsFound: 0,
            highScore: 0
          };
          
          // Ensure bestTime is handled correctly
          const bestTime = levelStats.bestTime;
          console.log(`${level} best time:`, bestTime);
          
          return (
            <motion.div 
              key={level} 
              className="stats-card"
              variants={itemVariants}
            >
              <h3>{level.charAt(0).toUpperCase() + level.slice(1)} Level</h3>
              <div className="stats-details">
                <div className="stat-item">
                  <span className="stat-label">Games Played:</span>
                  <span className="stat-value">{levelStats.gamesPlayed}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Best Time:</span>
                  <span className="stat-value">{formatTime(bestTime)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Average Time:</span>
                  <span className="stat-value">{formatTime(Math.round(levelStats.averageTime))}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Words Found:</span>
                  <span className="stat-value">{levelStats.wordsFound}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">High Score:</span>
                  <span className="stat-value">{levelStats.highScore}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      <button className="reset-stats-btn" onClick={resetStats}>
        Reset Statistics
      </button>
    </motion.div>
  );
}

export default Stats;