// ABOUTME: The lab's practices — rendered by Practices.tsx.
// ABOUTME: Public openness, the project-planning funnel, and the Atisha public library.
import type { Practice } from '../types';

export const PRACTICES: Practice[] = [
  {
    num: '01',
    title: 'What is public',
    icon: 'ethos',
    summary: 'This site\'s source and the Atisha board are public on GitHub.',
    body: 'This site\'s source is public on GitHub, and so is the Atisha board where plans for Atisha are tracked. Project Planning is private.',
    meta: '▸ public on GitHub',
  },
  {
    num: '02',
    title: 'Project Planning',
    icon: 'method',
    summary: 'How the work happens: Read → Digest → Ideate → Experiment → Ship.',
    body: 'How the work happens. We read papers and releases, digest what matters, ideate, build experiments, and ship the ones that survive. The funnel that feeds everything else.',
    meta: '▸ read → ship',
  },
  {
    num: '03',
    title: 'Atisha',
    icon: 'atisha',
    summary: 'The public library, where tested documents are published.',
    body: 'Atisha is the public library. Every document there was tested before it was published, and says how. Whitepapers and living documents are planned.',
    meta: '▸ the public library',
  },
];
