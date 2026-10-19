// ABOUTME: ASCII dossier section — a decorative glyph block under a section head.
// ABOUTME: The art string is static; vendored CSS handles the layered green extrusion.
const ASCII_ART = String.raw`
        ████████████████████████████████████████████████████████████
        ██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██
        ██▓▒░                                                  ░▒▓██
        ██▓▒░     ╔═══════════════════════════════════════╗    ░▒▓██
        ██▓▒░     ║   D  I  N  N  A  G  A                 ║    ░▒▓██
        ██▓▒░       /\          ▸ SOURCE : PUBLIC              ░▒▓██
        ██▓▒░   /  ████  \      ▸ HOST   : VERCEL              ░▒▓██
        ██▓▒░  /  ██████  \                                    ░▒▓██
        ██▓▒░ /____________\                                    ░▒▓██
        ██▓▒░ |    [   ]   |    │planning     : private │      ░▒▓██
        ██▓▒░ |    [ D ]   |    │atisha board : public  │      ░▒▓██
        ██▓▒░ |    [   ]   |    │site source  : public  │      ░▒▓██
        ██▓▒░ |____________|                                    ░▒▓██
        ██▓▒░                                                  ░▒▓██
        ██▓▒░  ░▒▓█  VALIDATE · THEN SHARE                     ░▒▓██
        ██▓▒░                                                  ░▒▓██
        ██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██
        ████████████████████████████████████████████████████████████`;

export function AsciiArt() {
  return (
    <section className="ascii-section" data-screen-label="ASCII dossier">
      <header className="section-head">
        <span className="section-eye">// 04 · DOSSIER · TRANSMISSION GATE</span>
        <h2 className="section-title">Decoded // wireframe.</h2>
      </header>
      <div className="ascii-stack" aria-hidden="true">
        <pre>{ASCII_ART}</pre>
      </div>
    </section>
  );
}
