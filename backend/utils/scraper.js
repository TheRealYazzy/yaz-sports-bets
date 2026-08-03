// Scraper utilities with rate limiting and error handling
import axios from 'axios';

// Rate limiting config
const RATE_LIMITS = {
  default: 1000, // 1 second between requests
  aggressive: 500, // 0.5 second
  gentle: 2000 // 2 seconds
};

let lastRequestTime = {};

// Respectful HTTP get with rate limiting
export async function scrape(url, options = {}) {
  const {
    rateLimit = 'default',
    timeout = 8000,
    retries = 3,
    headers = {}
  } = options;

  const domain = new URL(url).hostname;
  const delayMs = RATE_LIMITS[rateLimit] || RATE_LIMITS.default;

  // Rate limiting: wait if needed
  if (lastRequestTime[domain]) {
    const timeSinceLastRequest = Date.now() - lastRequestTime[domain];
    if (timeSinceLastRequest < delayMs) {
      await new Promise(resolve => 
        setTimeout(resolve, delayMs - timeSinceLastRequest)
      );
    }
  }

  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    ...headers
  };

  let lastError;

  // Retry logic
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: defaultHeaders,
        timeout
      });

      lastRequestTime[domain] = Date.now();
      return response.data;

    } catch (error) {
      lastError = error;
      console.warn(`Scrape attempt ${attempt}/${retries} failed for ${url}: ${error.message}`);

      if (attempt < retries) {
        // Exponential backoff
        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError;
}

// Post request with rate limiting
export async function scrapePost(url, data, options = {}) {
  const { rateLimit = 'default', timeout = 8000, retries = 2 } = options;

  const domain = new URL(url).hostname;
  const delayMs = RATE_LIMITS[rateLimit] || RATE_LIMITS.default;

  if (lastRequestTime[domain]) {
    const timeSinceLastRequest = Date.now() - lastRequestTime[domain];
    if (timeSinceLastRequest < delayMs) {
      await new Promise(resolve =>
        setTimeout(resolve, delayMs - timeSinceLastRequest)
      );
    }
  }

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(url, data, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Content-Type': 'application/json'
        },
        timeout
      });

      lastRequestTime[domain] = Date.now();
      return response.data;

    } catch (error) {
      lastError = error;
      console.warn(`POST attempt ${attempt}/${retries} failed: ${error.message}`);

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError;
}

// Check if URL is accessible
export async function checkUrlAvailable(url) {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
}

// Reset rate limiter (for testing)
export function resetRateLimiter() {
  lastRequestTime = {};
}
