// ABOUTME: Colophon (/colophon, #71): the faces, the build, the source and the name, as four paragraphs.
// ABOUTME: The type sentence is a Claim: Colophon.test checks it names exactly the @font-face families in fonts.css.
import { Link } from 'react-router-dom';
import { PageHead } from '../../components/PageHead';
import { SITE_SOURCE_URL } from '../../data/links';
import './Colophon.css';

export function Colophon() {
  return (
    <div className="colophon dn-page">
      <PageHead title="Colophon" />
      <div className="dn-grid colophon__body">
        <div className="dn-grid__body dn-prose">
          <p>
            Set in Archivo. Documents are set in Atkinson Hyperlegible Next, with Chivo Mono for
            code. Noto Sans fills in Greek and the dotted IAST letters. Every face is under the SIL
            Open Font License and served from this site.
          </p>
          <p>
            Built with React and Vite, and hosted on Vercel. Merging to the main branch deploys the
            site. The Building page reads GitHub and the Substack through a small Vercel function.
          </p>
          <p>
            This site's source is <a href={SITE_SOURCE_URL}>public on GitHub</a>. The rest of what
            we're building is on the <Link to="/building">Building page</Link>.
          </p>
          <p>
            Dinnaga Research is run by David Ryan, and is named for Dignāga, the Buddhist
            philosopher of perception and valid cognition (pramāṇa).
          </p>
        </div>
      </div>
    </div>
  );
}
