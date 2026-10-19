// ABOUTME: Browser entry point — mounts the React app onto #root.
// ABOUTME: StrictMode is intentionally omitted; its dev double-invoke would
// ABOUTME: fire the one-shot signature motions (nav reveal, CTA blink) twice.
import { createRoot } from 'react-dom/client';
import './styles/colors_and_type.css';
import './styles/components.css';
import './styles/site.css';
import './styles/artifacts.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');
createRoot(root).render(<App />);
