// In-memory storage for job profiles (no database required)
const jobProfiles = new Map();
const faangAlerts = new Map();

/**
 * Create a job profile (resume + extracted skills)
 */
export async function createJobProfile(data) {
  const id = `job-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const profile = {
    id,
    ...data,
    createdAt: new Date().toISOString(),
  };
  jobProfiles.set(id, profile);
  return profile;
}

/**
 * Get job profile by ID
 */
export async function getJobProfileById(id) {
  return jobProfiles.get(id) || null;
}

/**
 * Create a FAANG alert
 */
export async function createFaangAlert(data) {
  const id = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const alert = {
    id,
    ...data,
    active: true,
    createdAt: new Date().toISOString(),
  };
  faangAlerts.set(id, alert);
  return alert;
}

/**
 * Get FAANG alerts by email
 */
export async function getFaangAlertsByEmail(email) {
  const alerts = [];
  for (const alert of faangAlerts.values()) {
    if (alert.email === email && alert.active) {
      alerts.push(alert);
    }
  }
  return alerts;
}

/**
 * Delete (deactivate) a FAANG alert
 */
export async function deleteFaangAlertById(id) {
  const alert = faangAlerts.get(id);
  if (alert) {
    alert.active = false;
    alert.deletedAt = new Date().toISOString();
    faangAlerts.set(id, alert);
  }
}
