"use client";

import { useEffect } from 'react';

const ServiceWorkerRegistrar = () => {
  useEffect(() => {
    // Check if serviceWorker is available and if not in an iframe
    if (navigator.serviceWorker && window.self === window.top) {
      // Register the service worker directly, not waiting for 'load'
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          // console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          // console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return null; // This component doesn't render anything
};

export default ServiceWorkerRegistrar;
