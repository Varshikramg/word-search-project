// src/components/WordList.js - Complete fix
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function WordList({ title, words, foundWords, player = "player", otherPlayerFoundWords = [] }) {
  return (
    <div className={`word-list ${player === 'computer' ? 'computer-words' : 'player-words'}`}>
      <h3>{title} {foundWords.length}/{words.length}</h3>
      <ul>
        <AnimatePresence>
          {words.map((word, index) => {
            // Check if this specific player found the word
            const isFoundByThisPlayer = foundWords.includes(word);
            
            // Check if the other player found it
            const isFoundByOtherPlayer = otherPlayerFoundWords.includes(word);
            
            return (
              <motion.li 
                key={word}
                className={`
                  ${isFoundByThisPlayer ? 'found' : ''} 
                  ${isFoundByOtherPlayer && !isFoundByThisPlayer ? 'found-by-other' : ''}
                `}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  textDecoration: (isFoundByThisPlayer || isFoundByOtherPlayer) ? 'line-through' : 'none',
                  ...(isFoundByThisPlayer && {
                    scale: [1, 1.2, 1],
                    transition: { duration: 0.5 }
                  })
                }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                {word}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}

export default WordList;