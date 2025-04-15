// src/utils/trie.js
class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
    this.word = null;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  // Insert a word into the trie
  insert(word) {
    let node = this.root;
    const upperWord = word.toUpperCase();
    
    for (const char of upperWord) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    
    node.isEndOfWord = true;
    node.word = upperWord;
  }

  // Search for a word in the trie
  search(word) {
    let node = this.root;
    const upperWord = word.toUpperCase();
    
    for (const char of upperWord) {
      if (!node.children[char]) {
        return false;
      }
      node = node.children[char];
    }
    
    return node.isEndOfWord;
  }

  // Get all words in the trie
  getAllWords() {
    const result = [];
    
    function dfs(node, prefix) {
      if (node.isEndOfWord) {
        result.push(prefix);
      }
      
      for (const char in node.children) {
        dfs(node.children[char], prefix + char);
      }
    }
    
    dfs(this.root, "");
    return result;
  }
}

export default Trie;