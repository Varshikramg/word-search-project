// src/components/Leaderboard.js
import React, { useState, useEffect, useRef } from 'react';
import { useStats } from '../contexts/StatsContext';
import { motion } from 'framer-motion';

function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function formatDate(dateString) {
  if (!dateString) return '--';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString;
  }
}

function Leaderboard() {
  const { gameStats, fetchLeaderboard } = useStats();
  const [activeLevel, setActiveLevel] = useState('easy');
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef({
    easy: false,
    medium: false,
    hard: false
  });
  
  // Fetch leaderboard data when component mounts or level changes
  useEffect(() => {
    let isMounted = true;
    
    const loadLeaderboard = async () => {
      // Only fetch if we haven't already fetched this level
      if (!fetchedRef.current[activeLevel]) {
        setLoading(true);
        try {
          console.log(`Fetching leaderboard for ${activeLevel} level...`);
          const data = await fetchLeaderboard(activeLevel);
          
          if (isMounted) {
            // Mark this level as fetched
            fetchedRef.current[activeLevel] = true;
            console.log(`Completed fetching ${activeLevel} leaderboard with ${data.length} entries`);
          }
        } catch (error) {
          console.error(`Error fetching ${activeLevel} leaderboard:`, error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      } else {
        console.log(`Using cached data for ${activeLevel} leaderboard`);
      }
    };
    
    loadLeaderboard();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [activeLevel, fetchLeaderboard]);
  
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

  // Safely get the leaderboard data
  const leaderboardData = gameStats[activeLevel]?.leaderboard || [];
  
  // Debug log
  console.log(`Rendering Leaderboard component for ${activeLevel} with ${leaderboardData.length} entries`);

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
        {loading ? (
          <div className="loading-indicator">Loading leaderboard data...</div>
        ) : (
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
              {leaderboardData && leaderboardData.length > 0 ? (
                leaderboardData.map((entry, index) => (
                  <motion.tr 
                    key={index}
                    variants={itemVariants}
                    className={index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}
                  >
                    <td>{index + 1}</td>
                    <td>{entry.username || 'Anonymous'}</td>
                    <td>{entry.score || 0}</td>
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
        )}
      </div>
    </motion.div>
  );
}

export default Leaderboard;