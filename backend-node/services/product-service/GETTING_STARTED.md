# 🚀 Getting Started: Batch Description Generation

## What Was Built

A complete backend system to automatically generate product descriptions using OpenAI's GPT-3.5-turbo API and store them in your database.

### Components

| Component | Purpose |
|-----------|---------|
| `utils/aiDescriptionGenerator.js` | AI API integration & batch processing |
| `controllers/productController.js` | API endpoints for generation & listing |
| `routes/productRoutes.js` | Route definitions |
| `.env` | Configuration (OpenAI API key) |
| `BATCH_DESCRIPTION_GENERATION.md` | Full documentation (200+ lines) |
| `admin-batch-generator.js` | CLI tool for batch operations |
| `test-batch-generation.js` | Testing script |

---

## Setup (5 minutes)

### Step 1: Get OpenAI API Key
1. Go to https://platform.openai.com/account/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-`)

### Step 2: Add to Environment
Edit `.env` in `backend-node/services/product-service/`:
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx
```

### Step 3: Restart Service
```bash
# In product-service directory
npm start
```

---

## Quick Test (1 minute)

Test the endpoint before running full batch:

```bash
# In product-service directory
node test-batch-generation.js
```

**Expected Output:**
```
🧪 TESTING BATCH DESCRIPTION GENERATION

📍 Test 1: Fetching products without descriptions...
✅ Found 5 products

  1. Bánh mì nước ngoài (prod-001)
  2. Bánh sandwich (prod-002)
  ...

📍 Test 2: Generating descriptions for 3 products...
Products: prod-001, prod-002, prod-003

✅ Generation Complete!
Summary:
  - Total: 3
  - Successful: 3
  - Failed: 0

✅ Generated Descriptions:

  Product: prod-001
  Description: "Bánh mì tươi mới hàng ngày từ lò nướng Demi. Vỏ giòn, ruột mềm..."
```

---

## Generate Descriptions

### Option 1: CLI Script (Recommended for First Time)

```bash
# Generate all products without descriptions
node admin-batch-generator.js all

# Generate specific products
node admin-batch-generator.js batch prod-001 prod-002 prod-003

# Generate all products in a category
node admin-batch-generator.js category banh-mi-cafe
```

### Option 2: HTTP API (For Integration)

```bash
curl -X POST http://localhost:5001/api/products/batch-generate-descriptions \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["prod-001", "prod-002", "prod-003"],
    "language": "vi"
  }'
```

### Option 3: JavaScript (For Frontend Admin Panel)

```javascript
import axios from 'axios';

const productApi = axios.create({
  baseURL: 'http://localhost:5001/api',
});

// List products needing descriptions
const { data: list } = await productApi.get('/products/without-descriptions?limit=50');
console.log(`Found ${list.data.length} products to process`);

// Generate descriptions for first batch
const productIds = list.data.map(p => p.ma_san_pham);
const { data: result } = await productApi.post('/products/batch-generate-descriptions', {
  productIds,
  language: 'vi',
});

console.log(`✅ ${result.summary.successful}/${result.summary.total} descriptions generated`);
```

---

## Verify in Frontend

1. Start frontend: `npm run dev` (in frontend-web)
2. Navigate to any product detail page
3. Check if short description now displays (instead of "Sản phẩm tuyển chọn từ Demi Mart.")

**Before:**
```
"Sản phẩm tuyển chọn từ Demi Mart."
```

**After:**
```
"Bánh mì tươi mới hàng ngày từ lò nướng Demi. Vỏ giòn, ruột mềm, hương thơm tự nhiên."
```

---

## Scaling Guide

### Small Catalog (100-500 products)
```bash
# Run once and you're done
node admin-batch-generator.js all
# Takes: 5-10 minutes
# Cost: $0.15-$0.75
```

### Medium Catalog (500-2000 products)
```bash
# Generate by category to avoid rate limits
node admin-batch-generator.js category banh-mi-cafe
node admin-batch-generator.js category nuoc-uong
# Takes: 30-60 minutes
# Cost: $0.75-$3.00
```

### Large Catalog (2000+ products)
```javascript
// Use custom script with longer delays
const BATCH_SIZE = 50;
const DELAY_MS = 2000; // 2 second delay between batches

