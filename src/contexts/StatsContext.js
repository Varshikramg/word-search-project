// src/contexts/StatsContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const StatsContext = createContext();

export function useStats() {
  return useContext(StatsContext);
}

export function StatsProvider({ children }) {
  const [gameStats, setGameStats] = useState({
    easy: { 
      gamesPlayed: 0, 
      bestTime: null, 
      averageTime: 0, 
      wordsFound: 0, 
      highScore: 0,
      leaderboard: []
    },
    medium: { 
      gamesPlayed: 0, 
      bestTime: null, 
      averageTime: 0, 
      wordsFound: 0, 
      highScore: 0,
      leaderboard: []
    },
    hard: { 
      gamesPlayed: 0, 
      bestTime: null, 
      averageTime: 0, 
      wordsFound: 0, 
      highScore: 0,
      leaderboard: []
    }
  });

  const { currentUser } = useAuth();

  // Load stats from localStorage on initial render
  useEffect(() => {
    const loadStats = async () => {
      // First try to load from localStorage for offline play
      const savedStats = localStorage.getItem('wordSearchStats');
      if (savedStats) {
        setGameStats(JSON.parse(savedStats));
      }
      
      // If user is logged in, fetch from server
      if (currentUser) {
        try {
          const response = await axios.get(`http://localhost:5000/api/user/stats?userId=${currentUser.id}`);
          // Merge with any leaderboard data from localStorage
          const serverStats = response.data;
          
          // Keep local leaderboard data if server doesn't have it
          Object.keys(serverStats).forEach(level => {
            if (!serverStats[level].leaderboard && gameStats[level].leaderboard) {
              serverStats[level].leaderboard = gameStats[level].leaderboard;
            }
          });
          
          setGameStats(serverStats);
          // Update localStorage with merged data
          localStorage.setItem('wordSearchStats', JSON.stringify(serverStats));
        } catch (error) {
          console.error('Error fetching stats from server:', error);
        }
      }
    };
    
    loadStats();
  }, [currentUser]);

  // Function to update stats after a game is completed
  const updateStats = useCallback(async (level, gameData) => {
    const { timeElapsed, score, wordsFound } = gameData;
    
    // Get the current user
    const user = currentUser || {};
    const username = user.name || user.email || 'Anonymous';
    const userId = user.id || null;
    
    setGameStats(prevStats => {
      const levelStats = prevStats[level] || {
        gamesPlayed: 0,
        bestTime: null,
        averageTime: 0,
        wordsFound: 0,
        highScore: 0,
        leaderboard: []
      };
      
      const gamesPlayed = levelStats.gamesPlayed + 1;
      
      // Calculate new average time
      const totalTime = (levelStats.averageTime * levelStats.gamesPlayed) + timeElapsed;
      const averageTime = totalTime / gamesPlayed;
      
      // Determine if this is a new best time
      const currentBestTime = levelStats.bestTime === undefined ? null : levelStats.bestTime;
      const bestTime = currentBestTime === null || timeElapsed < currentBestTime 
        ? timeElapsed 
        : currentBestTime;
      
      console.log(`Updating ${level} stats - Current best time: ${currentBestTime}, New time: ${timeElapsed}, Updated best time: ${bestTime}`);
      
      // Update high score if current score is higher
      const highScore = Math.max(levelStats.highScore || 0, score);
      
      // Update total words found
      const totalWordsFound = (levelStats.wordsFound || 0) + wordsFound;
      
      // Update leaderboard (keep top 10 entries)
      const newEntry = {
        username,
        time: timeElapsed,
        score,
        date: new Date().toISOString()
      };
      
      // Ensure leaderboard exists
      const leaderboard = levelStats.leaderboard || [];
      
      const updatedLeaderboard = [...leaderboard, newEntry]
        .sort((a, b) => b.score - a.score || a.time - b.time) // Sort by score (desc) then time (asc)
        .slice(0, 10); // Keep only top 10
      
      const updatedStats = {
        ...prevStats,
        [level]: {
          gamesPlayed,
          bestTime,
          averageTime,
          wordsFound: totalWordsFound,
          highScore,
          leaderboard: updatedLeaderboard
        }
      };
      
      // Update localStorage
      localStorage.setItem('wordSearchStats', JSON.stringify(updatedStats));
      
      return updatedStats;
    });
    
    // If user is logged in, update server stats
    if (userId) {
      try {
        await axios.post('http://localhost:5000/api/stats/update', {
          userId,
          username,
          level,
          score,
          timeElapsed,
          wordsFound
        });
      } catch (error) {
        console.error('Error updating stats on server:', error);
      }
    }
  }, [currentUser]);

  // Function to fetch leaderboard data from server
  const fetchLeaderboard = useCallback(async (level) => {
    try {
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      console.log(`Fetching leaderboard for ${level} level...`);
      
      const response = await axios.get(`http://localhost:5000/api/leaderboard?level=${level}&_t=${timestamp}`);
      
      if (response.data) {
        console.log(`Received ${response.data.length} leaderboard entries:`, response.data);
        
        // Ensure the response data is an array
        const leaderboardData = Array.isArray(response.data) ? response.data : [];
        
        // Create a new object to prevent reference issues
        const updatedStats = { ...gameStats };
        if (!updatedStats[level]) {
          updatedStats[level] = {
            gamesPlayed: 0,
            bestTime: null,
            averageTime: 0,
            wordsFound: 0,
            highScore: 0,
            leaderboard: []
          };
        }
        
        // Update the leaderboard property
        updatedStats[level] = {
          ...updatedStats[level],
          leaderboard: leaderboardData
        };
        
        // Update state with the new object
        setGameStats(updatedStats);
        
        // Update localStorage
        localStorage.setItem('wordSearchStats', JSON.stringify(updatedStats));
        
        return leaderboardData;
      } else {
        console.warn(`Received empty or invalid data for ${level} leaderboard:`, response);
        return [];
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }, [gameStats]);

  const resetStats = useCallback(async () => {
    const emptyStats = {
      easy: { gamesPlayed: 0, bestTime: null, averageTime: 0, wordsFound: 0, highScore: 0, leaderboard: [] },
      medium: { gamesPlayed: 0, bestTime: null, averageTime: 0, wordsFound: 0, highScore: 0, leaderboard: [] },
      hard: { gamesPlayed: 0, bestTime: null, averageTime: 0, wordsFound: 0, highScore: 0, leaderboard: [] }
    };
    
    // Update state
    setGameStats(emptyStats);
    
    // Clear localStorage
    localStorage.removeItem('wordSearchStats');
    
    // If user is logged in, reset server stats
    if (currentUser?.id) {
      try {
        await axios.post('http://localhost:5000/api/stats/reset', {
          userId: currentUser.id
        });
        console.log("Server stats reset successful");
      } catch (error) {
        console.error('Error resetting stats on server:', error);
        // Ensure localStorage stays cleared
        localStorage.removeItem('wordSearchStats');
      }
    } else {
      console.log("No logged in user, only clearing local stats");
    }
    
    // Double-check localStorage is cleared
    if (localStorage.getItem('wordSearchStats')) {
      console.warn("LocalStorage still contains stats after reset attempt, forcing removal");
      localStorage.removeItem('wordSearchStats');
    }
    
    return true; // Indicate successful reset
  }, [currentUser]);

  const value = {
    gameStats,
    updateStats,
    resetStats,
    fetchLeaderboard
  };

  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  );
}