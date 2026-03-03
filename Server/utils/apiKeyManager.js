/**
 * API Key Manager - Handles rotation of multiple Gemini API keys
 * Automatically switches to next key when rate limits are hit
 */

class ApiKeyManager {
  constructor() {
    this.keys = [];
    this.currentIndex = 0;
    this.loadKeys();
  }

  /**
   * Load all API keys from environment variables
   * Supports GEMINI_API_KEY, GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
   */
  loadKeys() {
    // Check for single key (backward compatibility)
    if (process.env.GEMINI_API_KEY) {
      this.keys.push(process.env.GEMINI_API_KEY);
    }

    // Load numbered keys
    let i = 1;
    while (process.env[`GEMINI_API_KEY_${i}`]) {
      this.keys.push(process.env[`GEMINI_API_KEY_${i}`]);
      i++;
    }

    // Remove duplicates
    this.keys = [...new Set(this.keys)];

    if (this.keys.length === 0) {
      console.warn('⚠️  No Gemini API keys found in environment variables');
    } else {
      console.log(`✅ Loaded ${this.keys.length} Gemini API key(s)`);
    }
  }

  /**
   * Get the current API key
   */
  getCurrentKey() {
    if (this.keys.length === 0) {
      return null;
    }
    return this.keys[this.currentIndex];
  }

  /**
   * Rotate to the next API key
   * Returns the new key or null if no keys available
   */
  getNextKey() {
    if (this.keys.length === 0) {
      return null;
    }

    // Move to next key (circular rotation)
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    const newKey = this.keys[this.currentIndex];
    
    console.log(`🔄 Rotating to API key #${this.currentIndex + 1} (of ${this.keys.length})`);
    
    return newKey;
  }

  /**
   * Check if error is a rate limit error (429)
   */
  isRateLimitError(error) {
    if (!error) return false;
    
    const errorStr = error.toString().toLowerCase();
    
    // Check for 429 status code
    if (errorStr.includes('429') || errorStr.includes('resource_exhausted')) {
      return true;
    }
    
    // Check for quota exceeded messages
    if (errorStr.includes('quota exceeded') || 
        errorStr.includes('rate limit') ||
        errorStr.includes('too many requests')) {
      return true;
    }
    
    return false;
  }

  /**
   * Get total number of available keys
   */
  getKeyCount() {
    return this.keys.length;
  }

  /**
   * Reset to first key
   */
  reset() {
    this.currentIndex = 0;
    console.log('🔄 Reset to first API key');
  }
}

// Export singleton instance
module.exports = new ApiKeyManager();
