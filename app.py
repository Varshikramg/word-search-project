from flask import Flask, request, jsonify
import random
import json
from flask_cors import CORS
import os
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database setup
def get_db_connection():
    conn = sqlite3.connect('wordsearch.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL
    )
    ''')
    
    # Create stats table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS game_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        level TEXT NOT NULL,
        score INTEGER NOT NULL,
        time_elapsed REAL NOT NULL,
        words_found INTEGER NOT NULL,
        date_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Create leaderboard table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS leaderboard (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        username TEXT NOT NULL,
        level TEXT NOT NULL,
        score INTEGER NOT NULL,
        time_elapsed REAL NOT NULL,
        date_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database
init_db()

# Word Search Grid Generation Functions
def generate_grid(size, words):
    # Create an empty grid filled with None
    grid = [[None for _ in range(size)] for _ in range(size)]
    
    # Try to place each word in the grid
    placed_words = []
    for word in words:
        if place_word(grid, word):
            placed_words.append(word)
    
    # Fill empty cells with random letters
    for i in range(size):
        for j in range(size):
            if grid[i][j] is None:
                grid[i][j] = random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    
    return grid, placed_words

def place_word(grid, word):
    size = len(grid)
    word = word.upper()
    
    # Try multiple times to place the word
    for _ in range(100):
        # Choose a random starting position
        row = random.randint(0, size - 1)
        col = random.randint(0, size - 1)
        
        # Choose a random direction
        directions = [
            (0, 1),   # right
            (1, 0),   # down
            (0, -1),  # left
            (-1, 0),  # up
            (1, 1),   # down-right
            (-1, -1), # up-left
            (1, -1),  # down-left
            (-1, 1)   # up-right
        ]
        direction = random.choice(directions)
        
        # Check if the word fits
        if fits(grid, word, row, col, direction):
            # Place the word
            for i in range(len(word)):
                grid[row + i * direction[0]][col + i * direction[1]] = word[i]
            return True
    
    return False

def fits(grid, word, row, col, direction):
    size = len(grid)
    
    # Check if the word would go out of bounds
    for i in range(len(word)):
        r = row + i * direction[0]
        c = col + i * direction[1]
        
        if r < 0 or r >= size or c < 0 or c >= size:
            return False
        
        # Check if the cell is already occupied by a different letter
        if grid[r][c] is not None and grid[r][c] != word[i]:
            return False
    
    return True

# Word Bank for different difficulty levels
word_banks = {
    "easy": [
        "CAT", "DOG", "SUN", "RUN", "JUMP", "PLAY", "FISH", "BIRD", "CAKE", "TREE",
        "BALL", "KITE", "SAND", "STAR", "MOON", "BOOK", "DESK", "LEAF", "HOME", "MILK"
    ],
    "medium": [
        "PYTHON", "CODING", "SCRIPT", "FUNCTION", "VARIABLE", "BROWSER", "DATABASE", "SERVER",
        "CLIENT", "WEBSITE", "NETWORK", "KEYBOARD", "MONITOR", "STORAGE", "MEMORY", "PROGRAM"
    ],
    "hard": [
        "ALGORITHM", "JAVASCRIPT", "ENCRYPTION", "AUTHENTICATION", "FRAMEWORKS", "DEPLOYMENT",
        "INTERFACE", "VALIDATION", "MIDDLEWARE", "RESPONSIVE", "CONTAINER", "VIRTUALIZATION",
        "CONCURRENCY", "MICROSERVICE", "DEVELOPMENT", "INTEGRATION", "ARCHITECTURE", "REPOSITORY"
    ]
}

# AI difficulty settings for versus mode
ai_difficulties = {
    "easy": {"delay": 8000, "mistake_rate": 0.4, "words_to_find": 0.4},
    "medium": {"delay": 5000, "mistake_rate": 0.2, "words_to_find": 0.7},
    "hard": {"delay": 3000, "mistake_rate": 0.05, "words_to_find": 0.9}
}

# Routes
@app.route('/api/game/generate', methods=['POST'])
def generate_game():
    data = request.json
    level = data.get('level', 'medium')
    custom_words = data.get('words', None)  # Allow passing specific words
    
    # Determine grid size based on level
    if level == 'easy':
        size = 8
        num_words = 8
    elif level == 'medium':
        size = 10
        num_words = 12
    else:  # hard
        size = 12
        num_words = 16
    
    # Select words - either use provided words or select random ones
    if custom_words:
        selected_words = custom_words
    else:
        selected_words = random.sample(word_banks[level], num_words)
    
    # Generate the grid
    grid, placed_words = generate_grid(size, selected_words)
    
    return jsonify({
        'grid': grid,
        'words': placed_words
    })

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    name = data.get('name')
    password = data.get('password')  # In a real app, you would hash this
    
    if not email or not name or not password:
        return jsonify({'success': False, 'message': 'All fields are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('INSERT INTO users (email, name, password) VALUES (?, ?, ?)',
                      (email, name, password))
        conn.commit()
        
        user_id = cursor.lastrowid
        user = {'id': user_id, 'email': email, 'name': name}
        
        return jsonify({'success': True, 'user': user})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'Email already exists'}), 400
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE email = ? AND password = ?', (email, password))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            'success': True, 
            'user': {
                'id': user['id'], 
                'email': user['email'], 
                'name': user['name']
            }
        })
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/stats/update', methods=['POST'])
def update_stats():
    data = request.json
    user_id = data.get('userId')
    level = data.get('level')
    score = data.get('score')
    time_elapsed = data.get('timeElapsed')
    words_found = data.get('wordsFound')
    username = data.get('username', 'Anonymous')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Insert game stats
    cursor.execute('''
    INSERT INTO game_stats (user_id, level, score, time_elapsed, words_found)
    VALUES (?, ?, ?, ?, ?)
    ''', (user_id, level, score, time_elapsed, words_found))
    
    # Update leaderboard
    cursor.execute('''
    INSERT INTO leaderboard (user_id, username, level, score, time_elapsed)
    VALUES (?, ?, ?, ?, ?)
    ''', (user_id, username, level, score, time_elapsed))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    level = request.args.get('level', 'medium')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
    SELECT username, score, time_elapsed, date_played
    FROM leaderboard
    WHERE level = ?
    ORDER BY score DESC, time_elapsed ASC
    LIMIT 10
    ''', (level,))
    
    results = cursor.fetchall()
    conn.close()
    
    leaderboard = []
    for row in results:
        leaderboard.append({
            'username': row['username'],
            'score': row['score'],
            'time': row['time_elapsed'],
            'date': row['date_played']
        })
    
    return jsonify(leaderboard)