// or schedule as cron job to run nightly
```

---

## Monitoring

Watch backend console for progress:

```
🚀 Starting batch description generation for 100 products...
📦 Found 100 products to process
⏳ Generating description 1/100 for: Bánh mì nước ngoài
⏳ Generating description 2/100 for: Bánh sandwich
...
✅ Generated 98 descriptions, 2 failures
💾 Updated 98 products in database
```

---

## Troubleshooting

### Error: "OPENAI_API_KEY not configured"
**Fix:** Add `OPENAI_API_KEY=sk-proj-xxx` to `.env`

### Error: "Connection refused"
**Fix:** Ensure product service is running (`npm start`)

### No products returned from `/without-descriptions`
**Fix:** All products already have descriptions! ✅

### Generation fails for some products
**Fix:** Usually API rate limits or character encoding issues
- Solution: Retry with smaller batch size or longer delays

### Descriptions seem generic
**Fix:** Adjust the prompt in `utils/aiDescriptionGenerator.js` for your domain

---

## API Reference

### POST /api/products/batch-generate-descriptions
Generate AI descriptions for products

**Request:**
```json
{
  "productIds": ["prod-001", "prod-002"],
  "language": "vi"
}
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  },
  "results": {
    "successful": [
      {
        "ma_san_pham": "prod-001",
        "description": "Bánh mì tươi mới..."
      }
    ],
    "failed": []
  }
}
```

### GET /api/products/without-descriptions
Fetch products needing descriptions

**Query Params:**
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ma_san_pham": "prod-001",
      "ten_san_pham": "Bánh mì nước ngoài",
      "ten_danh_muc": "Bánh & Pasta",
      "mo_ta_ngan": "Sản phẩm tuyển chọn từ Demi Mart.",
      "ngay_tao": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 250,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Costs

| Scenario | Products | Cost | Time |
|----------|----------|------|------|
| Test | 5 | $0.008 | 1 min |
| Small batch | 50 | $0.075 | 5 min |
| Medium catalog | 1000 | $1.50 | 17 min |
| Large catalog | 5000 | $7.50 | 85 min |

**ROI:** Saves ~$2500 vs manual entry for 1000 products!

---

## Advanced: Auto-Scheduled Generation

Want descriptions to auto-generate for new products? Add to your cron:

```javascript
// Schedule: Every night at 2 AM
import cron from 'node-cron';

cron.schedule('0 2 * * *', async () => {
  console.log('Running nightly description generation...');
  const response = await productApi.get('/products/without-descriptions?limit=100');
  const productIds = response.data.data.map(p => p.ma_san_pham);
  
  if (productIds.length > 0) {
    await productApi.post('/products/batch-generate-descriptions', {
      productIds,
      language: 'vi',
    });
  }
});
```

---

## Next Steps

1. ✅ **Setup** - Add OpenAI API key to .env
2. ✅ **Test** - Run `test-batch-generation.js`
3. ✅ **Generate** - Run `admin-batch-generator.js all`
4. ✅ **Verify** - Check frontend product pages
5. ✅ **Automate** (Optional) - Schedule nightly generation

---

## Documentation

- **Full Guide:** `BATCH_DESCRIPTION_GENERATION.md`
- **Implementation:** `utils/aiDescriptionGenerator.js`
- **API Routes:** `routes/productRoutes.js`
- **Controller:** `controllers/productController.js`

---

## Support

**Issues?**
1. Check backend logs for errors
2. Verify `.env` has valid `OPENAI_API_KEY`
3. Ensure service is running on port 5001
4. Review `BATCH_DESCRIPTION_GENERATION.md` troubleshooting section

**Questions?**
- See full documentation: `BATCH_DESCRIPTION_GENERATION.md`
- Check API reference at bottom of this file
- Review test script: `test-batch-generation.js`

---

## Summary

You now have:
- ✅ Automatic AI description generation
- ✅ Database integration (updates `mo_ta_ngan`)
- ✅ REST API endpoints
- ✅ CLI admin tools
- ✅ Testing scripts
- ✅ Comprehensive documentation

**Next: Add your OpenAI key and run `node admin-batch-generator.js all` to get started!** 🚀

