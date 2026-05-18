import type { MetadataRoute } from 'next';

const BASE = 'https://sir.marlabinc.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/beta`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/privacidad`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terminos`,   lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
