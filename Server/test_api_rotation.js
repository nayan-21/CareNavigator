/**
 * Test script to verify API key rotation is working
 * Run this with: node test_api_rotation.js
 */

require('dotenv').config();
const apiKeyManager = require('./utils/apiKeyManager');
const { analyzeSymptoms } = require('./utils/gemini');

console.log('\n========================================');
console.log('🧪 Testing API Key Rotation System');
console.log('========================================\n');

// Test 1: Check if keys are loaded
console.log('Test 1: Checking loaded API keys...');
const keyCount = apiKeyManager.getKeyCount();
console.log(`   Found ${keyCount} API key(s)\n`);

if (keyCount === 0) {
  console.error('❌ FAILED: No API keys found!');
  console.log('   Please add API keys to your .env file:');
  console.log('   GEMINI_API_KEY_1=your_first_key');
  console.log('   GEMINI_API_KEY_2=your_second_key');
  console.log('   etc.\n');
  process.exit(1);
}

console.log('✅ PASSED: API keys loaded successfully\n');

// Test 2: Check current key
console.log('Test 2: Getting current API key...');
const currentKey = apiKeyManager.getCurrentKey();
if (currentKey) {
  console.log(`   Current key: ${currentKey.substring(0, 10)}...${currentKey.substring(currentKey.length - 4)}`);
  console.log('✅ PASSED: Current key retrieved\n');
} else {
  console.error('❌ FAILED: Could not get current key\n');
  process.exit(1);
}

// Test 3: Test key rotation
console.log('Test 3: Testing key rotation...');
const firstKey = apiKeyManager.getCurrentKey();
const secondKey = apiKeyManager.getNextKey();

if (keyCount > 1) {
  if (firstKey !== secondKey) {
    console.log('✅ PASSED: Key rotation working (switched to different key)\n');
  } else {
    console.log('⚠️  WARNING: Only one unique key found (rotation will use same key)\n');
  }
} else {
  console.log('⚠️  INFO: Only one key available (add more keys to test rotation)\n');
}

// Reset to first key for actual test
apiKeyManager.reset();

// Test 4: Test rate limit error detection
console.log('Test 4: Testing rate limit error detection...');
const testError1 = new Error('API request failed with status 429: quota exceeded');
const testError2 = new Error('RESOURCE_EXHAUSTED');
const testError3 = new Error('Some other error');

const isRateLimit1 = apiKeyManager.isRateLimitError(testError1);
const isRateLimit2 = apiKeyManager.isRateLimitError(testError2);
const isRateLimit3 = apiKeyManager.isRateLimitError(testError3);

if (isRateLimit1 && isRateLimit2 && !isRateLimit3) {
  console.log('✅ PASSED: Rate limit detection working correctly\n');
} else {
  console.error('❌ FAILED: Rate limit detection not working properly\n');
}

// Test 5: Make actual API call
console.log('Test 5: Making actual API call to Gemini...');
console.log('   Testing with symptoms: "fever and headache"\n');

analyzeSymptoms('fever and headache', 'Ahmedabad')
  .then(result => {
    console.log('✅ PASSED: API call successful!');
    console.log('\n   Response received:');
    console.log('   - Possible diseases:', result.possible_diseases?.length || 0);
    console.log('   - Speciality:', result.speciality);
    console.log('   - Urgency:', result.urgency);
    console.log('   - Confidence:', result.confidence);
    
    console.log('\n========================================');
    console.log('✅ All Tests Completed Successfully!');
    console.log('========================================\n');
    
    if (keyCount === 1) {
      console.log('💡 TIP: Add more API keys to your .env file to enable rotation:');
      console.log('   GEMINI_API_KEY_1=your_first_key');
      console.log('   GEMINI_API_KEY_2=your_second_key');
      console.log('   GEMINI_API_KEY_3=your_third_key\n');
    }
  })
  .catch(error => {
    console.error('❌ FAILED: API call failed');
    console.error('   Error:', error.message);
    console.log('\n   This could mean:');
    console.log('   1. All your API keys have hit their rate limit');
    console.log('   2. Invalid API key(s)');
    console.log('   3. Network connection issue\n');
    
    console.log('   Check gemini_error.txt for detailed error information\n');
  });
