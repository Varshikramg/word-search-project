import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

function LevelSelect({ onSelectLevel }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to login if not authenticated when component mounts
  useEffect(() => {
    if (!currentUser && !onSelectLevel) {
      navigate('/login');
    }
  }, [currentUser, navigate, onSelectLevel]);

  const levels = [
    { id: 'easy', name: 'Easy', description: 'Horizontal and Vertical words only. 8x8 grid.' },
    { id: 'medium', name: 'Medium', description: 'Horizontal, Vertical and Diagonal words. 10x10 grid.' },
    { id: 'hard', name: 'Hard', description: 'All directions including backwards. 12x12 grid.' }
  ];

  // Handle level selection based on how the component is being used
  const handleLevelSelect = (levelId) => {
    if (onSelectLevel) {
      // If used inside Game.js, call the provided prop function
      onSelectLevel(levelId);
    } else {
      // If used as a standalone route component, navigate to the game
      navigate(`/game/${levelId}`);
    }
  };

  // Show loading while checking authentication
  if (!currentUser && !onSelectLevel) {
    return <div>Loading...</div>;
  }

  console.log("LevelSelect render state:", { 
    isAuthenticated: !!currentUser, 
    hasSelectProp: !!onSelectLevel,
    levels
  });

  return (
    <div className="level-select">
      <h2>Select Difficulty Level</h2>
      <div className="level-options">
        {levels.map((level, index) => (
          <motion.div 
            key={level.id}
            className="level-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleLevelSelect(level.id)}
          >
            <h3>{level.name}</h3>
            <p>{level.description}</p>
          </motion.div>
        ))}
        
        <motion.div 
          className="level-card versus"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/versus')}
        >
          <h3>Versus</h3>
          <p>Play against another player</p>
        </motion.div>
      </div>
    </div>
  );
}

export default LevelSelect;