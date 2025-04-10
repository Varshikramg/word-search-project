// models/Stats.js
const mongoose = require('mongoose');

const StatsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  levelStats: {
    easy: {
      gamesPlayed: { type: Number, default: 0 },
      bestTime: { type: Number, default: null },
      averageTime: { type: Number, default: 0 },
      wordsFound: { type: Number, default: 0 },
      highScore: { type: Number, default: 0 }
    },
    medium: {
      gamesPlayed: { type: Number, default: 0 },
      bestTime: { type: Number, default: null },
      averageTime: { type: Number, default: 0 },
      wordsFound: { type: Number, default: 0 },
      highScore: { type: Number, default: 0 }
    },
    hard: {
      gamesPlayed: { type: Number, default: 0 },
      bestTime: { type: Number, default: null },
      averageTime: { type: Number, default: 0 },
      wordsFound: { type: Number, default: 0 },
      highScore: { type: Number, default: 0 }
    }
  }
});

module.exports = mongoose.model('Stats', StatsSchema);