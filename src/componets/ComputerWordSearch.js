// src/components/ComputerWordSearch.js
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { findWordsInGridWithTrie } from '../utils/wordFinderTrie';

const ComputerWordSearch = forwardRef(({ words, level, computerFoundWords, onComputerSearching, onComputerFoundWord, isPaused }, ref) => {
  const gridSizes = {
    easy: 8,
    medium: 10,
    hard: 12
  };
  
  const gridSize = gridSizes[level] || 10;
  
  const [grid, setGrid] = useState([]);
  const [foundCells, setFoundCells] = useState([]);
  const [searchingCells, setSearchingCells] = useState([]);
  const gridRef = useRef(null);
  const [wordLocations, setWordLocations] = useState([]);
  const [currentSearchPath, setCurrentSearchPath] = useState([]);
  const [pathIndex, setPathIndex] = useState(0);
  const [searchTimers, setSearchTimers] = useState([]);
  const [animationTimers, setAnimationTimers] = useState([]);
  
  // Clear all timers function
  const clearAllTimers = () => {
    console.log("Clearing all computer search timers");
    // Clear all search timers
    searchTimers.forEach(timer => clearTimeout(timer));
    // Clear all animation timers
    animationTimers.forEach(timer => clearTimeout(timer));
    // Reset states
    setSearchTimers([]);
    setAnimationTimers([]);
    setSearchingCells([]);
    setCurrentSearchPath([]);
  };
  
  // Expose methods through the ref
  useImperativeHandle(ref, () => ({
    simulateComputerTurn: () => simulateComputerTurn(),
    clearAllTimers: clearAllTimers
  }));
  
  // Generate the grid when words change
  useEffect(() => {
    if (words && words.length > 0) {
      generateGrid();
      setFoundCells([]);
      setSearchingCells([]);
      setCurrentSearchPath([]);
      setPathIndex(0);
    }
  }, [words, level]);
  
  // Cleanup timers on unmount or when words change
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);
  
  // Update highlighting when computer finds words
  useEffect(() => {
    if (computerFoundWords && computerFoundWords.length > 0 && wordLocations.length > 0) {
      updateFoundCells();
    }
  }, [computerFoundWords, wordLocations]);
  
  // Handle changes in pause state
  useEffect(() => {
    if (isPaused) {
      // Pause all animations by clearing timers
      searchTimers.forEach(timer => clearTimeout(timer));
      animationTimers.forEach(timer => clearTimeout(timer));
      setSearchingCells([]);
    } else {
      // Resume might need to restart current search
      if (currentSearchPath.length > 0 && pathIndex < currentSearchPath.length) {
        startPathAnimation();
      }
    }
  }, [isPaused]);
  
  // Helper to update found cells from wordLocations
  const updateFoundCells = () => {
    const newFoundCells = [];
    
    if (computerFoundWords && Array.isArray(computerFoundWords)) {
      computerFoundWords.forEach(foundWord => {
        // Find this word in word locations
        const wordLocation = wordLocations.find(location => 
          location.word && foundWord && 
          location.word.toUpperCase() === foundWord.toUpperCase()
        );
        
        if (wordLocation && wordLocation.cells) {
          // Add all cells from this word to foundCells
          wordLocation.cells.forEach(cell => {
            newFoundCells.push(`${cell.y}-${cell.x}`);
          });
        }
      });
    }
    
    setFoundCells(newFoundCells);
  };
  
  // Start animating along a path
  const startPathAnimation = () => {
    if (!currentSearchPath.length || isPaused) return;
    
    // Clear any existing timers
    animationTimers.forEach(timer => clearTimeout(timer));
    const newTimers = [];
    
    // Reset searching cells and path index
    setSearchingCells([]);
    setPathIndex(0);
    
    // Animate through the path
    let idx = 0;
    const pathCells = [];
    
    const animateNextCell = () => {
      if (idx < currentSearchPath.length && !isPaused) {
        const [row, col] = currentSearchPath[idx];
        pathCells.push(`${row}-${col}`);
        setSearchingCells([...pathCells]);
        setPathIndex(idx + 1);
        
        idx++;
        const timer = setTimeout(animateNextCell, 300); // 300ms between cells
        newTimers.push(timer);
      } else {
        // Finished path animation
        if (onComputerSearching) {
          onComputerSearching(false);
        }
      }
    };
    
    // Start the animation
    if (onComputerSearching) {
      onComputerSearching(true);
    }
    animateNextCell();
    
    setAnimationTimers(newTimers);
  };
  
  // Start a computer search with a specific path
  const startComputerSearch = (path, wordToFind) => {
    if (!path || path.length === 0 || isPaused) return;
    
    setCurrentSearchPath(path);
    startPathAnimation();
    
    // After animation completes, trigger word found
    const searchCompletionTime = path.length * 300 + 500;
    const wordFoundTimer = setTimeout(() => {
      if (!isPaused && onComputerFoundWord) {
        // Check if game is still active before finding words
        onComputerFoundWord(wordToFind);
      }
    }, searchCompletionTime);
    
    setSearchTimers(prev => [...prev, wordFoundTimer]);
  };
  
  // Update the simulateComputerTurn function in ComputerWordSearch.js

const simulateComputerTurn = () => {
    if (!grid || !grid.length || !words || !Array.isArray(words)) {
      return [];
    }
    
    console.log("Computer starting search for words:", words);
    console.log("Computer already found words:", computerFoundWords || []);
    
    // The computer should look for all words, not just the ones the player hasn't found
    // Find valid words in the grid using our Trie
    const { foundWords, searchPaths } = findWordsInGridWithTrie(grid, words, level);
    
    console.log("Words found by Trie search:", foundWords);
    
    // Filter out words already found BY THE COMPUTER
    const remainingWords = foundWords.filter(word => 
      !computerFoundWords.includes(word)
    );
    
    console.log("Remaining words for computer to find:", remainingWords);
    
    if (remainingWords.length === 0) {
      // If no words found by Trie, try using the wordLocations as fallback
      console.log("No words found by Trie, using wordLocations fallback");
      
      const unfoundWords = words.filter(word => 
        !computerFoundWords.includes(word)
      );
      
      // Try to find all remaining words
      const wordsToFind = unfoundWords.slice(0, unfoundWords.length);
      
      if (wordsToFind.length === 0) return [];
      
      // Set up timers for searching these words
      const timers = [];
      const delays = {
        easy: 4000,
        medium: 3000,
        hard: 2000
      };
      const delay = delays[level] || 3000;
      
      // Clear any existing timers first
      clearAllTimers();
      
      // Generate simple paths for these words
      wordsToFind.forEach((word, index) => {
        const searchTimer = setTimeout(() => {
          if (!isPaused) {
            // Create a simple path from the word length
            const path = Array.from({ length: word.length }, (_, i) => [0, i]);
            
            // Create cells from wordLocations if available
            const wordLocation = wordLocations.find(loc => loc.word === word);
            if (wordLocation && wordLocation.cells) {
              const mappedPath = wordLocation.cells.map(cell => [cell.y, cell.x]);
              startComputerSearch(mappedPath, word);
            } else {
              startComputerSearch(path, word);
            }
          }
        }, delay * (index + 1));
        
        timers.push(searchTimer);
      });
      
      setSearchTimers(prev => [...prev, ...timers]);
      return timers;
    }
    
    // Computer should try to find ALL remaining words, not just a subset
    const wordsToFind = remainingWords;
    const pathsToUse = searchPaths.slice(0, wordsToFind.length);
    
    // Set up timers for searching each word
    const timers = [];
    const delays = {
      easy: 4000,
      medium: 3000,
      hard: 2500
    };
    const delay = delays[level] || 3000;
    
    // Clear any existing timers first
    clearAllTimers();
    
    // For each word, create a search animation
    wordsToFind.forEach((word, index) => {
      const searchTimer = setTimeout(() => {
        // Only proceed if game is still active and not paused
        if (!isPaused) {
          const path = pathsToUse[index];
          startComputerSearch(path, word);
        }
      }, delay * (index + 1));
      
      timers.push(searchTimer);
    });
    
    // Add new timers to state
    setSearchTimers(prev => [...prev, ...timers]);
    
    return timers;
  };
  
  const generateGrid = () => {
    // Create empty grid
    let newGrid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
    let newWordLocations = [];
    let placedWords = [];
    
    // Place words
    if (words && Array.isArray(words)) {
      console.log("Attempting to place words in computer grid:", words);
      
      words.forEach(word => {
        if (!word || typeof word !== 'string') return;
        
        let placed = false;
        let attempts = 0;
        const maxAttempts = 200; // Increased for better placement chance
        
        while (!placed && attempts < maxAttempts) {
          attempts++;
          
          // Try to place the word
          const directions = getDirections();
          const direction = directions[Math.floor(Math.random() * directions.length)];
          
          // For hard level, randomly reverse words
          let wordToPlace = word;
          if (level === 'hard' && Math.random() > 0.5) {
            wordToPlace = word.split('').reverse().join('');
          }
          
          const [dx, dy] = direction;
          const length = wordToPlace.length;
          
          // Random starting position
          const startX = Math.floor(Math.random() * gridSize);
          const startY = Math.floor(Math.random() * gridSize);
          
          // Check if word fits
          let fits = true;
          let cells = [];
          
          for (let i = 0; i < length; i++) {
            const x = startX + i * dx;
            const y = startY + i * dy;
            
            // Check boundaries
            if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
              fits = false;
              break;
            }
            
            // Check if cell is empty or has the same letter
            if (newGrid[y][x] !== '' && newGrid[y][x] !== wordToPlace[i]) {
              fits = false;
              break;
            }
            
            cells.push({ x, y, letter: wordToPlace[i] });
          }
          
          // Place the word if it fits
          if (fits) {
            cells.forEach(cell => {
              newGrid[cell.y][cell.x] = cell.letter;
            });
            
            // Save word location for checking later
            newWordLocations.push({
              word: word,
              cells: cells.map(cell => ({ x: cell.x, y: cell.y }))
            });
            
            placed = true;
            placedWords.push(word);
            console.log(`Successfully placed word in computer grid: ${word}`);
          }
        }
        
        // If we couldn't place the word after max attempts, log an error
        if (!placed) {
          console.error(`Could not place word in computer grid: ${word}`);
        }
      });
    }
    
    // Check if all words were placed
    const unplacedWords = words.filter(word => !placedWords.includes(word));
    if (unplacedWords.length > 0) {
      console.warn("Warning: Some words could not be placed in computer grid:", unplacedWords);
      
      // Try to place unplaced words again with more favorable conditions
      unplacedWords.forEach(word => {
        // Try with horizontal placement only for simplicity
        let placed = false;
        const direction = [1, 0]; // horizontal
        const wordToPlace = word.toUpperCase();
        
        // Try multiple rows and start positions
        for (let row = 0; row < gridSize && !placed; row++) {
          // Try starting at the beginning of each row
          for (let startCol = 0; startCol <= gridSize - wordToPlace.length && !placed; startCol++) {
            let cells = [];
            
            // Check if word fits here (we'll force it)
            for (let i = 0; i < wordToPlace.length; i++) {
              const x = startCol + i;
              const y = row;
              cells.push({ x, y, letter: wordToPlace[i] });
            }
            
            // Place the word forcefully
            cells.forEach(cell => {
              newGrid[cell.y][cell.x] = cell.letter;
            });
            
            // Save word location
            newWordLocations.push({
              word: word,
              cells: cells.map(cell => ({ x: cell.x, y: cell.y }))
            });
            
            placed = true;
            placedWords.push(word);
            console.log(`Forcefully placed word in computer grid: ${word}`);
          }
        }
      });
    }
    
    // Fill remaining cells with random letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (newGrid[y][x] === '') {
          newGrid[y][x] = letters.charAt(Math.floor(Math.random() * letters.length));
        }
      }
    }
    
    setGrid(newGrid);
    setWordLocations(newWordLocations);
    
    // Verify words in the grid using our Trie implementation
    if (words && Array.isArray(words)) {
      const { foundWords } = findWordsInGridWithTrie(newGrid, words, level);
      console.log("Words verified in computer grid:", foundWords);
      
      // If some words are still missing, log them
      const stillMissingWords = words.filter(word => !foundWords.includes(word));
      if (stillMissingWords.length > 0) {
        console.warn("Words still missing from computer grid after verification:", stillMissingWords);
      }
    }
    
    // Save word locations to localStorage for debugging
    localStorage.setItem('computerWordLocations', JSON.stringify(newWordLocations));
  };
  
  const getDirections = () => {
    switch(level) {
      case 'easy':
        return [[0, 1], [1, 0]]; // Horizontal and vertical only
      case 'medium':
        // FIXED: Added diagonal to bottom-left [1, -1] that was missing
        return [[0, 1], [1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]; // All diagonals
      case 'hard':
        return [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]; // All directions
      default:
        return [[0, 1], [1, 0]];
    }
  };
  
  const isCellFound = (rowIndex, colIndex) => {
    return foundCells.includes(`${rowIndex}-${colIndex}`);
  };
  
  const isCellSearching = (rowIndex, colIndex) => {
    return searchingCells.includes(`${rowIndex}-${colIndex}`);
  };
  
  return (
    <div 
      className={`word-grid-container ${isPaused ? 'paused' : ''}`}
      ref={gridRef}
    >
      {isPaused && (
        <div className="pause-overlay">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3>Game Paused</h3>
            <p>Click Resume to continue playing</p>
          </motion.div>
        </div>
      )}
      
      <div 
        className={`word-grid ${level}-grid`}
        style={{ position: 'relative' }}
      >
        {grid.map((row, rowIndex) => (
          row.map((letter, colIndex) => {
            const isFound = isCellFound(rowIndex, colIndex);
            // Only show searching animation if cell is not already found
            const isSearching = !isFound && isCellSearching(rowIndex, colIndex);
            
            return (
              <motion.div
                key={`${rowIndex}-${colIndex}`}
                className={`cell ${isFound ? 'found' : ''} ${isSearching ? 'searching' : ''}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: 1, 
                  scale: isFound ? 1.05 : isSearching ? 1.1 : 1,
                  backgroundColor: isFound 
                    ? '#4CAF50' 
                    : isSearching
                      ? '#FF9800'
                      : '#ffffff',
                  color: isFound || isSearching ? '#ffffff' : '#000000'
                }}
                transition={{ 
                  delay: (rowIndex * gridSize + colIndex) * 0.01,
                  duration: 0.2
                }}
              >
                {letter}
              </motion.div>
            );
          })
        ))}
      </div>
    </div>
  );
});

export default ComputerWordSearch;