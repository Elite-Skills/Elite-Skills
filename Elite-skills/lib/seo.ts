import { useEffect } from 'react'

import { ELITE_SKILLS_INSTAGRAM, ELITE_SKILLS_LINKEDIN } from '../socialLinks'

export type PageSeoOptions = {
  title: string
  description: string
  keywords?: string
  path?: string
  image?: string
  type?: 'website' | 'article'
  robots?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

export const DEFAULT_SITE_NAME = 'Elite Skills'

export const LANDING_PAGE_SEO = {
  title: 'Elite Skills | Financial Internships & Investment Banking Recruiting Prep',
  description:
    'Elite Skills helps students land financial internships and investment banking offers. AI interview prep, ATS resume scoring, firm-specific strategy, and the 2026 recruiting playbook for HEC, LBS, and top finance programs.',
  keywords:
    'Elite Skills, Eliteskills, financial internships, finance internship, investment banking internship, finance recruiting, IB internship prep, summer analyst, investment banking recruiting',
  path: '/',
} as const

export function getSiteOrigin(): string {
  const fromEnv = String(import.meta.env.VITE_SITE_URL ?? '')
    .trim()
    .replace(/\/+$/, '')
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined') return window.location.origin.replace(/\/+$/, '')
  return ''
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string): string {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  const prev = el.content
  el.content = content
  return prev
}

function upsertLink(rel: string, href: string): string {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  const prev = el.href
  el.href = href
  return prev
}

function upsertJsonLd(id: string, data: Record<string, unknown> | Record<string, unknown>[]): string | null {
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  const prev = el.textContent
  el.textContent = JSON.stringify(data)
  return prev
}

export function buildLandingJsonLd(origin: string) {
  const pageUrl = origin ? `${origin}/` : undefined
  const organization = {
    '@type': 'Organization',
    name: DEFAULT_SITE_NAME,
    alternateName: ['Eliteskills', 'Elite Skills Co', 'eliteskills.co'],
    url: pageUrl,
    description: LANDING_PAGE_SEO.description,
    sameAs: [ELITE_SKILLS_INSTAGRAM, ELITE_SKILLS_LINKEDIN],
    knowsAbout: [
      'Financial internships',
      'Finance internship preparation',
      'Investment banking recruiting',
      'Investment banking internships',
    ],
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      {
        '@type': 'WebSite',
        name: DEFAULT_SITE_NAME,
        alternateName: ['Eliteskills'],
        url: pageUrl,
        description: LANDING_PAGE_SEO.description,
        publisher: pageUrl ? { '@type': 'Organization', name: DEFAULT_SITE_NAME, url: pageUrl } : undefined,
      },
      {
        '@type': 'WebPage',
        name: LANDING_PAGE_SEO.title,
        description: LANDING_PAGE_SEO.description,
        url: pageUrl,
        isPartOf: pageUrl ? { '@type': 'WebSite', url: pageUrl } : undefined,
        about: [
          { '@type': 'Thing', name: 'Financial internships' },
          { '@type': 'Thing', name: 'Investment banking recruiting' },
        ],
      },
      {
        '@type': 'EducationalOccupationalProgram',
        name: 'Elite Skills Financial Internships Accelerator',
        description: LANDING_PAGE_SEO.description,
        provider: organization,
        occupationalCategory: 'Financial internships and investment banking',
        educationalProgramMode: 'online',
      },
    ],
  }
}

export function usePageSeo(options: PageSeoOptions) {
  const {
    title,
    description,
    keywords,
    path = '/',
    image,
    type = 'website',
    robots = 'index,follow',
    jsonLd,
  } = options

  useEffect(() => {
    const origin = getSiteOrigin()
    const canonicalPath = path.startsWith('/') ? path : `/${path}`
    const pageUrl = origin ? `${origin}${canonicalPath}` : undefined
    const shareImage = image ?? (origin ? `${origin}/favicon.svg` : '/favicon.svg')

    const prevTitle = document.title
    document.title = title

    const prevDesc = upsertMeta('name', 'description', description)
    const prevRobots = upsertMeta('name', 'robots', robots)
    let prevKeywords = ''
    if (keywords) {
      prevKeywords = upsertMeta('name', 'keywords', keywords)
    }
    const prevApplicationName = upsertMeta('name', 'application-name', DEFAULT_SITE_NAME)
    const prevOgTitle = upsertMeta('property', 'og:title', title)
    const prevOgDesc = upsertMeta('property', 'og:description', description)
    const prevOgType = upsertMeta('property', 'og:type', type)
    const prevOgSite = upsertMeta('property', 'og:site_name', DEFAULT_SITE_NAME)
    const prevOgImage = upsertMeta('property', 'og:image', shareImage)
    const prevTwitterCard = upsertMeta('name', 'twitter:card', 'summary_large_image')
    const prevTwitterTitle = upsertMeta('name', 'twitter:title', title)
    const prevTwitterDesc = upsertMeta('name', 'twitter:description', description)
    const prevTwitterImage = upsertMeta('name', 'twitter:image', shareImage)

    let prevOgUrl = ''
    let prevCanonical = ''
    if (pageUrl) {
      prevOgUrl = upsertMeta('property', 'og:url', pageUrl)
      prevCanonical = upsertLink('canonical', pageUrl)
    }

    let prevJsonLd: string | null = null
    if (jsonLd) {
      prevJsonLd = upsertJsonLd('page-jsonld', jsonLd)
    }

    return () => {
      document.title = prevTitle
      upsertMeta('name', 'description', prevDesc)
      upsertMeta('name', 'robots', prevRobots)
      if (keywords) {
        upsertMeta('name', 'keywords', prevKeywords)
      }
      upsertMeta('name', 'application-name', prevApplicationName)
      upsertMeta('property', 'og:title', prevOgTitle)
      upsertMeta('property', 'og:description', prevOgDesc)
      upsertMeta('property', 'og:type', prevOgType)
      upsertMeta('property', 'og:site_name', prevOgSite)
      upsertMeta('property', 'og:image', prevOgImage)
      upsertMeta('name', 'twitter:card', prevTwitterCard)
      upsertMeta('name', 'twitter:title', prevTwitterTitle)
      upsertMeta('name', 'twitter:description', prevTwitterDesc)
      upsertMeta('name', 'twitter:image', prevTwitterImage)
      if (pageUrl) {
        upsertMeta('property', 'og:url', prevOgUrl)
        upsertLink('canonical', prevCanonical)
      }
      if (jsonLd) {
        const el = document.getElementById('page-jsonld')
        if (el) {
          el.textContent = prevJsonLd
        }
      }
    }
  }, [title, description, keywords, path, image, type, robots, jsonLd])
}
