import type { MetadataRoute } from 'next';

/** Lets people install Penny to their home screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Penny',
    short_name: 'Penny',
    description: 'Track your monthly spending, budgets and plans.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f1f4f9',
    theme_color: '#f1f4f9',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
