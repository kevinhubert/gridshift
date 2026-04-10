import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import SavingsPage from '@/pages/SavingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'savings', element: <SavingsPage /> },
      { path: 'about', element: <AboutPage /> },
    ],
  },
]);
