// ABOUTME: The artifact shelf — standalone research documents served from public/artifact-docs/.
// ABOUTME: Rendered by the /artifacts index and /artifacts/:slug viewer routes.
import type { ArtifactEntry } from '../types';

export const ARTIFACTS: ArtifactEntry[] = [
  {
    slug: 'llm-best-practices-github-copilot',
    title: 'Applying LLM Best Practices in GitHub Copilot',
    project: 'Hermes',
    oneLiner:
      'Cheat sheet: the hermes LLM doctrine resolved into GitHub Copilot\u2019s control surface \u2014 instructions files, the cloud agent\u2019s fences, CI as verifier, the premium-request meter.',
    published: '2026-09-09',
    docPath: '/artifact-docs/llm-best-practices-github-copilot.html',
    note: 'Control names verified against GitHub Docs 2026-09-09 \u2014 Copilot surfaces move fast; re-check before wiring policy to them.',
  },
  {
    slug: 'llm-best-practices-copilot-studio',
    title: 'Applying LLM Best Practices in Microsoft Copilot Studio',
    project: 'Hermes',
    oneLiner:
      'Cheat sheet: the hermes LLM doctrine resolved into Copilot Studio\u2019s control surface \u2014 topics before orchestration, named knowledge, Entra Agent IDs, DLP, the credit meter.',
    published: '2026-09-09',
    docPath: '/artifact-docs/llm-best-practices-copilot-studio.html',
    note: 'Control names verified against Microsoft Learn 2026-09-09 \u2014 Copilot Studio surfaces move fast; re-check before wiring policy to them.',
  },
  {
    slug: 'slamwich-tasting-report',
    title: 'SLAMWICH Tasting Report',
    project: 'Slamwich',
    oneLiner:
      'The synthesis of the 84-dish portfolio test kitchen — corpus traits, the technique leaderboard, and specimen walkthroughs.',
    published: '2026-08-08',
    docPath: '/artifact-docs/slamwich-tasting-report.html',
    note: 'Dish links inside the report point at the SLAMWICH dev kitchen on localhost:9021 — they only resolve on the lab bench.',
  },
];
