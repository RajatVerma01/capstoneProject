import fetch from 'node-fetch';
import { config } from '../config.js';

const BASE = 'https://api.scrape.do';

/**
 * Scrape a URL using Scrape.do API.
 * @param {string} targetUrl - Full URL to scrape (e.g. Google search URL)
 * @param {{ output?: 'raw' | 'markdown' }} options - output: 'markdown' for LLM-friendly text
 * @returns {Promise<string>} - Response body
 */
export async function scrapeUrl(targetUrl, options = {}) {
  const token = config.scrapeDoToken;
  if (!token) throw new Error('SCRAPE_DO_TOKEN is not set');

  const params = new URLSearchParams({
    token,
    url: targetUrl,
    ...(options.output && { output: options.output }),
  });
  const url = `${BASE}/?${params.toString()}`;
  const res = await fetch(url, { method: 'GET' });

  if (!res.ok) {
    throw new Error(`Scrape.do request failed: ${res.status}`);
  }
  return res.text();
}

/**
 * Scrape Google search and return page content (markdown or raw).
 * Used for job requirements and course link discovery.
 */
export async function scrapeGoogleSearch(query, options = { output: 'markdown' }) {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  return scrapeUrl(searchUrl, options);
}