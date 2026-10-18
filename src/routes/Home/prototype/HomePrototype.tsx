// ABOUTME: PROTOTYPE (throwaway) — switches the homepage between today's page (T) and three visual
// ABOUTME: directions (A, B, C) via ?variant=, with the shared prototype bar. Default is A.
import { useSearchParams } from 'react-router-dom';
import { PrototypeSwitcher } from '../../../components/PrototypeSwitcher';
import { DirectionA, DirectionB, DirectionC } from './directions';
import './directions.css';

const VARIANTS = [
  { key: 'A', label: DirectionA.label },
  { key: 'B', label: DirectionB.label },
  { key: 'C', label: DirectionC.label },
  { key: 'T', label: 'Today (for comparison)' },
];

export function HomePrototype({ today }: { today: React.ReactNode }) {
  const [params] = useSearchParams();
  const v = params.get('variant') ?? 'A';
  return (
    <>
      {v === 'A' && <DirectionA />}
      {v === 'B' && <DirectionB />}
      {v === 'C' && <DirectionC />}
      {v === 'T' && today}
      <PrototypeSwitcher variants={VARIANTS} />
    </>
  );
}
