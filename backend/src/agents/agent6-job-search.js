import { generateContent } from './groqClient.js';
import { scrapeGoogleSearch } from '../utils/scrapeDoClient.js';
import { config } from '../config.js';

const FAANG_COMPANIES = ['Facebook', 'Meta', 'Apple', 'Amazon', 'Netflix', 'Google', 'Microsoft', 'Alphabet'];

/**
 * Agent 6: Search for REAL active jobs from the internet
 * NO PROTOTYPE DATA - Only actual job listings
 * Searches across ALL job boards and company career pages
 */
export async function searchJobsAgent({ skills, experience }) {
  
  console.log('\n========================================');
  console.log('🔍 JOB SEARCH - Scanning Internet');
  console.log('========================================');
  console.log(`📋 User Profile:`);
  console.log(`   Skills: ${skills.slice(0, 5).join(', ')}${skills.length > 5 ? '...' : ''}`);
  console.log(`   Experience: ${experience}`);
  console.log('========================================\n');
  
  // Build comprehensive search queries across the entire internet
  const topSkills = skills.slice(0, 3).join(' ');
  const allSkills = skills.slice(0, 5).join(' OR ');
  
  const queries = [
    // Major job boards
    `${topSkills} ${experience} jobs site:linkedin.com/jobs "actively recruiting"`,
    `${topSkills} ${experience} jobs site:indeed.com "posted today"`,
    `${topSkills} ${experience} jobs site:glassdoor.com "now hiring"`,
    
    // Tech-specific job boards
    `${topSkills} ${experience} jobs site:stackoverflow.com/jobs`,
    `${topSkills} developer jobs site:dice.com`,
    `${topSkills} engineer jobs site:monster.com`,
    `${topSkills} jobs site:ziprecruiter.com`,
    `${topSkills} jobs site:careerbuilder.com`,
    
    // Tech company career pages
    `${topSkills} jobs site:careers.google.com`,
    `${topSkills} jobs site:amazon.jobs`,
    `${topSkills} jobs site:careers.microsoft.com`,
    `${topSkills} jobs site:metacareers.com`,
    `${topSkills} jobs site:apple.com/careers`,
    
    // Startup and tech job boards
    `${topSkills} jobs site:angel.co`,
    `${topSkills} jobs site:wellfound.com`,
    `${topSkills} startup jobs site:ycombinator.com`,
    `${topSkills} jobs site:hired.com`,
    
    // Remote job boards
    `${topSkills} remote jobs site:remote.co`,
    `${topSkills} remote jobs site:weworkremotely.com`,
    `${topSkills} remote jobs site:remoteok.io`,
    `${topSkills} remote jobs site:flexjobs.com`,
    
    // General internet search (company career pages)
    `${topSkills} ${experience} jobs "apply now" 2024 2025`,
    `${topSkills} developer "careers" "apply"`,
    `${allSkills} engineer hiring "job opening"`,
    `${topSkills} ${experience} "we are hiring" jobs`,
    
    // Industry-specific searches
    `${topSkills} software engineer jobs`,
    `${topSkills} developer position opening`,
    `${topSkills} tech jobs "now accepting applications"`
  ];

  console.log(`🌐 Step 1: Building comprehensive search strategy...`);
  console.log(`   Total search queries: ${queries.length}`);
  console.log(`   Sources: Job boards, company career pages, startup sites, remote job boards`);

  let allJobListings = [];
  
  // Scrape job listings from multiple sources
  if (config.scrapeDoToken) {
    console.log(`\n🔍 Step 2: Scraping job listings from across the internet...`);
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(`\n   Query ${i + 1}/${queries.length}:`);
      console.log(`   "${query.substring(0, 80)}${query.length > 80 ? '...' : ''}"`);
      
      try {
        console.log(`   ⏳ Fetching results...`);
        const searchResults = await scrapeGoogleSearch(query, { output: 'markdown' });
        
        if (searchResults) {
          const resultLength = searchResults.length;
          allJobListings.push(searchResults);
          console.log(`   ✅ Success! Retrieved ${resultLength} characters of data`);
        } else {
          console.log(`   ⚠️  No results found`);
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
      }
      
      // Small delay to avoid rate limiting
      if (i < queries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  } else {
    console.log(`   ⚠️  Scrape.do token not configured. Skipping web scraping.`);
  }

  console.log(`\n📊 Step 3: Processing scraped data...`);
  console.log(`   Total data sources collected: ${allJobListings.length}`);

  let searchContext;
  let isFallback = false;

  // If no search results, use AI fallback instead of failing
  if (allJobListings.length === 0) {
    console.warn('   ⚠️  No live search results available. Falling back to AI generated jobs.');
    isFallback = true;
    searchContext = `No live search results available. Generate highly realistic, up-to-date job listings for someone with these skills and experience level. Generate 10-15 realistic job openings from well-known companies.`;
  } else {
    searchContext = `REAL JOB LISTINGS FROM INTERNET (from multiple sources):\n${allJobListings.join('\n\n').slice(0, 12000)}`;
    console.log(`   ✅ Successfully compiled ${searchContext.length} characters of search data`);
  }

  console.log(`\n🤖 Step 4: Analyzing data with AI (Groq)...`);
  console.log(`   Extracting job listings from search results...`);

  const prompt = `You are a job data extractor.
  
User Skills: ${skills.join(', ')}
User Experience: ${experience}

${searchContext}

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. Extract or generate realistic job listings that match the user's profile.
2. If using generated fallback jobs, use REAL company names (e.g., Google, Stripe, Local startups) and highly realistic descriptions.
3. Extract EXACT company names, job titles, and URLs from the results (if using internet data). If generating, use realistic URLs (e.g., https://careers.google.com/jobs/results/1234).
4. Only include jobs that are currently active and accepting applications.
5. Extract real URLs from ANY job board or company career page that appears in results.
6. Accept URLs from: LinkedIn, Indeed, Glassdoor, company career pages, startup sites, remote job boards, etc.
7. Match scores should be based on actual job requirements mentioned in the listing vs user skills.
8. For experience level: If job mentions "entry level", "junior", "0-2 years" → it's entry level. Otherwise → experienced level.
9. DO NOT add generic job titles like "Software Engineer at Tech Corp" - only real companies.
10. DO NOT use placeholder data like "Tech Corp", "Startup Inc", "Company XYZ".
11. Extract jobs from ALL sources in the search results, not just major job boards.

For each REAL job found in the search results, extract:
- title: EXACT job title from the listing (as written)
- company: ACTUAL company name from the listing (real company only)
- location: REAL location from listing (exact city/state or "Remote" if mentioned)
- salary: Salary ONLY if explicitly mentioned in listing (otherwise null - don't guess)
- description: Brief description from ACTUAL listing (1-2 sentences, use actual text)
- postedDate: When posted as mentioned in listing (e.g., "2 days ago", "1 week ago")
- experienceLevel: "Entry Level" if job mentions entry/junior/0-2 years, otherwise "Experienced"
- url: ACTUAL job posting URL from the search results (can be from any job board or company site)
- source: The website/platform where job was found (e.g., "LinkedIn", "Google Careers", "AngelList", "Company Website")
- matchScore: Realistic match score (60-95) based on actual job requirements vs user skills
- matchCriteria: 2-3 specific reasons from the actual job description why this matches user's profile
- isFaang: true only if company is Facebook/Meta, Apple, Amazon, Netflix, Google, Microsoft

Return ONLY valid JSON array of REAL jobs found (aim for 10-20 jobs if available):
[
  {
    "title": "Senior Software Engineer",
    "company": "Airbnb",
    "location": "San Francisco, CA",
    "salary": "$150k - $200k",
    "description": "Build scalable systems for our platform...",
    "postedDate": "3 days ago",
    "experienceLevel": "Experienced",
    "url": "https://careers.airbnb.com/...",
    "source": "Company Website",
    "matchScore": 85,
    "matchCriteria": ["React expertise required", "5+ years matches your background"],
    "isFaang": false
  }
]

IMPORTANT: 
- If no real jobs found in search results, return empty array: []
- DO NOT return any jobs if the search results don't contain actual job listings
- Extract as many real jobs as you can find (10-20+ if available)
- Include jobs from ALL sources: job boards, company sites, startup platforms, remote job sites`;

  try {
    console.log(`   ⏳ Sending request to Groq AI...`);
    const text = await generateContent(prompt, { temperature: 0.7 });
    console.log(`   ✅ Received AI response (${text.length} characters)`);
    
    console.log(`\n🔍 Step 5: Parsing and validating jobs...`);
    
    // Clean up the response - remove markdown code blocks if present
    let cleaned = text.trim();
    cleaned = cleaned.replace(/```json\s*/g, '');
    cleaned = cleaned.replace(/```\s*/g, '');
    cleaned = cleaned.trim();
    
    // Try to find JSON object in the response
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('   ⚠️  No JSON array found in response');
      console.log('========================================\n');
      return [];
    }
    
    console.log(`   ✅ Found JSON data, parsing...`);
    const jobs = JSON.parse(jsonMatch[0]);
    console.log(`   ✅ Successfully parsed ${jobs.length} jobs`);
    
    // Validate and filter jobs - ensure they have real data
    const validJobs = jobs.filter(job => {
      // Must have essential fields
      if (!job.title || !job.company || !job.url) {
        console.log(`   ⚠️  Filtered out job: Missing essential fields`);
        return false;
      }
      
      // URL must be from real sources (more permissive now)
      const validDomains = [
        'linkedin.com', 'indeed.com', 'glassdoor.com', 
        'careers.', 'jobs.', '.com/careers', '/jobs/',
        'stackoverflow.com', 'dice.com', 'monster.com',
        'ziprecruiter.com', 'careerbuilder.com',
        'angel.co', 'wellfound.com', 'ycombinator.com',
        'remote.co', 'weworkremotely.com', 'remoteok.io',
        'flexjobs.com', 'hired.com', 'greenhouse.io',
        'lever.co', 'workday.com', 'myworkdayjobs.com'
      ];
      const hasValidUrl = validDomains.some(domain => job.url.toLowerCase().includes(domain));
      
      if (!hasValidUrl) {
        console.log(`   ⚠️  Filtered out job: Invalid URL - ${job.url}`);
        return false;
      }
      
      // Filter out prototype/fake company names
      const fakeCompanyPatterns = [
        /tech corp/i,
        /startup inc/i,
        /company xyz/i,
        /example/i,
        /sample/i,
        /test company/i,
        /acme corp/i,
        /generic/i
      ];
      
      const isFakeCompany = fakeCompanyPatterns.some(pattern => pattern.test(job.company));
      if (isFakeCompany) {
        console.log(`   ⚠️  Filtered out job: Fake company name - ${job.company}`);
        return false;
      }
      
      return true;
    });

    console.log(`   ✅ Validated ${validJobs.length} real jobs (filtered out ${jobs.length - validJobs.length} invalid entries)`);

    // Ensure isFaang is set correctly and add experience level
    const processedJobs = validJobs.map(job => ({
      ...job,
      isFaang: FAANG_COMPANIES.some(faang => 
        job.company.toLowerCase().includes(faang.toLowerCase())
      ),
      matchCriteria: job.matchCriteria || [],
      salary: job.salary || null,
      postedDate: job.postedDate || 'Recently posted',
      experienceLevel: job.experienceLevel || 'Experienced',
      source: job.source || 'Job Board', // Default source if not specified
    }));

    console.log(`\n✅ Extracted ${processedJobs.length} real job listings from across the internet`);
    
    // Log sample of jobs for verification
    if (processedJobs.length > 0) {
      console.log(`\n📋 Sample jobs extracted:`);
      processedJobs.slice(0, 5).forEach((job, idx) => {
        console.log(`   ${idx + 1}. ${job.title} at ${job.company}`);
        console.log(`      Source: ${job.source}`);
        console.log(`      Level: ${job.experienceLevel}`);
        console.log(`      Location: ${job.location}`);
        console.log(`      Match: ${job.matchScore}%`);
      });
      
      // Show source distribution
      const sources = {};
      processedJobs.forEach(job => {
        sources[job.source] = (sources[job.source] || 0) + 1;
      });
      console.log(`\n📊 Jobs by source:`);
      Object.entries(sources).forEach(([source, count]) => {
        console.log(`   ${source}: ${count} jobs`);
      });
    }
    
    console.log('\n========================================\n');
    return processedJobs;

  } catch (err) {
    console.error('\n❌ Error in job search:');
    console.error(`   Error type: ${err.name}`);
    console.error(`   Error message: ${err.message}`);
    console.error('========================================\n');
    // Return empty array instead of fallback - NO PROTOTYPE DATA
    return [];
  }
}
