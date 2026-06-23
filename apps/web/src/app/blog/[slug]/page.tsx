import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BLOG_POSTS, BlogPost } from '@/constants/blogPosts';
import { Calendar, User, ArrowLeft, BookOpen, Share2 } from 'lucide-react';
import { StyleSheet, theme } from '@/theme';

interface Props {
  params: {
    slug: string;
  };
}

// Generate dynamic metadata for search engine indexing
export async function generateMetadata({ params }: Props) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);
  if (!post) {
    return {
      title: 'Post Not Found | Crewora',
      description: 'The requested guide could not be found.',
    };
  }

  return {
    title: `${post.seoTitle} | Crewora`,
    description: post.seoDesc,
    keywords: post.keywords.join(', '),
    openGraph: {
      title: post.seoTitle,
      description: post.seoDesc,
      type: 'article',
      publishedTime: new Date(post.publishedDate).toISOString(),
      authors: [post.author],
      siteName: 'Crewora',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle,
      description: post.seoDesc,
    },
  };
}

// Generate static paths at build time for optimal server-side rendering
export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export default function BlogPostPage({ params }: Props) {
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  // Related posts (excluding current)
  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  // JSON-LD structured schema for search engines
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': post.title,
    'datePublished': new Date(post.publishedDate).toISOString(),
    'dateModified': new Date(post.publishedDate).toISOString(),
    'author': {
      '@type': 'Person',
      'name': post.author,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'Crewora',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://crewora.com/images/logo.png', // Fallback URL
      },
    },
    'description': post.excerpt,
  };

  return (
    <div style={styles.outerContainer}>
      {/* Structured Schema Insertion */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={styles.container}>
        {/* Main Content Area */}
        <main style={styles.main}>
          <Link href="/blog" style={styles.backLink}>
            <ArrowLeft size={16} style={{ marginRight: 8 }} />
            Back to Guides
          </Link>

          <article>
            <header style={styles.header}>
              <span style={styles.categoryBadge}>{post.category}</span>
              <h1 style={styles.title}>{post.title}</h1>
              
              <div style={styles.metaRow}>
                <span style={styles.metaItem}>
                  <Calendar size={14} style={{ marginRight: 6 }} />
                  {post.publishedDate}
                </span>
                <span style={styles.metaItem}>
                  <User size={14} style={{ marginRight: 6 }} />
                  By {post.author}
                </span>
                <span style={styles.metaItem}>
                  <BookOpen size={14} style={{ marginRight: 6 }} />
                  5 min read
                </span>
              </div>
            </header>

            <div style={styles.body}>
              {parseMarkdown(post.content)}
            </div>
          </article>

          {/* CTA Box */}
          <div style={styles.ctaCard}>
            <h3 style={styles.ctaTitle}>Hire Verified Shop-Owners Directly</h3>
            <p style={styles.ctaText}>
              Stop paying corporate lead portals. Crewora connects you with verified local plumbers, electricians, and painters who operate registered physical shops in Ahmedabad.
            </p>
            <div style={styles.ctaActionRow}>
              <Link href="/download-app" style={styles.ctaButton}>
                Download Crewora App
              </Link>
              <Link href="/how-it-works" style={styles.ctaSecondaryButton}>
                How It Works
              </Link>
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarCard}>
            <h3 style={styles.sidebarTitle}>About Crewora</h3>
            <p style={styles.sidebarText}>
              Crewora is a home services marketplace launching in Ahmedabad. We enable direct booking of verified shop-based technicians, avoiding middleman commissions and unvetted freelancers.
            </p>
          </div>

          <div style={styles.sidebarCard}>
            <h3 style={styles.sidebarTitle}>Recommended Reading</h3>
            <div style={styles.relatedList}>
              {relatedPosts.map((rPost) => (
                <div key={rPost.slug} style={styles.relatedItem}>
                  <span style={styles.relatedCategory}>{rPost.category}</span>
                  <Link href={`/blog/${rPost.slug}`} style={styles.relatedLink}>
                    {rPost.title}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Simple custom Markdown parser that renders styled React components
function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  let insideList = false;
  let listItems: string[] = [];
  const elements: React.ReactNode[] = [];
  let key = 0;

  const flushList = () => {
    if (insideList && listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key++}`} style={styles.list}>
          {listItems.map((item, idx) => (
            <li key={`li-${idx}`} style={styles.listItem}>
              {parseTextFormatting(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      insideList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') {
      flushList();
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={key++} style={styles.h3}>{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={key++} style={styles.h2}>{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      flushList();
      elements.push(<h1 key={key++} style={styles.h1}>{line.slice(2)}</h1>);
    } else if (line.startsWith('---')) {
      flushList();
      elements.push(<hr key={key++} style={styles.hr} />);
    }
    // Table Parsing
    else if (line.startsWith('|')) {
      flushList();
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      i--; // adjust loop index for outer incrementer

      if (tableLines.length > 1) {
        const rows = tableLines.filter((row) => !row.includes('---') && !row.includes(':---'));
        const parsedRows = rows.map((row) =>
          row
            .split('|')
            .map((c) => c.trim())
            .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
        );

        if (parsedRows.length > 0) {
          elements.push(
            <div key={`table-wrapper-${key++}`} style={{ overflowX: 'auto', margin: '24px 0', width: '100%' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    {parsedRows[0].map((cell, idx) => (
                      <th key={`th-${idx}`} style={styles.tableHeaderCell}>
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(1).map((row, rIdx) => (
                    <tr
                      key={`tr-${rIdx}`}
                      style={rIdx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}
                    >
                      {row.map((cell, cIdx) => (
                        <td key={`td-${cIdx}`} style={styles.tableCell}>
                          {parseTextFormatting(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
      }
    }
    // Unordered List Items
    else if (line.startsWith('* ') || line.startsWith('- ')) {
      insideList = true;
      listItems.push(line.slice(2));
    }
    // Numbered List Items
    else if (/^\d+\.\s/.test(line)) {
      insideList = true;
      listItems.push(line.replace(/^\d+\.\s/, ''));
    }
    // Math Block
    else if (line.includes('$$\\text{Paintable Area}')) {
      flushList();
      elements.push(
        <div key={key++} style={styles.mathBlock}>
          <strong>Paintable Area</strong> = Carpet Area × 3.2
        </div>
      );
    }
    // Standard Paragraph
    else {
      flushList();
      elements.push(
        <p key={key++} style={styles.paragraph}>
          {parseTextFormatting(line)}
        </p>
      );
    }
  }
  flushList();

  return elements;
}

// Helper to parse basic bold markdown syntax inside strings
function parseTextFormatting(text: string): React.ReactNode {
  if (!text.includes('**')) {
    return text;
  }
  const parts = text.split('**');
  return parts.map((part, idx) =>
    idx % 2 === 1 ? (
      <strong key={idx} style={{ fontWeight: theme.typography.weight.bold as any, color: theme.colors.secondary }}>
        {part}
      </strong>
    ) : (
      part
    )
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: theme.colors.surface,
    minHeight: '100vh',
    width: '100%',
    fontFamily: 'Inter, sans-serif',
  },
  container: {
    display: 'flex',
    flexDirection: 'row',
    maxWidth: 1140,
    margin: '0 auto',
    padding: `${theme.spacing[6]}px ${theme.spacing[4]}px`,
    gap: theme.spacing[8],
    flexWrap: 'wrap',
  },
  main: {
    flex: '2 1 650px',
    maxWidth: 750,
  },
  sidebar: {
    flex: '1 1 300px',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[6],
    alignSelf: 'flex-start',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    textDecoration: 'none',
    marginBottom: theme.spacing[5],
    fontWeight: theme.typography.weight.medium as any,
    transition: 'color 0.2s',
    ':hover': {
      color: theme.colors.primary,
    } as any,
  },
  header: {
    marginBottom: theme.spacing[6],
  },
  categoryBadge: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryLight,
    padding: '4px 10px',
    borderRadius: theme.radius.sm,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'inline-block',
    marginBottom: theme.spacing[3],
  },
  title: {
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    lineHeight: 1.3,
    marginBottom: theme.spacing[3],
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing[4],
    borderBottom: `1px solid ${theme.colors.border}`,
    paddingBottom: theme.spacing[4],
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
  },
  body: {
    fontSize: theme.typography.size.base,
    color: theme.colors.secondary,
    lineHeight: 1.7,
  },
  paragraph: {
    marginBottom: theme.spacing[4],
    color: '#334155', // Sleek slate color for reading text
  },
  h1: {
    fontSize: theme.typography.size.xl,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    marginTop: theme.spacing[6],
    marginBottom: theme.spacing[4],
  },
  h2: {
    fontSize: theme.typography.size.lg,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    marginTop: theme.spacing[6],
    marginBottom: theme.spacing[3],
  },
  h3: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.semibold as any,
    color: theme.colors.secondary,
    marginTop: theme.spacing[5],
    marginBottom: theme.spacing[2],
  },
  list: {
    paddingLeft: theme.spacing[5],
    marginBottom: theme.spacing[4],
    listStyleType: 'disc',
  },
  listItem: {
    marginBottom: theme.spacing[2],
    color: '#334155',
  },
  hr: {
    border: 0,
    borderTop: `1px solid ${theme.colors.border}`,
    margin: `${theme.spacing[6]}px 0`,
  },
  mathBlock: {
    backgroundColor: '#F1F5F9',
    borderLeft: `4px solid ${theme.colors.primary}`,
    padding: theme.spacing[4],
    borderRadius: theme.radius.sm,
    fontSize: theme.typography.size.md,
    fontFamily: 'Courier New, monospace',
    textAlign: 'center',
    margin: `${theme.spacing[5]}px 0`,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: theme.typography.size.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border}`,
  },
  tableHeaderRow: {
    backgroundColor: theme.colors.primary,
    color: '#FFFFFF',
    textAlign: 'left',
  },
  tableHeaderCell: {
    padding: `${theme.spacing[3]}px ${theme.spacing[4]}px`,
    fontWeight: theme.typography.weight.bold as any,
  },
  tableCell: {
    padding: `${theme.spacing[3]}px ${theme.spacing[4]}px`,
    borderBottom: `1px solid ${theme.colors.border}`,
    color: '#334155',
  },
  tableRowEven: {
    backgroundColor: '#FFFFFF',
  },
  tableRowOdd: {
    backgroundColor: '#F8FAFC',
  },
  ctaCard: {
    backgroundColor: theme.colors.primaryLight,
    border: `1px solid ${theme.colors.primary}33`, // 20% opacity primary border
    borderRadius: theme.radius.card,
    padding: theme.spacing[6],
    marginTop: theme.spacing[8],
    boxShadow: theme.shadows.md,
  },
  ctaTitle: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.primaryDark,
    margin: 0,
    marginBottom: theme.spacing[2],
  },
  ctaText: {
    fontSize: theme.typography.size.sm,
    color: '#334155',
    lineHeight: 1.5,
    margin: 0,
    marginBottom: theme.spacing[4],
  },
  ctaActionRow: {
    display: 'flex',
    gap: theme.spacing[3],
    flexWrap: 'wrap',
  },
  ctaButton: {
    backgroundColor: theme.colors.primary,
    color: '#FFFFFF',
    padding: `${theme.spacing[2]}px ${theme.spacing[4]}px`,
    borderRadius: theme.radius.button,
    textDecoration: 'none',
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.bold as any,
    transition: 'background-color 0.2s',
    display: 'inline-block',
    textAlign: 'center',
    minWidth: 150,
    ':hover': {
      backgroundColor: theme.colors.primaryDark,
    } as any,
  },
  ctaSecondaryButton: {
    backgroundColor: 'transparent',
    color: theme.colors.primary,
    border: `1px solid ${theme.colors.primary}`,
    padding: `${theme.spacing[2]}px ${theme.spacing[4]}px`,
    borderRadius: theme.radius.button,
    textDecoration: 'none',
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.semibold as any,
    transition: 'background-color 0.2s',
    display: 'inline-block',
    textAlign: 'center',
    minWidth: 120,
    ':hover': {
      backgroundColor: '#E6EFFF',
    } as any,
  },
  sidebarCard: {
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    padding: theme.spacing[5],
    boxShadow: theme.shadows.sm,
  },
  sidebarTitle: {
    fontSize: theme.typography.size.base,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
    marginBottom: theme.spacing[3],
    borderBottom: `2px solid ${theme.colors.primaryLight}`,
    paddingBottom: theme.spacing[2],
  },
  sidebarText: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    lineHeight: 1.5,
    margin: 0,
  },
  relatedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[4],
  },
  relatedItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  relatedCategory: {
    fontSize: 10,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  relatedLink: {
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium as any,
    color: theme.colors.secondary,
    textDecoration: 'none',
    lineHeight: 1.4,
    transition: 'color 0.2s',
    ':hover': {
      color: theme.colors.primary,
    } as any,
  },
});
