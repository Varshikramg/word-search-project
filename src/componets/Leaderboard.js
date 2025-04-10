import React, { useState } from 'react';
import { useStats } from '../contexts/StatsContext';
import { motion } from 'framer-motion';

function formatTime(seconds) {
  if (seconds === null) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

function Leaderboard() {
  const { gameStats } = useStats();
  const [activeLevel, setActiveLevel] = useState('easy');
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="leaderboard-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h2>Leaderboard</h2>
      
      <div className="level-tabs">
        {['easy', 'medium', 'hard'].map(level => (
          <button 
            key={level}
            className={`level-tab ${activeLevel === level ? 'active' : ''}`}
            onClick={() => setActiveLevel(level)}
          >
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </button>
        ))}
      </div>
      
      <div className="leaderboard-table-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
              <th>Time</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {gameStats[activeLevel].leaderboard.length > 0 ? (
              gameStats[activeLevel].leaderboard.map((entry, index) => (
                <motion.tr 
                  key={index}
                  variants={itemVariants}
                  className={index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}
                >
                  <td>{index + 1}</td>
                  <td>{entry.username}</td>
                  <td>{entry.score}</td>
                  <td>{formatTime(entry.time)}</td>
                  <td>{formatDate(entry.date)}</td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">No entries yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default Leaderboard;