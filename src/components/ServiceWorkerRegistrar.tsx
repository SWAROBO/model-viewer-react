"use client";

import { useEffect } from 'react';

const ServiceWorkerRegistrar = () => {
  useEffect(() => {
    if (navigator.serviceWorker && window.self === window.top) {
      // Register the service worker directly, not waiting for 'load'
      // Added window.self === window.top to prevent registration in iframes if any
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
