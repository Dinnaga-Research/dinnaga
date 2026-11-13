// ABOUTME: Root application component: the route table (spec §8.3, #63, #64, #66, #70, #71) and the router.
// ABOUTME: Shared chrome lives in Layout; each route renders only its own content.
import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './routes/Home/Home';
import { Atisha } from './routes/Atisha/Atisha';
import { AtishaDoc } from './routes/Atisha/AtishaDoc';
import { Building } from './routes/Building/Building';
import { Method } from './routes/Method/Method';
import { Colophon } from './routes/Colophon/Colophon';
import { Backstage } from './routes/Backstage/Backstage';
import { BackstageDoc } from './routes/Backstage/BackstageDoc';
import { BackstageWeekly } from './routes/Backstage/BackstageWeekly';
import { BackstageWeeklyDoc } from './routes/Backstage/BackstageWeeklyDoc';
import { LegacyRedirect } from './routes/Redirects/LegacyRedirect';
import { NotFound } from './routes/NotFound/NotFound';

// Dev-only harnesses. The DEV check is a build-time constant, so Vite drops the routes and the
// lazy imports from production.
const DevDoc = import.meta.env.DEV
  ? lazy(() => import('./routes/Dev/DevDoc').then((m) => ({ default: m.DevDoc })))
  : null;
const DevFrames = import.meta.env.DEV
  ? lazy(() => import('./routes/Dev/DevFrames').then((m) => ({ default: m.DevFrames })))
  : null;

const devRoutes =
  DevDoc && DevFrames
    ? [
        {
          path: 'dev/doc',
          element: (
            <Suspense fallback={null}>
              <DevDoc />
            </Suspense>
          ),
        },
        {
          path: 'dev/frames',
          element: (
            <Suspense fallback={null}>
              <DevFrames />
            </Suspense>
          ),
        },
      ]
    : [];

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'atisha', element: <Atisha /> },
      { path: 'atisha/:slug', element: <AtishaDoc /> },
      { path: 'building', element: <Building /> },
      { path: 'method', element: <Method /> },
      { path: 'colophon', element: <Colophon /> },
      { path: 'backstage', element: <Backstage /> },
      { path: 'backstage/weekly', element: <BackstageWeekly /> },
      { path: 'backstage/weekly/:date', element: <BackstageWeeklyDoc /> },
      { path: 'backstage/:slug', element: <BackstageDoc /> },
      { path: 'artifacts', element: <LegacyRedirect /> },
      { path: 'artifacts/:slug', element: <LegacyRedirect /> },
      { path: 'weekly', element: <LegacyRedirect /> },
      { path: 'weekly/:date', element: <LegacyRedirect /> },
      ...devRoutes,
      { path: '*', element: <NotFound /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
