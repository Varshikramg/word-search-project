// src/utils/wordFinderTrie.js
import Trie from './trie';

/**
 * Find words in a grid using a Trie data structure
 * @param {Array} grid - 2D grid of letters
 * @param {Array} wordsList - List of words to find
 * @param {string} difficulty - Game difficulty (easy, medium, hard)
 * @returns {Object} - Found words and their paths
 */
export const findWordsInGridWithTrie = (grid, wordsList, difficulty) => {
  // Validate inputs
  if (!grid || !Array.isArray(grid) || grid.length === 0 || 
      !Array.isArray(grid[0]) || grid[0].length === 0 || 
      !wordsList || !Array.isArray(wordsList)) {
    console.error("Invalid grid or words list:", grid, wordsList);
    return { 
      foundWords: [], 
      searchPaths: []
    };
  }

  // Build trie with words to find
  const trie = new Trie();
  wordsList.forEach(word => {
    if (word && typeof word === 'string') {
      trie.insert(word);
    }
  });
  
  // Get dimensions
  const rows = grid.length;
  const cols = grid[0].length;
  
  // Initialize result arrays
  const foundWords = [];
  const searchPaths = [];
  
  // Get directions based on difficulty
  let directions = [];
  if (difficulty === 'easy') {
    directions = [[0, 1], [1, 0]]; // Horizontal and vertical
  } else if (difficulty === 'medium') {
    directions = [[0, 1], [1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]; // Add diagonals
  } else { // hard
    directions = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]; // All directions
  }

  // Convert grid to uppercase for case-insensitive matching
  const upperGrid = grid.map(row => 
    row.map(cell => typeof cell === 'string' ? cell.toUpperCase() : cell)
  );
  
  // Create a visited matrix to track visited cells during DFS
  const visited = Array(rows).fill().map(() => Array(cols).fill(false));
  
  // DFS function to search for words starting from each cell
  function dfs(row, col, node, path) {
    // Check if we're out of bounds or cell is already visited
    if (row < 0 || row >= rows || col < 0 || col >= cols || visited[row][col]) {
      return;
    }
    
    const char = upperGrid[row][col];
    
    // Check if this character is in the current trie node's children
    if (!node.children[char]) {
      return;
    }
    
    // Move to the next node in the trie
    node = node.children[char];
    
    // Add current cell to the path
    const currentPath = [...path, [row, col]];
    
    // If we've found a complete word
    if (node.isEndOfWord && node.word) {
      const word = node.word;
      if (!foundWords.includes(word)) {
        foundWords.push(word);
        searchPaths.push([...currentPath]); // Deep copy the path
      }
    }
    
    // Mark current cell as visited
    visited[row][col] = true;
    
    // Explore all directions
    for (const [dRow, dCol] of directions) {
      dfs(row + dRow, col + dCol, node, currentPath);
    }
    
    // Backtrack - mark cell as unvisited
    visited[row][col] = false;
  }
  
  // Start DFS from each cell in the grid
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      dfs(row, col, trie.root, []);
    }
  }
  
  console.log(`Found ${foundWords.length} words with Trie search:`, foundWords);
  
  return { 
    foundWords, 
    searchPaths 
  };
};

// Function to simulate the computer searching through the grid
export const simulateComputerSearch = (grid, words, difficulty, 
  onStartSearch, onWordFound, onFinishSearch) => {
  
  // Find the words and paths
  const { foundWords, searchPaths } = findWordsInGridWithTrie(grid, words, difficulty);
  
  // If no words found, call finish callback
  if (foundWords.length === 0) {
    onFinishSearch([]);
    return [];
  }
  
  // Set up timers for computer's "thinking" and word finding
  const timers = [];
  const delayFactors = {
    'easy': 1.5,
    'medium': 1,
    'hard': 0.6
  };
  const delayMultiplier = delayFactors[difficulty] || 1;
  
  // Process each found word with delays to simulate thinking
  foundWords.forEach((word, index) => {
    const path = searchPaths[index];
    
    // Delay before starting to search
    const searchDelay = (index + 1) * 3000 * delayMultiplier;
    
    const searchTimer = setTimeout(() => {
      // Start searching animation along the path
      onStartSearch(path);
      
      // Delay before "finding" the word
      const findDelay = (word.length * 500) * delayMultiplier;
      
      const findTimer = setTimeout(() => {
        // Found the word
        onWordFound(word, path);
        
        // If this is the last word, call finish callback
        if (index === foundWords.length - 1) {
          onFinishSearch(foundWords);
        }
      }, findDelay);
      
      timers.push(findTimer);
    }, searchDelay);
    
    timers.push(searchTimer);
  });
  
  return timers;
};

export default findWordsInGridWithTrie;