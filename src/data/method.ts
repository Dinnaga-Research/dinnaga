// ABOUTME: The five method stages (#71), in order; their numbers are derived from array order.
// ABOUTME: Read by /method, the homepage frame sequence and How we test's link text.
export interface MethodStage {
  name: string;
  detail: string;
}

export const METHOD_STAGES: MethodStage[] = [
  { name: 'Read', detail: 'Find interesting papers, posts and releases. Queue them.' },
  { name: 'Digest', detail: 'Read them. Write up what actually matters.' },
  { name: 'Ideate', detail: 'Promising ideas get a note worth coming back to.' },
  { name: 'Experiment', detail: 'Build it, try it, see what happens. Most die here.' },
  { name: 'Ship', detail: 'What survives becomes a skill, a tool or a workflow, and a candidate for Atisha.' },
];
