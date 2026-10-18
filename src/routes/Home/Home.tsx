// ABOUTME: Home route (/) — composes the long-scroll dinnaga.ai homepage sections.
// ABOUTME: Shared chrome (nav, footer, cookie banner, CRT overlay) lives in Layout.
import { Hero } from '../../components/Hero';
import { Ticker } from '../../components/Ticker';
import { Practices } from '../../components/Practices';
import { Instruments } from '../../components/Instruments';
import { DataPanel } from '../../components/DataPanel';
import { AsciiArt } from '../../components/AsciiArt';
import { CautionDivider } from '../../components/CautionDivider';
import { Transmission } from '../../components/Transmission';
import { TICKER_ITEMS } from '../../data/tickerItems';
import { CromulonPrototype } from './prototype/cromulon/CromulonPrototype';
import { HomePrototype } from './prototype/HomePrototype';

export function Home() {
  // PROTOTYPE (branch prototype/cromulon): the chosen direction with Cromulon variants; ?dirs=1 shows the old directions.
  if (new URLSearchParams(window.location.search).get('dirs') === '1') return <HomePrototype today={<Today />} />;
  return <CromulonPrototype />;
}

function Today() {
  return (
    <>
      <Hero />
      <Ticker items={TICKER_ITEMS} />
      <Practices />
      <Instruments />
      <DataPanel />
      <AsciiArt />
      <CautionDivider />
      <Transmission />
    </>
  );
}
