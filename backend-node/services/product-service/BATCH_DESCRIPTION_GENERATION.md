# Batch Product Description Generation via AI

## Overview

This system allows you to automatically generate product descriptions for your entire product catalog using OpenAI's API. Generated descriptions are stored in the `mo_ta_ngan` field and displayed on ProductDetail.jsx.

## Setup

### 1. Get OpenAI API Key

1. Create account at https://platform.openai.com
2. Go to Account Settings → API Keys → Create new secret key
3. Copy the API key
4. Add to `.env` file in product-service:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
```

### 2. Install Dependencies

The required `axios` is already installed in your package.json.

## API Endpoints

### 1. Batch Generate Descriptions

**Endpoint:** `POST /api/products/batch-generate-descriptions`

**Purpose:** Generate AI descriptions for multiple products and store them in database

**Request Body:**
```json
{
  "productIds": ["prod-001", "prod-002", "prod-003"],
  "language": "vi"
}
```

**Parameters:**
- `productIds` (required): Array of product IDs (max 100 per request)
- `language` (optional): "vi" | "en" | "zh" (default: "vi")

**Response (Success):**
```json
{
  "success": true,
  "message": "Batch description generation completed. 3 products updated.",
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0
  },
  "results": {
    "successful": [
      {
        "ma_san_pham": "prod-001",
        "description": "Bánh mì tươi mới hàng ngày từ lò nướng Demi. Vỏ giòn, ruột mềm, hương thơm tự nhiên."
      }
    ],
    "failed": []
  }
}
```

**Response (Error - Oversized Request):**
```json
{
  "success": false,
  "message": "Maximum 100 products per request. Please split into multiple requests."
}
```

---

### 2. Get Products Without Descriptions

**Endpoint:** `GET /api/products/without-descriptions?limit=50&offset=0`

**Purpose:** Fetch products that need descriptions (for admin dashboard or batch selection)

**Query Parameters:**
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

## Usage Examples

### Using cURL

```bash
# Get list of products needing descriptions
curl -X GET http://localhost:5001/api/products/without-descriptions?limit=10

# Generate descriptions for first batch
curl -X POST http://localhost:5001/api/products/batch-generate-descriptions \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["prod-001", "prod-002", "prod-003"],
    "language": "vi"
  }'
```

### Using JavaScript (Node.js/Frontend)

```javascript
import axios from 'axios';

const productApi = axios.create({
  baseURL: 'http://localhost:5001/api',
});

