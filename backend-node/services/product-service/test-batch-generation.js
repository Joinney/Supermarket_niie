#!/usr/bin/env node

/**
 * QUICK TEST SCRIPT - Batch Description Generation
 * Run this from the product-service directory to test the endpoints
 * 
 * Before running:
 * 1. Add OPENAI_API_KEY=sk-proj-xxxx to .env
 * 2. Start the product service: npm start
 * 3. Run: node test-batch-generation.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';
const productApi = axios.create({ baseURL: BASE_URL });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoints() {
  try {
    log('\n🧪 TESTING BATCH DESCRIPTION GENERATION\n', 'cyan');

    // Test 1: Get products without descriptions
    log('📍 Test 1: Fetching products without descriptions...', 'yellow');
    const listResponse = await productApi.get('/products/without-descriptions?limit=5');
    const productsNeedingDesc = listResponse.data.data;

    log(`✅ Found ${productsNeedingDesc.length} products\n`, 'green');
    
    if (productsNeedingDesc.length === 0) {
      log('⚠️  No products found needing descriptions. All products have descriptions!', 'yellow');
      return;
    }

    productsNeedingDesc.forEach((p, i) => {
      log(`  ${i + 1}. ${p.ten_san_pham} (${p.ma_san_pham})`, 'cyan');
    });

    // Test 2: Batch generate descriptions for first 3 products
    const productIds = productsNeedingDesc.slice(0, 3).map((p) => p.ma_san_pham);
    
    log(`\n📍 Test 2: Generating descriptions for ${productIds.length} products...`, 'yellow');
    log(`Products: ${productIds.join(', ')}\n`, 'cyan');

    const generateResponse = await productApi.post('/products/batch-generate-descriptions', {
      productIds,
      language: 'vi',
    });

    const result = generateResponse.data;

    log(`✅ Generation Complete!\n`, 'green');
    log(`Summary:`, 'cyan');
    log(`  - Total: ${result.summary.total}`, 'cyan');
    log(`  - Successful: ${result.summary.successful}`, 'green');
    log(`  - Failed: ${result.summary.failed}\n`, result.summary.failed > 0 ? 'red' : 'green');

    if (result.results.successful.length > 0) {
      log('✅ Generated Descriptions:', 'green');
      result.results.successful.forEach((item) => {
        log(`\n  Product: ${item.ma_san_pham}`, 'cyan');
        log(`  Description: "${item.description}"`, 'green');
      });
    }

    if (result.results.failed.length > 0) {
      log('\n❌ Failed Generations:', 'red');
      result.results.failed.forEach((item) => {
        log(`  - ${item.ma_san_pham}: ${item.error}`, 'red');
      });
    }

    log('\n✅ All tests completed!', 'green');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log(`\n❌ Connection Error: Service not running at ${BASE_URL}`, 'red');
      log('   Start the service with: npm start', 'yellow');
    } else if (error.response?.status === 400) {
      log(`\n❌ Bad Request: ${error.response.data.message}`, 'red');
    } else if (error.response?.status === 500) {
      log(`\n❌ Server Error: ${error.response.data.error}`, 'red');
      log('   Check if OPENAI_API_KEY is set in .env', 'yellow');
    } else {
      log(`\n❌ Error: ${error.message}`, 'red');
    }
    process.exit(1);
  }
}

testEndpoints();
