// src/contexts/AuthContext.js - Make sure your register function includes name
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for logged in user on mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  // Register a new user
  const register = async (email, name, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        email,
        name,
        password
      });
      
      if (response.data.success) {
        const user = response.data.user;
        // Save user to localStorage
        localStorage.setItem('user', JSON.stringify(user));
        setCurrentUser(user);
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Log in an existing user
  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      
      if (response.data.success) {
        const user = response.data.user;
        // Save user to localStorage
        localStorage.setItem('user', JSON.stringify(user));
        setCurrentUser(user);
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  // Log out the current user
  const logout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    register,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}