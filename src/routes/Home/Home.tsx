// ABOUTME: Home route (/): the hero (the run), the library, What we're building, Writing and How we test,
// ABOUTME: in that fixed order (#68, #69). Shared chrome lives in Layout.
import { HomeHero } from './sections/HomeHero';
import { HomeLibrary } from './sections/HomeLibrary';
import { HomeBuilding } from './sections/HomeBuilding';
import { HomeWriting } from './sections/HomeWriting';
import { HowWeTest } from './sections/HowWeTest';

export function Home() {
  return (
    <>
      <HomeHero />
      <HomeLibrary />
      <HomeBuilding />
      <HomeWriting />
      <HowWeTest />
    </>
  );
}