// Get products needing descriptions
async function getProductsForGeneration() {
  try {
    const response = await productApi.get('/products/without-descriptions?limit=50');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

// Batch generate descriptions
async function generateDescriptions(productIds) {
  try {
    const response = await productApi.post('/products/batch-generate-descriptions', {
      productIds,
      language: 'vi',
    });
    console.log('Generation report:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error generating descriptions:', error);
  }
}

// Example: Generate for 50 products
const productsNeedingDescriptions = await getProductsForGeneration();
const productIds = productsNeedingDescriptions.map((p) => p.ma_san_pham);
const result = await generateDescriptions(productIds);
```

### Using Python

```python
import requests
import json

BASE_URL = 'http://localhost:5001/api'

# Get products without descriptions
response = requests.get(f'{BASE_URL}/products/without-descriptions?limit=50')
products = response.json()['data']
product_ids = [p['ma_san_pham'] for p in products]

# Batch generate descriptions
payload = {
    'productIds': product_ids[:50],  # First 50
    'language': 'vi'
}
response = requests.post(
    f'{BASE_URL}/products/batch-generate-descriptions',
    json=payload,
    headers={'Content-Type': 'application/json'}
)
print(json.dumps(response.json(), indent=2))
```

---

## Implementation Strategy

### Option 1: Small Batch (Manual)
```javascript
// Generate for 10-20 products at a time
const firstBatch = productIds.slice(0, 20);
const result1 = await generateDescriptions(firstBatch);
console.log(`✅ Batch 1: ${result1.summary.successful}/${result1.summary.total}`);

const secondBatch = productIds.slice(20, 40);
const result2 = await generateDescriptions(secondBatch);
console.log(`✅ Batch 2: ${result2.summary.successful}/${result2.summary.total}`);
```

### Option 2: Full Catalog (Automated)
```javascript
async function generateAllDescriptions() {
  const batchSize = 50;
  let offset = 0;
  let totalGenerated = 0;

  while (true) {
    // Fetch next batch of products needing descriptions
    const response = await productApi.get(
      `/products/without-descriptions?limit=${batchSize}&offset=${offset}`
    );
    
    const products = response.data.data;
    if (products.length === 0) break;

    const productIds = products.map((p) => p.ma_san_pham);
    
    // Generate descriptions
    const result = await generateDescriptions(productIds);
    totalGenerated += result.summary.successful;
    
    console.log(`📊 Progress: ${totalGenerated} products processed`);
    
    offset += batchSize;
    
    // Optional: Add delay to respect API rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`✅ All descriptions generated! Total: ${totalGenerated}`);
}

generateAllDescriptions();
```

---

## AI Prompt Engineering

The current prompt generates descriptions that:
- Are max 150 characters (fits nicely in ProductDetail.jsx)
- Focus on benefits and key features
- Use casual, friendly Vietnamese tone
- Are suitable for a supermarket context

You can customize the prompt in `utils/aiDescriptionGenerator.js`:

```javascript
const prompt = `Generate a concise product description...
  // Modify requirements here
  // - Highlight sustainability
  // - Emphasize premium quality
  // - Include nutritional highlights
`;
```

---

## Performance Considerations

### Rate Limiting
- OpenAI has rate limits (based on your plan)
- Default: 500ms delay between requests
- Adjust in `utils/aiDescriptionGenerator.js`:
  ```javascript
  const delayBetweenRequests = 1000; // 1 second
  ```

### Cost Optimization
- Using GPT-3.5-turbo (cheapest model): ~$0.0015 per description
- 1000 products ≈ $1.50
- Run once, store permanently

### Batch Size
- Max 100 products per request
- Larger batches = faster processing
- Smaller batches = more robust error handling

---

## Monitoring & Logging

Check the backend service logs for generation progress:

```
🚀 Starting batch description generation for 50 products...
📦 Found 50 products to process
⏳ Generating description 1/50 for: Bánh mì nước ngoài
⏳ Generating description 2/50 for: Bánh sandwich
✅ Generated 48 descriptions, 2 failures
💾 Updated 48 products in database
```

---

## Troubleshooting

### Issue: "OPENAI_API_KEY not configured"
**Solution:** Add your API key to `.env`:
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
```

### Issue: "Rate limit exceeded"
**Solution:** 
1. Increase delay between requests
2. Use smaller batch sizes
3. Wait before retrying

### Issue: "Empty response from OpenAI"
**Possible Causes:**
- API key expired
- Product name too long or contains special characters
- Rate limit reached

**Solution:**
- Verify API key is valid
- Check OpenAI dashboard for usage
- Retry with smaller batch

---

## Next Steps

### 1. Generate Descriptions
```bash
# Start with small test batch
curl -X POST http://localhost:5001/api/products/batch-generate-descriptions \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": ["prod-001", "prod-002", "prod-003"]
  }'
```

### 2. Verify in Frontend
- Navigate to ProductDetail page
- Check if `mo_ta_ngan` displays generated descriptions instead of default text

### 3. Scale to Full Catalog
- Use the automated script to generate descriptions for all products
- Run during off-peak hours to avoid rate limiting

### 4. Add Admin Dashboard (Optional)
- Create admin page to:
  - Show products without descriptions
  - Trigger batch generation
  - View generation history/logs
  - Re-generate individual descriptions

---

## API Costs

**Pricing (as of 2024):**
- GPT-3.5-turbo: $0.50/$1.50 per 1M tokens (input/output)
- Typical description: 20 tokens input, 15 tokens output
- Cost per description: ~$0.0015 (0.15 cents)
- 1000 products: ~$1.50
- 5000 products: ~$7.50

Compare to:
- Manual entry: 5 min × 1000 products × $0.50/min = $2500
- AI generation: 1 one-time cost of ~$7.50

**ROI:** Pays for itself in seconds! ✅

---

## Architecture Diagram

```
ProductDetail.jsx
       ↓ (displays)
    mo_ta_ngan field
       ↑ (reads from)
    PostgreSQL
       ↑ (updated by)
POST /batch-generate-descriptions
       ↓ (calls)
   OpenAI API
       ↓ (returns)
   Description text
       ↓ (stores in)
    san_pham table
```

---

## Database Schema

The endpoint updates this field in the `san_pham` table:

```sql
ALTER TABLE san_pham ADD COLUMN mo_ta_ngan VARCHAR(500);
ALTER TABLE san_pham ADD COLUMN ngay_cap_nhat TIMESTAMP;

-- Check current descriptions
SELECT ma_san_pham, ten_san_pham, mo_ta_ngan FROM san_pham WHERE mo_ta_ngan IS NOT NULL LIMIT 10;
```

---

## Support

For issues or improvements:
1. Check OpenAI API status: https://status.openai.com/
2. Review API logs in backend terminal
3. Verify .env configuration
4. Test with single product first before full batch

