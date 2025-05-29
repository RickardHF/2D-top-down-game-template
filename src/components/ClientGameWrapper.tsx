'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with no SSR for the Game component
// This prevents "window is not defined" errors since we're using browser APIs
const GameWithNoSSR = dynamic(() => import('./Game'), {
  ssr: false,
});

export default function ClientGameWrapper() {
  return <GameWithNoSSR />;
}