@app.route('/api/versus/find-words', methods=['POST'])
def computer_find_words():
    data = request.json
    grid = data.get('grid', [])
    available_words = data.get('words', [])
    difficulty = data.get('difficulty', 'medium')
    
    # Get AI difficulty settings
    ai_settings = ai_difficulties[difficulty]
    
    # Determine how many words the AI should find based on difficulty
    words_to_find = int(len(available_words) * ai_settings['words_to_find'])
    
    # Simulating AI finding words
    # In a real implementation, you would have an algorithm to find words in the grid
    # For now, we'll just randomly select from the available words
    found_words = random.sample(available_words, min(words_to_find, len(available_words)))
    
    return jsonify({
        'foundWords': found_words
    })

@app.route('/api/user/stats', methods=['GET'])
def get_user_stats():
    user_id = request.args.get('userId')
    
    if not user_id:
        return jsonify({'success': False, 'message': 'User ID required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get overall stats
    cursor.execute('''
    SELECT 
        COUNT(*) as games_played,
        AVG(time_elapsed) as avg_time,
        MIN(time_elapsed) as best_time,
        SUM(words_found) as total_words,
        MAX(score) as high_score,
        level
    FROM game_stats
    WHERE user_id = ?
    GROUP BY level
    ''', (user_id,))
    
    results = cursor.fetchall()
    conn.close()
    
    stats = {
        'easy': {'gamesPlayed': 0, 'bestTime': None, 'averageTime': 0, 'wordsFound': 0, 'highScore': 0},
        'medium': {'gamesPlayed': 0, 'bestTime': None, 'averageTime': 0, 'wordsFound': 0, 'highScore': 0},
        'hard': {'gamesPlayed': 0, 'bestTime': None, 'averageTime': 0, 'wordsFound': 0, 'highScore': 0}
    }
    
    for row in results:
        level = row['level']
        stats[level] = {
            'gamesPlayed': row['games_played'],
            'bestTime': row['best_time'],
            'averageTime': row['avg_time'],
            'wordsFound': row['total_words'],
            'highScore': row['high_score']
        }
    
    return jsonify(stats)

if __name__ == '__main__':
    app.run(debug=True)