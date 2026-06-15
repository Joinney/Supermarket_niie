#!/usr/bin/env node

/**
 * ADMIN SCRIPT - Batch Description Generation Manager
 * 
 * Usage:
 * - Generate for all products without descriptions:
 *   node admin-batch-generator.js all
 * 
 * - Generate for specific products:
 *   node admin-batch-generator.js batch prod-001 prod-002 prod-003
 * 
 * - Generate by category (fetch products from specific category):
 *   node admin-batch-generator.js category banh-mi-cafe
 * 
 * Before running:
 * 1. Set OPENAI_API_KEY in .env
 * 2. Start product service: npm start
 * 3. Run this script from product-service directory
 */

import axios from 'axios';
import { command } from './utils/cliHelper.js'; // Optional: for better CLI UX

const BASE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5001/api';
const productApi = axios.create({ baseURL: BASE_URL });

const BATCH_SIZE = 50; // Process 50 products at a time

class DescriptionGenerator {
  constructor() {
    this.totalProcessed = 0;
    this.totalSuccessful = 0;
    this.totalFailed = 0;
    this.startTime = Date.now();
  }

  log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: '📌',
      success: '✅',
      error: '❌',
      warning: '⚠️ ',
      progress: '⏳',
    }[level] || '•';

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  async generateAll() {
    this.log('Starting full catalog generation...', 'progress');

    let offset = 0;
    let totalProducts = 0;

    while (true) {
      try {
        // Fetch products needing descriptions
        const response = await productApi.get(
          `/products/without-descriptions?limit=${BATCH_SIZE}&offset=${offset}`
        );

        const products = response.data.data;
        totalProducts = response.data.pagination.total;

        if (products.length === 0) break;

        const productIds = products.map((p) => p.ma_san_pham);

        this.log(
          `Processing batch (${offset + 1}-${Math.min(offset + BATCH_SIZE, totalProducts)}/${totalProducts})...`,
          'progress'
        );

        // Generate descriptions
        const result = await this.generateBatch(productIds);

        this.totalSuccessful += result.summary.successful;
        this.totalFailed += result.summary.failed;
        this.totalProcessed += result.summary.total;

        // Log progress
        const successRate = (
          (this.totalSuccessful / this.totalProcessed) *
          100
        ).toFixed(1);
        this.log(
          `✓ Generated ${this.totalSuccessful}/${this.totalProcessed} (${successRate}% success)`,
          'success'
        );

        offset += BATCH_SIZE;

        // Respect rate limits - wait 1 second between batches
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        this.log(`Error fetching batch at offset ${offset}: ${error.message}`, 'error');
        break;
      }
    }

    this.printSummary(totalProducts);
  }

  async generateBatch(productIds) {
    try {
      const response = await productApi.post('/products/batch-generate-descriptions', {
        productIds,
        language: 'vi',
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  async generateCategory(categorySlug) {
    this.log(`Fetching products from category: ${categorySlug}`, 'info');

    try {
      const response = await productApi.get(`/products/category/${categorySlug}`);
      const products = response.data;

      if (products.length === 0) {
        this.log('No products found in category', 'warning');
        return;
      }

      // Filter products without descriptions
      const needsDesc = products.filter(
        (p) =>
          !p.mo_ta_ngan ||
          p.mo_ta_ngan === '' ||
          p.mo_ta_ngan === 'Sản phẩm tuyển chọn từ Demi Mart.'
      );

      if (needsDesc.length === 0) {
        this.log('All products in this category already have descriptions', 'info');
        return;
      }

      this.log(`Found ${needsDesc.length} products needing descriptions`, 'info');

      // Process in batches
      for (let i = 0; i < needsDesc.length; i += BATCH_SIZE) {
        const batch = needsDesc.slice(i, i + BATCH_SIZE);
        const productIds = batch.map((p) => p.ma_san_pham);

        this.log(
          `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`,
          'progress'
        );

        const result = await this.generateBatch(productIds);
        this.totalSuccessful += result.summary.successful;
        this.totalFailed += result.summary.failed;
        this.totalProcessed += result.summary.total;

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      this.printSummary(needsDesc.length);
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
    }
  }

  async generateSpecific(productIds) {
    this.log(`Generating descriptions for ${productIds.length} products...`, 'progress');

    try {
      const result = await this.generateBatch(productIds);

      this.totalSuccessful = result.summary.successful;
      this.totalFailed = result.summary.failed;
      this.totalProcessed = result.summary.total;

      // Print results
      if (result.results.successful.length > 0) {
        this.log('✅ Successfully generated:', 'success');
        result.results.successful.forEach((item) => {
          console.log(`   • ${item.ma_san_pham}: "${item.description}"`);
        });
      }

      if (result.results.failed.length > 0) {
        this.log('❌ Failed to generate:', 'error');
        result.results.failed.forEach((item) => {
          console.log(`   • ${item.ma_san_pham}: ${item.error}`);
        });
      }

      this.printSummary(productIds.length);
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
    }
  }

  printSummary(total) {
    const duration = this.formatDuration(Date.now() - this.startTime);
    const successRate = ((this.totalSuccessful / this.totalProcessed) * 100).toFixed(1);

    console.log('\n' + '='.repeat(60));
    console.log('📊 GENERATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Products:    ${total}`);
    console.log(`Processed:         ${this.totalProcessed}`);
    console.log(`Successful:        ${this.totalSuccessful} ✅`);
    console.log(`Failed:            ${this.totalFailed} ❌`);
    console.log(`Success Rate:      ${successRate}%`);
    console.log(`Duration:          ${duration}`);
    console.log('='.repeat(60) + '\n');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║ 🤖 BATCH DESCRIPTION GENERATION MANAGER                    ║
╚════════════════════════════════════════════════════════════╝

Usage:
  node admin-batch-generator.js <command> [args]

Commands:
  all                 Generate for all products without descriptions
  batch <ids...>      Generate for specific product IDs
  category <slug>     Generate for all products in a category

Examples:
  node admin-batch-generator.js all
  node admin-batch-generator.js batch prod-001 prod-002 prod-003
  node admin-batch-generator.js category banh-mi-cafe

Configuration:
  • Set OPENAI_API_KEY in .env file
  • Ensure product service is running on port 5001
  • Batch size: 50 products per API call
    `);
    process.exit(1);
  }

  const generator = new DescriptionGenerator();
  const command = args[0];

  try {
    if (command === 'all') {
      await generator.generateAll();
    } else if (command === 'batch') {
      const productIds = args.slice(1);
      if (productIds.length === 0) {
        console.error('❌ No product IDs provided');
        process.exit(1);
      }
      await generator.generateSpecific(productIds);
    } else if (command === 'category') {
      const categorySlug = args[1];
      if (!categorySlug) {
        console.error('❌ No category slug provided');
        process.exit(1);
      }
      await generator.generateCategory(categorySlug);
    } else {
      console.error(`❌ Unknown command: ${command}`);
      process.exit(1);
    }
  } catch (error) {
    generator.log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  }
}

main();
