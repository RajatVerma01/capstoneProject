// In-memory storage for roadmaps (no database required)
const roadmaps = new Map();

const defaultProgress = () => ({ completedPhaseIndices: [] });

export async function createRoadmap(data) {
  const id = `roadmap-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  const progress = defaultProgress();
  const roadmap = {
    id,
    ...data,
    progress,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  roadmaps.set(id, roadmap);
  return { id, ...data, progress };
}

export async function getRoadmapById(id) {
  const data = roadmaps.get(id);
  if (!data) return null;
  
  const progress = data.progress || defaultProgress();
  const phases = data.result?.roadmap?.phases || [];
  const allPhasesCompleted =
    phases.length > 0 &&
    phases.length === (progress.completedPhaseIndices || []).length;
  
  return {
    id: data.id,
    targetJobTitle: data.targetJobTitle,
    result: data.result,
    resumeText: data.resumeText,
    progress,
    allPhasesCompleted: !!allPhasesCompleted,
    createdAt: data.createdAt,
  };
}

export async function updateProgress(id, completedPhaseIndices) {
  const roadmap = roadmaps.get(id);
  if (!roadmap) {
    throw new Error('Roadmap not found');
  }
  
  roadmap.progress = { completedPhaseIndices };
  roadmap.updatedAt = new Date().toISOString();
  roadmaps.set(id, roadmap);
  
  return getRoadmapById(id);
}
