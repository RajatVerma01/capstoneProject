import { generateContent } from './groqClient.js';
import { scrapeGoogleSearch } from '../utils/scrapeDoClient.js';
import { config } from '../config.js';

/**
 * Agent 8: FAANG Interview Questions Provider - Fetches real questions from internet
 */

export async function getFAANGQuestionsData(filters = {}) {
  const company = filters.company && filters.company !== 'All' ? filters.company : null;
  const difficulty = filters.difficulty && filters.difficulty !== 'All' ? filters.difficulty : null;
  const type = filters.type && filters.type !== 'All' ? filters.type : null;

  console.log('\n========================================');
  console.log('🔍 FAANG INTERVIEW QUESTIONS SEARCH');
  console.log('========================================');
  console.log(`📋 Filters Applied:`);
  console.log(`   Company: ${company || 'All'}`);
  console.log(`   Difficulty: ${difficulty || 'All'}`);
  console.log(`   Type: ${type || 'All'}`);
  console.log('========================================\n');

  // If no company selected, return empty
  if (!company) {
    console.log('⚠️  No company selected. Please select a company to fetch questions.\n');
    return [];
  }

  console.log(`🎯 Starting search for ${company} interview questions...`);
  
  // Fetch real questions from internet
  const questions = await fetchRealInterviewQuestions(company, difficulty, type);
  
  console.log(`\n✅ Search completed! Found ${questions.length} questions.\n`);
  console.log('========================================\n');
  
  return questions;
}

async function fetchRealInterviewQuestions(company, difficulty, type) {
  
  console.log(`\n📡 Step 1: Building search queries for ${company}...`);
  
  // Build search queries for different sources
  const queries = [];
  
  // Base query
  let baseQuery = `${company} interview questions`;
  
  if (type) {
    if (type === 'Coding') {
      baseQuery += ' coding leetcode';
      console.log(`   🔹 Focus: Coding questions from LeetCode`);
    } else if (type === 'System Design') {
      baseQuery += ' system design';
      console.log(`   🔹 Focus: System Design questions`);
    } else if (type === 'Behavioral') {
      baseQuery += ' behavioral';
      console.log(`   🔹 Focus: Behavioral questions`);
    } else if (type === 'Technical') {
      baseQuery += ' technical';
      console.log(`   🔹 Focus: Technical questions`);
    }
  }
  
  if (difficulty) {
    baseQuery += ` ${difficulty.toLowerCase()}`;
    console.log(`   🔹 Difficulty: ${difficulty}`);
  }

  // Search multiple sources
  queries.push(
    `${baseQuery} site:leetcode.com`,
    `${baseQuery} site:glassdoor.com`,
    `${baseQuery} site:reddit.com/r/cscareerquestions`,
    `${baseQuery} 2024 2025 2026`
  );

  console.log(`\n📡 Step 2: Scraping questions from the internet...`);
  console.log(`   Total queries to execute: ${queries.length}`);

  let allSearchResults = [];
  
  // Scrape questions from multiple sources
  if (config.scrapeDoToken) {
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(`\n   🌐 Query ${i + 1}/${queries.length}:`);
      console.log(`      "${query}"`);
      
      try {
        console.log(`      ⏳ Fetching results...`);
        const searchResults = await scrapeGoogleSearch(query, { output: 'markdown' });
        
        if (searchResults) {
          const resultLength = searchResults.length;
          allSearchResults.push(searchResults);
          console.log(`      ✅ Success! Retrieved ${resultLength} characters of data`);
        } else {
          console.log(`      ⚠️  No results found`);
        }
      } catch (err) {
        console.log(`      ❌ Error: ${err.message}`);
      }
    }
  } else {
    console.log(`   ⚠️  Scrape.do token not configured. Skipping web scraping.`);
  }

  console.log(`\n📊 Step 3: Processing scraped data...`);
  console.log(`   Total data sources collected: ${allSearchResults.length}`);

  const searchContext = allSearchResults.length > 0 
    ? `Real interview questions found from internet:\n${allSearchResults.join('\n\n').slice(0, 8000)}`
    : `No live search results available. Generate realistic ${company} interview questions based on known patterns.`;

  if (allSearchResults.length > 0) {
    console.log(`   ✅ Successfully compiled ${allSearchResults.join('').length} characters of search data`);
  } else {
    console.log(`   ⚠️  No search data available. Will use AI knowledge base.`);
  }

  console.log(`\n🤖 Step 4: Analyzing data with AI (Groq)...`);
  console.log(`   Extracting ${company} interview questions...`);

  const prompt = `You are an expert at extracting and formatting interview questions. Based on real interview questions found on the internet, extract and format ${company} interview questions.

Company: ${company}
${difficulty ? `Difficulty: ${difficulty}` : ''}
${type ? `Type: ${type}` : ''}

${searchContext}

Extract or generate 10-15 realistic interview questions that ${company} actually asks. For each question, provide:
- company: "${company}"
- type: "Coding" or "Behavioral" or "System Design" or "Technical"
- difficulty: "Easy" or "Medium" or "Hard"
- topic: specific topic (e.g., "Arrays", "Leadership", "Scalability")
- question: The actual interview question
- description: Detailed description (2-3 sentences)
- hints: Array of 2-4 helpful hints
- approach: Solution approach (for technical questions, optional for behavioral)
- timeComplexity: Time complexity (for coding questions, optional)
- spaceComplexity: Space complexity (for coding questions, optional)

IMPORTANT:
- Extract REAL questions from the search results when available
- Questions should be authentic and commonly asked at ${company}
- Include recent questions (2024-2026)
- Vary difficulty levels realistically
- For coding questions, include complexity analysis
- For behavioral questions, relate to ${company}'s values

Return ONLY valid JSON array:
[
  {
    "company": "${company}",
    "type": "Coding",
    "difficulty": "Medium",
    "topic": "Arrays",
    "question": "...",
    "description": "...",
    "hints": ["hint1", "hint2", "hint3"],
    "approach": "...",
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(1)"
  },
  ...
]`;

  try {
    console.log(`   ⏳ Sending request to Groq AI...`);
    const text = await generateContent(prompt, { temperature: 0.7 });
    console.log(`   ✅ Received AI response (${text.length} characters)`);

    console.log(`\n🔍 Step 5: Parsing and validating questions...`);
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log(`   ❌ Error: No JSON array found in response`);
      return [];
    }
    
    console.log(`   ✅ Found JSON data, parsing...`);
    const questions = JSON.parse(jsonMatch[0]);
    console.log(`   ✅ Successfully parsed ${questions.length} questions`);
    
    // Ensure all questions have the correct company
    const processedQuestions = questions.map(q => ({
      ...q,
      company: company,
    }));

    console.log(`\n📝 Step 6: Final validation...`);
    console.log(`   Questions extracted: ${processedQuestions.length}`);
    console.log(`   Company: ${company}`);
    if (difficulty) console.log(`   Difficulty filter: ${difficulty}`);
    if (type) console.log(`   Type filter: ${type}`);
    
    return processedQuestions;
    
  } catch (err) {
    console.log(`\n❌ Error in Step 5: Failed to parse questions`);
    console.log(`   Error details: ${err.message}`);
    return [];
  }
}
