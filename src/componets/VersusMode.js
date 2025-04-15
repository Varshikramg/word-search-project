// src/components/VersusMode.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useStats } from '../contexts/StatsContext';
import WordGrid from './WordGrid';
import ComputerWordSearch from './ComputerWordSearch';
import './VersusMode.css';

// Word List component
function WordList({ title, words, foundWords, player, otherPlayerFoundWords = [] }) {
  return (
    <div className={`word-list ${player === 'computer' ? 'computer-words' : 'player-words'}`}>
      <h3>{title}</h3>
      <ul>
        {words.map(word => (
          <li 
            key={word} 
            className={`
              ${foundWords.includes(word) ? 'found' : ''} 
              ${otherPlayerFoundWords.includes(word) && !foundWords.includes(word) ? 'found-by-other' : ''}
            `}
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
  const [gameWords, setGameWords] = useState([]);
  const [playerWords, setPlayerWords] = useState([]);
  const [computerWords, setComputerWords] = useState([]);
  const [playerFoundWords, setPlayerFoundWords] = useState([]);
  const [computerFoundWords, setComputerFoundWords] = useState([]);
  const [gameActive, setGameActive] = useState(true);
  const [winner, setWinner] = useState(null);
  const [difficulty, setDifficulty] = useState("medium");
  const [theme, setTheme] = useState("default");
  const [gameEndLock, setGameEndLock] = useState(false);
  const [totalRequiredWords, setTotalRequiredWords] = useState(6); // Default to 6
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [computerThinking, setComputerThinking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gridGenerated, setGridGenerated] = useState(false);
  const [activeComputerSearches, setActiveComputerSearches] = useState(0);
  
  // Refs to access component methods
  const computerGridRef = useRef(null);
  
  const { currentUser } = useAuth();
  const { updateStats } = useStats();
  const navigate = useNavigate();
  
  const endGame = useCallback(() => {
    if (!gameActive) return; // Don't run if already ended
    
    console.log("Game ending! Final scores:");
    console.log(`Player: ${playerScore} (${playerFoundWords.length} words)`);
    console.log(`Computer: ${computerScore} (${computerFoundWords.length} words)`);
    
    // Immediately set game as inactive to prevent further updates
    setGameActive(false);
    
    // Stop any searching animation
    setComputerThinking(false);
    setActiveComputerSearches(0);
    
    // Clear all computer search timers
    if (computerGridRef.current && computerGridRef.current.clearAllTimers) {
      computerGridRef.current.clearAllTimers();
    }
    
    // Check who completed the game (found all words independently)
    const playerComplete = playerFoundWords.length >= gameWords.length;
    const computerComplete = computerFoundWords.length >= gameWords.length;
    
    // Set the winner based on who completed all words
    // If both completed, use score as tiebreaker
    if (playerComplete && computerComplete) {
      setWinner(playerScore >= computerScore ? "player" : "computer");
    } else if (playerComplete) {
      setWinner("player");
    } else if (computerComplete) {
      setWinner("computer");
    } else {
      // Fallback to score comparison if neither completed all words
      setWinner(playerScore > computerScore ? "player" : "computer");
    }
    
    // Update stats if user is logged in
    if (currentUser) {
      updateStats(difficulty, {
        timeElapsed,
        score: playerScore,
        wordsFound: playerFoundWords.length
      });
    }
  }, [gameActive, playerScore, computerScore, playerFoundWords, computerFoundWords, gameWords, currentUser, difficulty, timeElapsed]);
  
  // Function to check if game should end - based on INDEPENDENT word finding
  const checkGameEnd = useCallback(() => {
    if (!gameActive || !gameWords || gameWords.length === 0) return;
    
    // Each player must find all words independently!
    const playerComplete = playerFoundWords.length >= gameWords.length;
    const computerComplete = computerFoundWords.length >= gameWords.length;
    
    console.log(`Check game status: Player found ${playerFoundWords.length}/${gameWords.length} words`);
    console.log(`Check game status: Computer found ${computerFoundWords.length}/${gameWords.length} words`);
    
    // ONLY end the game if EITHER player or computer has found ALL words independently
    if (playerComplete || computerComplete) {
      console.log(`Game ending because ${playerComplete ? 'player' : 'computer'} found all words independently!`);
      endGame();
    }
  }, [gameActive, gameWords, playerFoundWords, computerFoundWords, endGame]);
  
  // Handle computer finding a word
  const handleComputerFoundWord = useCallback((word) => {
    if (!gameActive || isPaused) return;
    
    console.log(`Computer found word: ${word}`);
    
    // Skip if word is already found
    if (computerFoundWords.includes(word) || playerFoundWords.includes(word)) {
      return;
    }
    
    // Mark word as found and update score
    setComputerFoundWords(prev => [...prev, word]);
    setComputerScore(prev => prev + word.length * 10);
    
    // Decrease active search count
    setActiveComputerSearches(prev => Math.max(0, prev - 1));
    
    // Check if game should end - DON'T directly call endGame here
    // Let the checkGameEnd effect handle it for consistency
  }, [gameActive, isPaused, computerFoundWords, playerFoundWords]);
  
  // Run checkGameEnd whenever found words change
  useEffect(() => {
    checkGameEnd();
  }, [playerFoundWords, computerFoundWords, checkGameEnd]);
  
  // Handle computer searching animation state
  const handleComputerSearching = useCallback((isSearching) => {
    if (isSearching) {
      setActiveComputerSearches(prev => prev + 1);
    } else {
      setActiveComputerSearches(prev => Math.max(0, prev - 1));
    }
  }, []);
  
  // Start computer's turn
  const computerTurn = useCallback(() => {
    if (!gameActive || !computerGridRef.current || isPaused) {
      return;
    }
    
    console.log("Starting computer turn");
    
    setComputerThinking(true);
    
    // Small delay before computer starts searching
    setTimeout(() => {
      if (gameActive && !isPaused && computerGridRef.current.simulateComputerTurn) {
        // Use the simulateComputerTurn method from the ComputerWordSearch component
        computerGridRef.current.simulateComputerTurn();
        setComputerThinking(false);
      }
    }, 1000);
  }, [gameActive, isPaused]);
  
  // Initialize game with theme support
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setLoading(true);
        
        // Prevent any game end during initialization
        setGameEndLock(true);
        
        // Generate words for the game with theme
        const response = await axios.post('http://localhost:5000/api/game/generate', {
          level: difficulty,
          maxWords: 6, // FIXED: Exactly 6 words per level
          theme: theme
        });
        
        if (!response.data.words || response.data.words.length === 0) {
          console.error('No words returned from API');
          setLoading(false);
          setGameEndLock(false); // Release lock
          return;
        }
        
        // Ensure we have exactly 6 words
        let selectedWords = response.data.words.slice(0, 6);
        
        // Add default programming words if not enough were returned
        const defaultProgrammingWords = ["MONITOR", "SERVER", "PROGRAM", "BROWSER", "FUNCTION", "KEYBOARD"];
        const defaultAnimalWords = ["TIGER", "LION", "ZEBRA", "MONKEY", "ELEPHANT", "GIRAFFE"];
        
        // If we have less than 6 words, add from the default list
        const defaultWords = theme === "animals" ? defaultAnimalWords : defaultProgrammingWords;
        
        while (selectedWords.length < 6) {
          const wordToAdd = defaultWords[selectedWords.length];
          if (!selectedWords.includes(wordToAdd)) {
            selectedWords.push(wordToAdd);
          }
        }
        
        console.log('Final selected words:', selectedWords);
        
        // Make sure all words are uppercase for consistency
        selectedWords = selectedWords.map(word => word.toUpperCase());
        
        // Set the total required words - IMPORTANT for game end condition
        setTotalRequiredWords(selectedWords.length);
        
        // Explicitly make separate copies of the words array for player and computer
        setGameWords([...selectedWords]);
        setPlayerWords([...selectedWords]);
        setComputerWords([...selectedWords]);
        
        setPlayerFoundWords([]);
        setComputerFoundWords([]);
        setPlayerScore(0);
        setComputerScore(0);
        setGameActive(true);
        setWinner(null);
        setStartTime(Date.now());
        setGridGenerated(true);
        
        // Reset the time elapsed to 0
        setTimeElapsed(0);
        
        setLoading(false);
        
        // Release the game end lock after a delay, allowing game to fully initialize
        setTimeout(() => {
          setGameEndLock(false);
          console.log("Game initialization complete, lock released");
        }, 1000);
      } catch (error) {
        console.error('Error initializing game:', error);
        setLoading(false);
        setGameEndLock(false); // Release lock on error
      }
    };
    
    initializeGame();
  }, [difficulty, theme]);
  
  // Update timer - FIXED to prevent auto-ending at 26 seconds
  useEffect(() => {
    if (!gameActive || !startTime || isPaused) return;
    
    // Clear any existing timer
    let intervalId;
    
    // Start a new timer
    intervalId = setInterval(() => {
      const newTimeElapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeElapsed(newTimeElapsed);
      
      // Debug log to track time
      if (newTimeElapsed % 5 === 0) {
        console.log(`Game time: ${newTimeElapsed} seconds`);
      }
    }, 1000);
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [gameActive, startTime, isPaused]);
  
  // Start computer's turn when game loads or unpauses
  useEffect(() => {
    if (computerWords.length > 0 && gameActive && !isPaused && gridGenerated) {
      console.log("Starting computer's turn");
      // Small delay to ensure grid is fully generated
      const timer = setTimeout(() => {
        computerTurn();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [computerWords, gameActive, isPaused, gridGenerated, computerTurn]);
  
  useEffect(() => {
    if (!gameActive) {
      console.log("Game is no longer active - cleaning up all activities");
      // Make sure we clear any ongoing actions when game ends
      setComputerThinking(false);
      setActiveComputerSearches(0);
      
      // Clear all computer search timers
      if (computerGridRef.current && computerGridRef.current.clearAllTimers) {
        computerGridRef.current.clearAllTimers();
      }
    }
  }, [gameActive]);
  
  // Handle player finding a word
  const handlePlayerWordFound = (word) => {
    if (!gameActive) return; // Don't process if game is already over
    
    console.log(`Player found word: ${word}`);
    
    // IMPORTANT: Add the word even if the computer already found it
    if (playerWords.includes(word) && !playerFoundWords.includes(word)) {
      console.log(`Adding ${word} to playerFoundWords`);
      
      // Add the word to player's found words
      setPlayerFoundWords(prev => [...prev, word]);
      
      // Update score
      setPlayerScore(prev => prev + word.length * 10);
      
      // Check if player has found all words now
      const updatedPlayerFoundWords = [...playerFoundWords, word];
      if (updatedPlayerFoundWords.length >= gameWords.length) {
        // Player has found all the words!
        console.log("Player has found all words, ending game");
        endGame();
      }
    }
  };
  
  // Pause/resume game
  const togglePause = () => {
    if (!isPaused) {
      // Pausing the game
      setIsPaused(true);
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
  
  // Handle theme change
  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Theme selector component
  /*
  const ThemeSelector = () => (
    <div className="theme-selector" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
      <span style={{ marginRight: '10px' }}>Theme:</span>
      <button 
        className={theme === "default" ? "theme-btn active" : "theme-btn"}
        onClick={() => changeTheme("default")}
        disabled={gameActive}
      >
        Programming
      </button>
      <button 
        className={theme === "animals" ? "theme-btn active" : "theme-btn"}
        onClick={() => changeTheme("animals")}
        disabled={gameActive}
      >
        Animals
      </button>
    </div>
  );
  */
  // WordsToFind component definition is kept but not used in the render
  
  if (loading) {
    return <div className="loading">Loading game...</div>;
  }
  
  return (
    <div className="versus-container">
      <div className="game-controls updated-theme">
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
        >
          Easy
        </button>
        <button 
          className={difficulty === "medium" ? "difficulty-btn active" : "difficulty-btn"}
          onClick={() => changeDifficulty("medium")}
        >
          Medium
        </button>
        <button 
          className={difficulty === "hard" ? "difficulty-btn active" : "difficulty-btn"}
          onClick={() => changeDifficulty("hard")}
        >
          Hard
        </button>
      </div>
      
      {/* Add the theme selector */}
  
      
      <div className="scores-container">
        <div className="player-score">
          <h3>Your Score: {playerScore}</h3>
          <p>Words Found: {playerFoundWords.length}</p>
        </div>
        <div className="computer-score">
          <h3>Computer Score: {computerScore}</h3>
          <p>Words Found: {computerFoundWords.length}</p>
          {computerThinking && <p className="thinking">Computer is thinking...</p>}
          {activeComputerSearches > 0 && <p className="searching">Computer is searching...</p>}
        </div>
      </div>
      
      {/* Removed WordsToFind component from here */}
      
      {/* Word Lists Container - shows separate lists for player and computer */}
      <div className="word-lists-container">
        <WordList 
          title="Your Words:"
          words={gameWords} 
          foundWords={playerFoundWords} 
          player="player"
          otherPlayerFoundWords={computerFoundWords} // Pass computer found words here
        />
        <WordList 
          title="Computer's Words:"
          words={gameWords} 
          foundWords={computerFoundWords} 
          player="computer"
          otherPlayerFoundWords={playerFoundWords} // Pass player found words here
        />
      </div>
      
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
            {/* Use the improved ComputerWordSearch component */}
            <ComputerWordSearch 
              ref={computerGridRef}
              words={computerWords}
              level={difficulty}
              computerFoundWords={computerFoundWords}
              onComputerSearching={handleComputerSearching}
              onComputerFoundWord={handleComputerFoundWord}
              isPaused={isPaused}
            />
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