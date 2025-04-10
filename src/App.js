// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StatsProvider } from './contexts/StatsContext';
import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';
import LevelSelect from './components/LevelSelect';
import Game from './components/Game';
import Stats from './components/Stats';
import Leaderboard from './components/Leaderboard';
import VersusMode from './components/VersusMode';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <StatsProvider>
        <Router>
          <div className="app">
            <Header />
            <div className="container">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/levels" element={<LevelSelect />} />
                <Route path="/game/:level" element={<Game />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/" element={<LevelSelect />} />
                <Route path="/versus" element={<VersusMode />} />
              </Routes>
            </div>
          </div>
        </Router>
      </StatsProvider>
    </AuthProvider>
  );
}

export default App;