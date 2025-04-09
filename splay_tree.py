import time
import random

class SplayTreeNode:
    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None

class SplayTree:
    def __init__(self):
        self.root = None
    
    def rotate_right(self, x):
        y = x.left
        x.left = y.right
        y.right = x
        return y
    
    def rotate_left(self, x):
        y = x.right
        x.right = y.left
        y.left = x
        return y
    
    def splay(self, root, key):
        if root is None or root.key == key:
            return root
        
        if root.key > key:
            # Key is in left subtree
            if root.left is None:
                return root
            
            # Zig-Zig (Left Left)
            if root.left.key > key:
                if root.left.left is None:
                    return root
                root.left.left = self.splay(root.left.left, key)
                root = self.rotate_right(root)
            # Zig-Zag (Left Right)
            elif root.left.key < key:
                if root.left.right is None:
                    return root
                root.left.right = self.splay(root.left.right, key)
                if root.left.right is not None:
                    root.left = self.rotate_left(root.left)
            
            if root.left is None:
                return root
            return self.rotate_right(root)
        
        else:
            # Key is in right subtree
            if root.right is None:
                return root
            
            # Zig-Zag (Right Left)
            if root.right.key > key:
                if root.right.left is None:
                    return root
                root.right.left = self.splay(root.right.left, key)
                if root.right.left is not None:
                    root.right = self.rotate_right(root.right)
            # Zig-Zig (Right Right)
            elif root.right.key < key:
                if root.right.right is None:
                    return root
                root.right.right = self.splay(root.right.right, key)
                root = self.rotate_left(root)
            
            if root.right is None:
                return root
            return self.rotate_left(root)
    
    def search(self, key):
        self.root = self.splay(self.root, key)
        return self.root is not None and self.root.key == key
    
    def insert(self, key):
        if self.root is None:
            self.root = SplayTreeNode(key)
            return
        
        self.root = self.splay(self.root, key)
        
        if self.root.key == key:
            return
        
        new_node = SplayTreeNode(key)
        
        if self.root.key > key:
            new_node.right = self.root
            new_node.left = self.root.left
            self.root.left = None
        else:
            new_node.left = self.root
            new_node.right = self.root.right
            self.root.right = None
        
        self.root = new_node

def find_words_with_splay_tree(grid, words, difficulty="medium"):
    """
    Find words in a grid using a splay tree for efficient pattern matching.
    
    Args:
        grid: 2D array representing the word search grid
        words: List of words to find
        difficulty: Controls how quickly the computer finds words ("easy", "medium", "hard")
    
    Returns:
        found_words: List of words found
        time_taken: Time taken to find the words
    """
    start_time = time.time()
    found_words = []
    tree = SplayTree()
    
    # Insert all words into the splay tree
    for word in words:
        tree.insert(word)
    
    # Directions for word search (8 directions)
    directions = [
        (0, 1), (1, 0), (1, 1), (-1, 1),  # right, down, diag-down-right, diag-down-left
        (0, -1), (-1, 0), (-1, -1), (1, -1)  # left, up, diag-up-left, diag-up-right
    ]
    
    # Check if a word can be found starting at position (row, col) in direction (dx, dy)
    def check_word(row, col, dx, dy, word):
        if row < 0 or col < 0 or row >= len(grid) or col >= len(grid[0]):
            return False
        
        # Check if word fits in grid bounds
        end_row = row + dx * (len(word) - 1)
        end_col = col + dy * (len(word) - 1)
        
        if end_row < 0 or end_col < 0 or end_row >= len(grid) or end_col >= len(grid[0]):
            return False
        
        # Check if the word matches in this direction
        for i in range(len(word)):
            r = row + dx * i
            c = col + dy * i
            if grid[r][c] != word[i]:
                return False
        
        return True
    
    # Search for words using splay tree to prioritize search
    for word in words:
        # Use the splay tree to prioritize this word in the search
        tree.search(word)
        
        # Search the grid for this word
        found = False
        for row in range(len(grid)):
            if found:
                break
            for col in range(len(grid[0])):
                if found:
                    break
                # Try all 8 directions
                for dx, dy in directions:
                    if check_word(row, col, dx, dy, word):
                        found_words.append(word)
                        found = True
                        break
    
    # Simulate different thinking times based on difficulty
    elapsed = time.time() - start_time
    delay_factors = {"easy": 1.5, "medium": 1.0, "hard": 0.5}
    factor = delay_factors.get(difficulty, 1.0)
    
    # Calculate target time based on word count and difficulty
    # Easier difficulty means computer takes longer to find words
    target_time = len(words) * factor * 0.5
    
    # Add some randomization to make it seem more human-like
    target_time *= random.uniform(0.8, 1.2)
    
    # Ensure the computer takes a reasonable amount of time
    if elapsed < target_time:
        time.sleep(target_time - elapsed)
    
    # Final time taken including any artificial delay
    time_taken = time.time() - start_time
    
    return found_words, time_taken