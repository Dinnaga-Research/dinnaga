// ABOUTME: Home route (/) — composes the long-scroll dinnaga.ai homepage sections.
// ABOUTME: Shared chrome (nav, footer, CRT overlay) lives in Layout.
import { Hero } from '../../components/Hero';
import { Ticker } from '../../components/Ticker';
import { Practices } from '../../components/Practices';
import { DataPanel } from '../../components/DataPanel';
import { AsciiArt } from '../../components/AsciiArt';
import { CautionDivider } from '../../components/CautionDivider';
import { Transmission } from '../../components/Transmission';
import { TICKER_ITEMS } from '../../data/tickerItems';

export function Home() {
  return (
    <>
      <Hero />
      <Ticker items={TICKER_ITEMS} />
      <Practices />
      <DataPanel />
      <AsciiArt />
      <CautionDivider />
      <Transmission />
    </>
  );
}
