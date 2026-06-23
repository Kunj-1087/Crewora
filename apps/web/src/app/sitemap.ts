import { MetadataRoute } from 'next';
import apiClient from '@crewora/api-client';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://crewora.com';

// Local list of our first launch content pages to ensure indexability
const STATIC_BLOG_SLUGS = [
  'find-verified-plumber-ahmedabad',
  'switchboard-sparks-electrical-safety-guide',
  'average-cost-painting-2bhk-ahmedabad',
  'how-ahmedabad-shop-owners-get-customers-without-ads',
  'word-of-mouth-plumbing-business-local-seo',
];

// Seed public local SEO landing profiles for first provider liquidity in Ahmedabad
const FALLBACK_PROVIDER_PROFILES = [
  { city: 'ahmedabad', category: 'plumbing', slug: 'rajesh-kumar-plumbing-vashi' },
  { city: 'ahmedabad', category: 'electrical', slug: 'amit-sharma-electrical-hsr' },
  { city: 'ahmedabad', category: 'carpentry', slug: 'suresh-patil-carpentry-nerul' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  // 1. Core Static Marketing Pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}`, lastModified, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/how-it-works`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/customer`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/for-workers`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/pricing`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified, changeFrequency: 'daily', priority: 0.7 },
  ];

  // 2. Dynamic Blog Pages
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const response = await apiClient.get('/blog/posts');
    const posts = response.data?.data?.posts || [];
    if (posts.length > 0) {
      blogPages = posts.map((post: { slug: string; updatedAt: string }) => ({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));
    } else {
      throw new Error('No posts returned from API');
    }
  } catch (e) {
    // Fallback to static launch content calendar slugs if API fails
    blogPages = STATIC_BLOG_SLUGS.map((slug) => ({
      url: `${BASE_URL}/blog/${slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
  }

  // 3. Dynamic Public Provider Profiles (Local Long-Tail SEO entry points)
  let providerPages: MetadataRoute.Sitemap = [];
  try {
    const response = await apiClient.get('/workers/public');
    const providers = response.data?.data?.workers || [];
    if (providers.length > 0) {
      providerPages = providers.map((w: { city: string; category: string; slug: string; updatedAt: string }) => ({
        url: `${BASE_URL}/providers/${w.city.toLowerCase()}/${w.category.toLowerCase()}/${w.slug}`,
        lastModified: new Date(w.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));
    } else {
      throw new Error('No providers returned from API');
    }
  } catch (e) {
    // Fallback local seed profiles in Ahmedabad/Vashi for first launch indexation
    providerPages = FALLBACK_PROVIDER_PROFILES.map((p) => ({
      url: `${BASE_URL}/providers/${p.city}/${p.category}/${p.slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
  }

  return [...staticPages, ...blogPages, ...providerPages];
}
