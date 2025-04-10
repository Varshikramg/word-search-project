// src/components/WordGrid.js
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

function WordGrid({ words, level, onWordFound, isPaused }) {
  // Grid size based on level
  const gridSizes = {
    easy: 8,
    medium: 10,
    hard: 12
  };
  
  const gridSize = gridSizes[level];
  
  // Direction options based on level
  const getDirections = () => {
    switch(level) {
      case 'easy':
        return [[0, 1], [1, 0]]; // Horizontal and vertical
      case 'medium':
        return [[0, 1], [1, 0], [1, 1], [-1, 1]]; // Add diagonals
      case 'hard':
        return [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]; // All directions
      default:
        return [[0, 1], [1, 0]];
    }
  };
  
  const [grid, setGrid] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [selecting, setSelecting] = useState(false);
  const [selectionComplete, setSelectionComplete] = useState(false);
  const [foundCells, setFoundCells] = useState([]); // Track found cells
  const gridRef = useRef(null);
  
  // Generate the grid when words change
  useEffect(() => {
    if (words.length > 0) {
      generateGrid();
      setFoundCells([]); // Reset found cells when starting a new game
    }
  }, [words]);
  
  const generateGrid = () => {
    // Create empty grid
    let newGrid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
    let wordLocations = [];
    
    // Place words
    words.forEach(word => {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100;
      
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
          wordLocations.push({
            word: word,
            cells: cells.map(cell => ({ x: cell.x, y: cell.y }))
          });
          
          placed = true;
        }
      }
      
      // If we couldn't place the word after max attempts, log an error
      if (!placed) {
        console.error(`Could not place word: ${word}`);
      }
    });
    
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
    
    // Save word locations to localStorage for debugging
    localStorage.setItem('wordLocations', JSON.stringify(wordLocations));
  };
  
  const handleCellMouseDown = (rowIndex, colIndex) => {
    if (isPaused) return;
    
    setSelecting(true);
    setSelectedCells([{ row: rowIndex, col: colIndex }]);
  };
  
  const handleCellMouseEnter = (rowIndex, colIndex) => {
    if (!selecting || isPaused) return;
    
    // For simplicity, only allow straight lines (horizontal, vertical, diagonal)
    const lastCell = selectedCells[selectedCells.length - 1];
    
    if (selectedCells.length > 1) {
      const prevDirection = {
        x: lastCell.col - selectedCells[selectedCells.length - 2].col,
        y: lastCell.row - selectedCells[selectedCells.length - 2].row
      };
      
      const currentDirection = {
        x: colIndex - lastCell.col,
        y: rowIndex - lastCell.row
      };
      
      // Check if we're moving in the same direction
      if (prevDirection.x !== currentDirection.x || prevDirection.y !== currentDirection.y) {
        return;
      }
    }
    
    // Check if cell is already selected
    const alreadySelected = selectedCells.some(cell => 
      cell.row === rowIndex && cell.col === colIndex
    );
    
    if (!alreadySelected) {
      setSelectedCells([...selectedCells, { row: rowIndex, col: colIndex }]);
    }
  };
  
  const handleCellMouseUp = () => {
    if (isPaused) return;
    
    // Check if the selected cells form a word
    if (selectedCells.length > 1) {
      const selectedWord = selectedCells.map(cell => 
        grid[cell.row][cell.col]
      ).join('');
      
      // Check if it's in our word list
      const wordIndex = words.indexOf(selectedWord);
      if (wordIndex !== -1) {
        onWordFound(selectedWord);
        
        // Add selected cells to foundCells array to keep them highlighted
        setFoundCells(prev => [...prev, ...selectedCells.map(cell => `${cell.row}-${cell.col}`)]);
        
        // Show celebration animation
        setSelectionComplete(true);
        setTimeout(() => {
          setSelectionComplete(false);
        }, 1000);
      }
      
      // Check if it's a reversed word
      const reversedWord = selectedWord.split('').reverse().join('');
      if (level === 'hard' && words.indexOf(reversedWord) !== -1) {
        onWordFound(reversedWord);
        
        // Add selected cells to foundCells array
        setFoundCells(prev => [...prev, ...selectedCells.map(cell => `${cell.row}-${cell.col}`)]);
        
        setSelectionComplete(true);
        setTimeout(() => {
          setSelectionComplete(false);
        }, 1000);
      }
    }
    
    // Reset selection
    setSelecting(false);
    setSelectedCells([]);
  };
  
  const handleMouseLeave = () => {
    if (selecting) {
      setSelecting(false);
      setSelectedCells([]);
    }
  };
  
  const isCellSelected = (rowIndex, colIndex) => {
    return selectedCells.some(cell => cell.row === rowIndex && cell.col === colIndex);
  };
  
  const isCellFound = (rowIndex, colIndex) => {
    return foundCells.includes(`${rowIndex}-${colIndex}`);
  };
  
  // Determine selection line
  const getSelectionLineStyle = () => {
    if (selectedCells.length < 2) return null;
    
    const startCell = selectedCells[0];
    const endCell = selectedCells[selectedCells.length - 1];
    
    // Get element positions
    const gridElement = gridRef.current;
    if (!gridElement) return null;
    
    const cellSize = gridElement.offsetWidth / gridSize;
    
    const startX = startCell.col * cellSize + cellSize / 2;
    const startY = startCell.row * cellSize + cellSize / 2;
    const endX = endCell.col * cellSize + cellSize / 2;
    const endY = endCell.row * cellSize + cellSize / 2;
    
    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
    
    return {
      width: `${length}px`,
      height: '4px',
      backgroundColor: selectionComplete ? '#4CAF50' : '#FF9800',
      position: 'absolute',
      top: `${startY}px`,
      left: `${startX}px`,
      transformOrigin: '0 50%',
      transform: `rotate(${angle}deg)`,
      zIndex: 2,
      borderRadius: '2px',
      boxShadow: '0 0 5px rgba(0,0,0,0.3)',
      transition: selectionComplete ? 'background-color 0.3s' : 'none'
    };
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
        className="word-grid" 
        onMouseLeave={handleMouseLeave}
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          position: 'relative'
        }}
      >
        {selectedCells.length >= 2 && (
          <div style={getSelectionLineStyle()}></div>
        )}
        
        {grid.map((row, rowIndex) => (
          row.map((letter, colIndex) => {
            const isSelected = isCellSelected(rowIndex, colIndex);
            const isFound = isCellFound(rowIndex, colIndex);
            const isFirst = selectedCells.length > 0 && 
              selectedCells[0].row === rowIndex && selectedCells[0].col === colIndex;
            const isLast = selectedCells.length > 0 && 
              selectedCells[selectedCells.length - 1].row === rowIndex && 
              selectedCells[selectedCells.length - 1].col === colIndex;
            
            return (
              <motion.div
                key={`${rowIndex}-${colIndex}`}
                className={`cell ${isSelected ? 'selected' : ''} ${isFirst ? 'start' : ''} ${isLast ? 'end' : ''} ${isFound ? 'found' : ''}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: 1, 
                  scale: isFound 
                    ? 1.05 
                    : isSelected 
                      ? (selectionComplete ? 1.2 : 1.1) 
                      : 1,
                  backgroundColor: isFound 
                    ? '#4CAF50' 
                    : isSelected 
                      ? (selectionComplete ? '#4CAF50' : '#FF9800') 
                      : '#ffffff'
                }}
                transition={{ 
                  delay: (rowIndex * gridSize + colIndex) * 0.01,
                  duration: 0.2,
                  type: 'spring',
                  stiffness: 200
                }}
                onMouseDown={() => handleCellMouseDown(rowIndex, colIndex)}
                onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                onMouseUp={handleCellMouseUp}
              >
                {letter}
              </motion.div>
            );
          })
        ))}
      </div>
    </div>
  );
}

export default WordGrid;