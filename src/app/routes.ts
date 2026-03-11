import { createBrowserRouter } from 'react-router';
import { RootLayout } from './pages/RootLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
  },
  {
    path: '*',
    Component: RootLayout,
  },
]);
