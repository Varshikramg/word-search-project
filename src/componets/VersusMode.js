// src/components/VersusMode.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useStats } from '../contexts/StatsContext';
import WordGrid from './WordGrid'; // Import your existing WordGrid component

// Word List component
function WordList({ title, words, foundWords }) {
  return (
    <div className="word-list">
      <h3>{title}</h3>
      <ul>
        {words.map(word => (
          <li 
            key={word} 
            className={foundWords.includes(word) ? 'found' : ''}
          >
            {word}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Main VersusMode component
function VersusMode() {
  const [words, setWords] = useState([]);
  const [playerWords, setPlayerWords] = useState([]); // Words for player grid
  const [computerWords, setComputerWords] = useState([]); // Words for computer grid
  const [playerFoundWords, setPlayerFoundWords] = useState([]);
  const [computerFoundWords, setComputerFoundWords] = useState([]);
  const [gameActive, setGameActive] = useState(true);
  const [winner, setWinner] = useState(null);
  const [difficulty, setDifficulty] = useState("medium");
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [computerThinking, setComputerThinking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [computerTimer, setComputerTimer] = useState(null);
  
  const { currentUser } = useAuth();
  const { updateStats } = useStats();
  const navigate = useNavigate();
  
  // Initialize game
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setLoading(true);
        
        // Generate words for the game
        const response = await axios.post('http://localhost:5000/api/game/generate', {
          level: difficulty
        });
        
        setWords(response.data.words);
        setPlayerWords(response.data.words); // Same words for player
        setComputerWords(response.data.words); // Same words for computer
        setPlayerFoundWords([]);
        setComputerFoundWords([]);
        setPlayerScore(0);
        setComputerScore(0);
        setGameActive(true);
        setWinner(null);
        setStartTime(Date.now());
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing game:', error);
        setLoading(false);
      }
    };
    
    initializeGame();
  }, [difficulty]);
  
  // Update timer
  useEffect(() => {
    if (!gameActive || !startTime || isPaused) return;
    
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameActive, startTime, isPaused]);
  
  // Computer's turn logic
  const computerTurn = useCallback(async () => {
    if (!gameActive || words.length === 0) return;
    
    try {
      setComputerThinking(true);
      
      // Simulate network request delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call the API for computer's move
      const response = await axios.post('http://localhost:5000/api/versus/find-words', {
        words: words.filter(word => 
          !playerFoundWords.includes(word) && !computerFoundWords.includes(word)
        ),
        difficulty
      });
      
      // Get computer's found words
      const foundWords = response.data.foundWords || [];
      
      // Set up timers to find words with much longer delays
      let timers = [];
      
      // Simulate computer finding words over time with substantial delays
      foundWords.forEach((word, index) => {
        const timer = setTimeout(() => {
          if (isPaused) return; // Don't proceed if game is paused
          
          if (!playerFoundWords.includes(word) && !computerFoundWords.includes(word)) {
            // Mark word as found by computer
            setComputerFoundWords(prev => [...prev, word]);
            setComputerScore(prev => prev + word.length * 10);
            
            // Check if all words are found
            const totalFound = playerFoundWords.length + computerFoundWords.length + 1;
            if (totalFound >= words.length) {
              endGame();
            }
          }
        }, (index + 1) * 8000); // Find a word every 15 seconds (extremely slow)
        
        timers.push(timer);
      });
      
      // Save timers to state so we can clear them if needed
      setComputerTimer(timers);
      
      setComputerThinking(false);
    } catch (error) {
      console.error("Error in computer's turn:", error);
      setComputerThinking(false);
    }
  }, [gameActive, words, playerFoundWords, computerFoundWords, difficulty, isPaused]);
  
  // Start computer's turn when game loads or unpauses
  useEffect(() => {
    if (words.length > 0 && gameActive && !isPaused) {
      computerTurn();
    }
    
    // Clear computer timers when paused
    return () => {
      if (computerTimer) {
        computerTimer.forEach(timer => clearTimeout(timer));
      }
    };
  }, [words, gameActive, computerTurn, isPaused]);
  
  // Handle player finding a word
  const handlePlayerWordFound = (word) => {
    if (!playerFoundWords.includes(word) && !computerFoundWords.includes(word)) {
      setPlayerFoundWords(prev => [...prev, word]);
      setPlayerScore(prev => prev + word.length * 10);
      
      // Check if all words are found
      const totalFound = playerFoundWords.length + 1 + computerFoundWords.length;
      if (totalFound >= words.length) {
        endGame();
      }
    }
  };
  
  // End game logic
  const endGame = () => {
    setGameActive(false);
    const finalPlayerScore = playerScore;
    const finalComputerScore = computerScore;
    setWinner(finalPlayerScore > finalComputerScore ? "player" : "computer");
    
    // Clear any remaining computer timers
    if (computerTimer) {
      computerTimer.forEach(timer => clearTimeout(timer));
    }
    
    // Update stats if user is logged in
    if (currentUser) {
      updateStats(difficulty, {
        timeElapsed,
        score: finalPlayerScore,
        wordsFound: playerFoundWords.length
      });
    }
  };
  
  // Pause/resume game
  const togglePause = () => {
    if (!isPaused) {
      // Pausing the game
      setIsPaused(true);
      
      // Clear any computer timers
      if (computerTimer) {
        computerTimer.forEach(timer => clearTimeout(timer));
        setComputerTimer(null);
      }
    } else {
      // Resuming the game
      setIsPaused(false);
      
      // Restart computer turn when unpausing
      computerTurn();
    }
  };
  
  // Handle difficulty change
  const changeDifficulty = (level) => {
    setDifficulty(level);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Display words to find at the top
  const WordsToFind = () => (
    <div className="words-to-find">
      <h3>Words to Find:</h3>
      <div className="word-chips">
        {words.map(word => (
          <span 
            key={word} 
            className={`word-chip ${playerFoundWords.includes(word) ? 'found-user' : ''} ${computerFoundWords.includes(word) ? 'found-computer' : ''}`}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
  
  if (loading) {
    return <div className="loading">Loading game...</div>;
  }
  
  return (
    <div className="versus-container">
      <div className="game-controls">
        <div className="game-info">
          <div className="level-badge">
            <span>Level: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
          </div>
          <div className="timer">
            <span>Time: {formatTime(timeElapsed)}</span>
          </div>
        </div>
        
        <div className="control-buttons">
          <button 
            className={`pause-button ${isPaused ? 'paused' : ''}`}
            onClick={togglePause}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          
          <button 
            className="reset-button"
            onClick={() => window.location.reload()}
          >
            Reset
          </button>
        </div>
      </div>
      
      <div className="difficulty-selector" style={{ marginTop: '1rem' }}>
        <button 
          className={difficulty === "easy" ? "difficulty-btn active" : "difficulty-btn"}
          onClick={() => changeDifficulty("easy")}
          disabled={gameActive}
        >
          Easy
        </button>
        <button 
          className={difficulty === "medium" ? "difficulty-btn active" : "difficulty-btn"}
          onClick={() => changeDifficulty("medium")}
          disabled={gameActive}
        >
          Medium
        </button>
        <button 
          className={difficulty === "hard" ? "difficulty-btn active" : "difficulty-btn"}
          onClick={() => changeDifficulty("hard")}
          disabled={gameActive}
        >
          Hard
        </button>
      </div>
      
      <div className="scores-container">
        <div className="player-score">
          <h3>Your Score: {playerScore}</h3>
          <p>Words Found: {playerFoundWords.length}</p>
        </div>
        <div className="computer-score">
          <h3>Computer Score: {computerScore}</h3>
          <p>Words Found: {computerFoundWords.length}</p>
          {computerThinking && <p className="thinking">Computer is thinking...</p>}
        </div>
      </div>
      
      <WordsToFind />
      
      <div className="versus-grids-container">
        <div className="player-grid-container">
          <h3 className="grid-title">Your Grid</h3>
          <WordGrid 
            words={playerWords}
            level={difficulty}
            onWordFound={handlePlayerWordFound}
            isPaused={isPaused}
          />
        </div>
        
        <div className="computer-grid-container">
          <h3 className="grid-title" style={{ color: 'var(--secondary-color)' }}>Computer's Grid</h3>
          <div className="versus-computer-grid-wrapper" style={{ position: 'relative' }}>
            <WordGrid 
              words={computerWords}
              level={difficulty}
              onWordFound={() => {}}
              isPaused={isPaused} // This should match the game pause state
            />
            
            {/* Show visual indicator that computer can't be interacted with */}
            <div 
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                background: 'rgba(255,255,255,0.1)', 
                pointerEvents: 'none',
                zIndex: 5
              }}
            ></div>
          </div>
        </div>
      </div>
      
      {!gameActive && winner && (
        <div className="completion-overlay">
          <div className="game-over-modal">
            <h2>{winner === "player" ? "You Win! 🏆" : "Computer Wins! 🤖"}</h2>
            <p>Your Score: {playerScore}</p>
            <p>Computer Score: {computerScore}</p>
            <p>Time: {formatTime(timeElapsed)}</p>
            
            <div className="game-over-actions">
              <button onClick={() => window.location.reload()}>Play Again</button>
              <button onClick={() => navigate('/levels')}>Back to Levels</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VersusMode;