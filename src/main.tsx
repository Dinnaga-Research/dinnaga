// ABOUTME: Browser entry point: loads the global stylesheets and mounts the React app onto #root.
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');
createRoot(root).render(<App />);
