// In-memory storage for interviews (no database required)
const interviews = new Map();

/**
 * Create a new interview
 */
export async function createInterview(data) {
  const id = `interview-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const interview = {
    id,
    ...data,
    createdAt: new Date().toISOString(),
  };
  interviews.set(id, interview);
  return interview;
}

/**
 * Get interview by ID
 */
export async function getInterviewById(id) {
  return interviews.get(id) || null;
}

/**
 * Add a message to the interview
 */
export async function addInterviewMessage(id, message) {
  const interview = interviews.get(id);
  if (!interview) {
    throw new Error('Interview not found');
  }
  
  interview.messages.push(message);
  interview.updatedAt = new Date().toISOString();
  interviews.set(id, interview);
}

/**
 * Update interview status and report
 */
export async function updateInterviewStatus(id, status, report = null) {
  const interview = interviews.get(id);
  if (!interview) {
    throw new Error('Interview not found');
  }
  
  interview.status = status;
  interview.updatedAt = new Date().toISOString();
  
  if (report) {
    interview.report = report;
  }
  
  interviews.set(id, interview);
}
