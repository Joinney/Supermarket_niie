import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;
const BING_SEARCH_API_KEY = process.env.BING_SEARCH_API_KEY;

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\r?\n/g, ' ')
    .trim();
};

const buildSearchQuery = (productName, categoryName = '') => {
  const parts = [productName, categoryName, 'advertisement', 'mua online', 'giá tốt'];
  return parts.filter(Boolean).join(' ').trim();
};

export const searchOnlineProductAds = async (productName, categoryName = '') => {
  const query = buildSearchQuery(productName, categoryName);

  if (!SERPAPI_API_KEY && !BING_SEARCH_API_KEY) {
    console.warn('⚠️  No search API key provided for online research. Set SERPAPI_API_KEY or BING_SEARCH_API_KEY.');
    return null;
  }

  try {
    if (SERPAPI_API_KEY) {
      const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&hl=vi&gl=vn&num=5`;
      const response = await axios.get(url, {
        params: {
          api_key: SERPAPI_API_KEY,
        },
      });

      const snippets = [];

      if (Array.isArray(response.data.organic_results)) {
        response.data.organic_results.slice(0, 5).forEach((item) => {
          if (item.title) snippets.push(item.title);
          if (item.snippet) snippets.push(item.snippet);
        });
      }

      if (Array.isArray(response.data.ads)) {
        response.data.ads.slice(0, 5).forEach((item) => {
          if (item.title) snippets.push(item.title);
          if (item.snippet) snippets.push(item.snippet);
        });
      }

      if (Array.isArray(response.data.shopping_results)) {
        response.data.shopping_results.slice(0, 5).forEach((item) => {
          if (item.title) snippets.push(item.title);
          if (item.snippet) snippets.push(item.snippet);
        });
      }

      return normalizeText(snippets.join(' '));
    }

    if (BING_SEARCH_API_KEY) {
      const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
        headers: {
          'Ocp-Apim-Subscription-Key': BING_SEARCH_API_KEY,
        },
        params: {
          q: query,
          count: 5,
          textFormat: 'Raw',
          mkt: 'vi-VN',
        },
      });

      const snippets = [];
      const pages = response.data.webPages?.value || [];
      pages.slice(0, 5).forEach((item) => {
        if (item.name) snippets.push(item.name);
        if (item.snippet) snippets.push(item.snippet);
      });

      return normalizeText(snippets.join(' '));
    }
  } catch (error) {
    console.warn('⚠️  Online research failed:', error.message);
    return null;
  }

  return null;
};

/**
 * Generate a product description using OpenAI API
 * @param {string} productName - Product name
 * @param {string} categoryName - Category name
 * @param {boolean} useOnlineResearch - Whether to search online advertisements before generating description
 * @returns {Promise<string>} Generated short description
 */
export const generateDescriptionFromAI = async (productName, categoryName = '', useOnlineResearch = false) => {
  try {
    if (!OPENAI_API_KEY) {
      console.warn('⚠️  OpenAI API key not configured. Skipping AI generation.');
      return null;
    }

    let onlineContext = null;
    if (useOnlineResearch) {
      onlineContext = await searchOnlineProductAds(productName, categoryName);
    }

    let prompt = `Generate a concise, appealing product description (max 150 characters) for an e-commerce supermarket product in Vietnamese.\nProduct Name: ${productName}\n${categoryName ? `Category: ${categoryName}\n` : ''}`;

    if (useOnlineResearch) {
      prompt += '\n\nUse the following online product information and advertisement snippets to craft the description. If you cannot find online details, still generate a useful product description from the product name and category.';
      prompt += `\nOnline data: ${onlineContext || 'No online advertisement data was available.'}`;
    }

    prompt += `\n\nRequirements:\n- Be concise and engaging (max 150 chars)\n- Highlight key benefits or features\n- Use casual, friendly tone suitable for a supermarket\n- Use real or plausible details from online ads if available\n- Do NOT include pricing or promotional disclaimers\n- Do NOT include quotes or line breaks\n\nReturn ONLY the description text, no explanations.`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful product description writer for an Asian supermarket.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 120,
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const description = response.data.choices[0]?.message?.content?.trim();
    if (!description) {
      throw new Error('Empty response from OpenAI');
    }

    return normalizeText(description);
  } catch (error) {
    console.error('❌ AI Description Generation Error:', error.message);
    return null;
  }
};

/**
 * Batch generate descriptions for multiple products
 * @param {Array} products - Array of product objects with ma_san_pham, ten_san_pham, ten_danh_muc
 * @param {Object} options - { useOnlineResearch: boolean }
 * @returns {Promise<Array>} Array of {ma_san_pham, description} objects
 */
export const batchGenerateDescriptions = async (products, options = {}) => {
  const { useOnlineResearch = false } = options;
  const results = [];
  const delayBetweenRequests = 500; // ms, to avoid API rate limits

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    try {
      console.log(`⏳ Generating description ${i + 1}/${products.length} for: ${product.ten_san_pham}`);
      
      const description = await generateDescriptionFromAI(
        product.ten_san_pham,
        product.ten_danh_muc,
        useOnlineResearch
      );

      if (description) {
        results.push({
          ma_san_pham: product.ma_san_pham,
          description,
          success: true,
        });
      } else {
        results.push({
          ma_san_pham: product.ma_san_pham,
          description: null,
          success: false,
          error: 'Empty description from AI',
        });
      }

      if (i < products.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenRequests));
      }
    } catch (error) {
      console.error(`❌ Error generating description for ${product.ma_san_pham}:`, error.message);
      results.push({
        ma_san_pham: product.ma_san_pham,
        description: null,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
};
