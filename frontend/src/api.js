// API Base URL - uses Vercel backend service route in production
const API_BASE = import.meta.env.PROD ? '/_/backend/api' : '/api';

export async function analyzeResume(formData) {
  const res = await fetch(`${API_BASE}/roadmap/analyze`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText || 'Analysis failed');
  }
  return res.json();
}

export async function getRoadmap(id) {
  const res = await fetch(`${API_BASE}/roadmap/${id}`);
  if (!res.ok) throw new Error('Failed to load roadmap');
  return res.json();
}

export async function updateRoadmapProgress(id, completedPhaseIndices) {
  const res = await fetch(`${API_BASE}/roadmap/${id}/progress`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completedPhaseIndices }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText);
  }
  return res.json();
}

export async function buildResume(id) {
  const res = await fetch(`${API_BASE}/roadmap/${id}/build-resume`, {
    method: 'POST',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText);
  }
  return res.json();
}

// Job Search APIs
export async function uploadResumeForJobs(formData) {
  const res = await fetch(`${API_BASE}/jobs/upload-resume`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText || 'Upload failed');
  }
  return res.json();
}

export async function searchJobs(params) {
  const res = await fetch(`${API_BASE}/jobs/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText || 'Search failed');
  }
  return res.json();
}

export async function setupFaangAlerts(params) {
  const res = await fetch(`${API_BASE}/jobs/faang-alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText || 'Failed to setup alerts');
  }
  return res.json();
}

export async function getFaangAlerts() {
  const res = await fetch(`${API_BASE}/jobs/faang-alerts`);
  if (!res.ok) throw new Error('Failed to load alerts');
  return res.json();
}

export async function deleteFaangAlert(id) {
  const res = await fetch(`${API_BASE}/jobs/faang-alerts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText);
  }
  return res.json();
}

// AI Interview APIs
export async function uploadResumeForInterview(formData) {
  const res = await fetch(`${API_BASE}/interview/upload-resume`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText || 'Upload failed');
  }
  return res.json();
}

export async function startInterview(formData) {
  const res = await fetch(`${API_BASE}/interview/start`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText || 'Failed to start interview');
  }
  return res.json();
}

export async function sendInterviewMessage(interviewId, message) {
  const res = await fetch(`${API_BASE}/interview/${interviewId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText || 'Failed to send message');
  }
  return res.json();
}

export async function endInterview(interviewId) {
  const res = await fetch(`${API_BASE}/interview/${interviewId}/end`, {
    method: 'POST',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText || 'Failed to end interview');
  }
  return res.json();
}

// FAANG Questions API
export async function getFAANGQuestions(filters = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${API_BASE}/faang-questions?${params}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText || 'Failed to load questions');
  }
  return res.json();
}
