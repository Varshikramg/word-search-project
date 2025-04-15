// src/utils/wordFinder.js
// Fixed version with better error handling

/**
 * Find words in a grid using a Trie-like approach
 * This implements a simplified version of the backend algorithm directly in the browser
 */
export const findWordsInGrid = (grid, wordsList, difficulty) => {
    // Return values
    const foundWords = [];
    const searchPaths = [];
    
    // Validate grid structure first
    if (!grid || !Array.isArray(grid) || grid.length === 0 || 
        !Array.isArray(grid[0]) || grid[0].length === 0) {
      console.error("Invalid grid structure:", grid);
      return { 
        foundWords: wordsList.slice(0, 2), // Return first two words as a fallback
        searchPaths: wordsList.slice(0, 2).map(word => 
          Array.from({ length: word.length }, (_, i) => [0, i])
        )
      };
    }
    
    // Helper to check if a word exists at a given position and direction
    const checkWord = (word, row, col, dRow, dCol) => {
      const path = [];
      
      for (let i = 0; i < word.length; i++) {
        const r = row + i * dRow;
        const c = col + i * dCol;
        
        // Check if we're outside the grid
        if (r < 0 || r >= grid.length || c < 0 || 
            c >= grid[0].length || !grid[r] || !grid[r][c]) {
          return null;
        }
        
        // Safely access cell content, ensuring it exists and is a string
        const cellContent = grid[r][c];
        if (typeof cellContent !== 'string') {
          return null;
        }
        
        // Check if the letter matches (with safe conversion to uppercase)
        if (cellContent.toString().toUpperCase() !== word[i].toUpperCase()) {
          return null;
        }
        
        path.push([r, c]);
      }
      
      return path;
    };
    
    // Get directions based on difficulty
    let directions = [];
    if (difficulty === 'easy') {
      directions = [[0, 1], [1, 0]]; // Horizontal and vertical
    } else if (difficulty === 'medium') {
      directions = [[0, 1], [1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]; // Add diagonals
    } else { // hard
      directions = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]; // All directions
    }
    
    try {
      // Search the grid for each word
      wordsList.forEach(word => {
        // Skip invalid words
        if (!word || typeof word !== 'string') return;
        
        // Don't search for words we've already found
        if (foundWords.includes(word)) return;
        
        // Try each starting position
        for (let row = 0; row < grid.length; row++) {
          for (let col = 0; col < grid[0].length; col++) {
            // Try each direction
            for (const [dRow, dCol] of directions) {
              const path = checkWord(word, row, col, dRow, dCol);
              if (path) {
                foundWords.push(word);
                searchPaths.push(path);
                return; // Move to next word
              }
            }
          }
        }
      });
    } catch (error) {
      console.error("Error during word search:", error);
    }
    
    console.log(`Found ${foundWords.length} words with client-side search`);
    
    // If we didn't find enough words with exact search, add some random ones
    // This ensures the computer always finds some words
    const wordsToFind = Math.max(1, Math.min(3, Math.ceil(wordsList.length * 0.3)));
    
    if (foundWords.length < wordsToFind && wordsList.length > 0) {
      const remainingWords = wordsList.filter(word => !foundWords.includes(word));
      
      while (foundWords.length < wordsToFind && remainingWords.length > 0) {
        // Pick a random word
        const idx = Math.floor(Math.random() * remainingWords.length);
        const word = remainingWords[idx];
        remainingWords.splice(idx, 1);
        
        if (!foundWords.includes(word)) {
          foundWords.push(word);
          
          // Create a dummy path for visualization
          const dummyPath = [];
          for (let i = 0; i < word.length; i++) {
            dummyPath.push([i, 0]);
          }
          searchPaths.push(dummyPath);
        }
      }
      
      console.log("Added random words to reach minimum count:", foundWords);
    }
    
    return { foundWords, searchPaths };
  };