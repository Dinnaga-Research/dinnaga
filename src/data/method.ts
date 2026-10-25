// ABOUTME: The five-stage project-planning loop shown on the How We Work page.
export interface MethodStage { name: string; detail: string; }

export const METHOD_STAGES: MethodStage[] = [
  { name: 'Read', detail: 'Find interesting papers, posts, and releases. Queue them.' },
  { name: 'Digest', detail: 'Read them. Write up what actually matters.' },
  { name: 'Ideate', detail: 'Promising ideas get a note worth coming back to.' },
  { name: 'Experiment', detail: 'Build it, try it, see what happens. Most die here.' },
  { name: 'Ship', detail: 'What survives becomes a skill, tool, or workflow — and a candidate for Atisha.' },
];
