// src/components/WordList.js
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function WordList({ words, foundWords }) {
  return (
    <div className="word-list">
      <h3>Words to Find: {foundWords.length}/{words.length}</h3>
      <ul>
        <AnimatePresence>
          {words.map((word, index) => {
            const isFound = foundWords.includes(word);
            return (
              <motion.li 
                key={word}
                className={isFound ? 'found' : ''}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  ...(isFound && {
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