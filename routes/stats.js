// routes/stats.js
const express = require('express');
const router = express.Router();
const Stats = require('../models/Stats');

// Get stats for a user
router.get('/:userId', async (req, res) => {
  try {
    let stats = await Stats.findOne({ userId: req.params.userId });
    
    if (!stats) {
      // Create default stats if user doesn't have any
      stats = new Stats({ 
        userId: req.params.userId,
        // Default values already defined in schema
      });
      await stats.save();
    }
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update stats after game completion
router.post('/update', async (req, res) => {
  try {
    const { userId, level, timeElapsed, score, wordsFound } = req.body;
    
    let stats = await Stats.findOne({ userId });
    if (!stats) {
      stats = new Stats({ userId });
    }
    
    // Update level stats
    const levelStats = stats.levelStats[level];
    const gamesPlayed = levelStats.gamesPlayed + 1;
    
    // Calculate new average time
    const totalTime = (levelStats.averageTime * levelStats.gamesPlayed) + timeElapsed;
    const averageTime = totalTime / gamesPlayed;
    
    // Update best time if needed
    const bestTime = levelStats.bestTime === null || timeElapsed < levelStats.bestTime 
      ? timeElapsed 
      : levelStats.bestTime;
    
    // Update high score if needed
    const highScore = Math.max(levelStats.highScore, score);
    
    // Update stats
    stats.levelStats[level] = {
      gamesPlayed,
      bestTime,
      averageTime,
      wordsFound: levelStats.wordsFound + wordsFound,
      highScore
    };
    
    await stats.save();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;