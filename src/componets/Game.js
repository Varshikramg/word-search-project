// src/components/Game.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import WordGrid from './WordGrid';
import WordList from './WordList';
import GameControls from './GameControls';
import LevelSelect from './LevelSelect';
import { useStats } from '../contexts/StatsContext';
import { motion, AnimatePresence } from 'framer-motion';

function Game() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [level, setLevel] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [score, setScore] = useState(0);
  const [words, setWords] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const { updateStats, gameStats } = useStats();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);
  
  // Timer logic
  useEffect(() => {
    if (gameStarted && !isPaused && !gameOver) {
      const interval = setInterval(() => {
        setTimer(prevTime => prevTime + 1);
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [gameStarted, isPaused, gameOver]);
  
  // Check for game completion
  useEffect(() => {
    if (words.length > 0 && foundWords.length === words.length && gameStarted && !gameOver) {
      // Update game state
      setGameOver(true);
      
      // Save stats when game is completed
      if (level) {
        updateStats(level, {
          timeElapsed: timer,
          score: score,
          wordsFound: foundWords.length
        });
      }
      
      // Save score or high score in localStorage as you're already doing
      const gameData = JSON.parse(localStorage.getItem('gameData') || '{}');
      const userId = currentUser.id;
      const userGameData = gameData[userId] || { totalWordsFound: 0, bestTime: {} };
      
      if (!userGameData.bestTime[level] || timer < userGameData.bestTime[level]) {
        userGameData.bestTime[level] = timer;
      }
      
      gameData[userId] = userGameData;
      localStorage.setItem('gameData', JSON.stringify(gameData));
    }
  }, [foundWords, words, gameStarted, level, timer, score, updateStats, currentUser, gameOver]);

  const startGame = (selectedLevel) => {
    setLevel(selectedLevel);
    
    // Sample word lists - in a real app, these would be more extensive
    const wordSets = {
      easy: ['CAT', 'DOG', 'BIRD', 'FISH', 'BEAR'],
      medium: ['ELEPHANT', 'GIRAFFE', 'PENGUIN', 'LEOPARD', 'KANGAROO'],
      hard: ['RHINOCEROS', 'HIPPOPOTAMUS', 'CROCODILE', 'CHAMELEON', 'ORANGUTAN']
    };
    
    setWords(wordSets[selectedLevel]);
    setFoundWords([]);
    setTimer(0);
    setScore(0);
    setGameStarted(true);
    setGameOver(false);
    setIsPaused(false);
  };
  
  const togglePause = () => {
    setIsPaused(!isPaused);
  };
  
  const resetGame = () => {
    setGameStarted(false);
    setLevel(null);
    setGameOver(false);
    setIsPaused(false);
    setTimer(0);
    setScore(0);
    setWords([]);
    setFoundWords([]);
  };
  
  const handleWordFound = (word) => {
    if (!foundWords.includes(word)) {
      setFoundWords([...foundWords, word]);
      setScore(prevScore => prevScore + word.length * 10);
    }
  };

  // Format time for display
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  if (!currentUser) {
    return <div>Loading...</div>;
  }
  
  return (
    <motion.div 
      className="game-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence mode="wait">
        {!gameStarted ? (
          <motion.div 
            key="level-select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="level-select-container"
          >
            <LevelSelect onSelectLevel={startGame} />
          </motion.div>
        ) : (
          <motion.div 
            key="game-board"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="game-board"
          >
            <GameControls 
              timer={timer} 
              score={score} 
              isPaused={isPaused} 
              onTogglePause={togglePause} 
              onReset={resetGame}
              level={level}
            />
            
            <div className="game-area">
              <div className="word-grid-container">
                <WordGrid 
                  words={words} 
                  level={level} 
                  onWordFound={handleWordFound}
                  isPaused={isPaused}
                />
                
                {/* Game over modal with completion overlay */}
                {gameOver && (
                  <div className="completion-overlay">
                    <motion.div 
                      className="game-over-modal"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h2>Game Complete!</h2>
                      <p>Time: {formatTime(timer)}</p>
                      <p>Score: {score}</p>
                      
                      {/* Add performance stats comparison */}
                      {level && gameStats && (
                        <div className="stats-comparison">
                          <h3>Your Performance</h3>
                          
                          {gameStats[level].bestTime === timer && (
                            <div className="achievement">
                              <span>🏆 New Best Time!</span>
                            </div>
                          )}
                          
                          {score > gameStats[level].highScore && score > 0 && (
                            <div className="achievement">
                              <span>🏆 New High Score!</span>
                            </div>
                          )}
                          
                          <div className="stat-comparison-item">
                            <span>Best Time:</span>
                            <span>{formatTime(gameStats[level].bestTime || 0)}</span>
                          </div>
                          
                          <div className="stat-comparison-item">
                            <span>Your Time:</span>
                            <span>{formatTime(timer)}</span>
                          </div>
                          
                          <div className="stat-comparison-item">
                            <span>High Score:</span>
                            <span>{gameStats[level].highScore}</span>
                          </div>
                          
                          <div className="stat-comparison-item">
                            <span>Your Score:</span>
                            <span>{score}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="game-over-actions">
                        <motion.button 
                          onClick={resetGame}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          Play Again
                        </motion.button>
                        
                        <motion.button 
                          onClick={() => navigate('/levels')}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          Choose Level
                        </motion.button>
                        
                        <motion.button 
                          onClick={() => navigate('/stats')}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          View Stats
                        </motion.button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
              <WordList 
                words={words} 
                foundWords={foundWords} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Game;