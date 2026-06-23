'use client';

import React from 'react';
import Link from 'next/link';
import { BLOG_POSTS } from '@/constants/blogPosts';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { StyleSheet, theme } from '@/theme';

export default function BlogIndex() {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <span style={styles.badge}>Crewora Insights</span>
        <h1 style={styles.title}>Home Services & Safety Blog</h1>
        <p style={styles.subtitle}>
          Expert guides for homeowners and service providers in Ahmedabad.
        </p>
      </header>

      <div style={styles.grid}>
        {BLOG_POSTS.map((post) => (
          <article key={post.slug} style={styles.card}>
            <div style={styles.cardContent}>
              <span style={styles.categoryBadge}>{post.category}</span>
              <h2 style={styles.cardTitle}>
                <Link href={`/blog/${post.slug}`} style={styles.cardLink}>
                  {post.title}
                </Link>
              </h2>
              <p style={styles.excerpt}>{post.excerpt}</p>
              
              <div style={styles.metaRow}>
                <span style={styles.metaItem}>
                  <Calendar size={12} style={{ marginRight: 4 }} />
                  {post.publishedDate}
                </span>
                <span style={styles.metaItem}>
                  <User size={12} style={{ marginRight: 4 }} />
                  {post.author}
                </span>
              </div>
            </div>
            <div style={styles.cardFooter}>
              <Link href={`/blog/${post.slug}`} style={styles.readMore}>
                Read Guide <ArrowRight size={14} style={{ marginLeft: 4 }} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: `${theme.spacing[8]}px ${theme.spacing[4]}px`,
    backgroundColor: theme.colors.surface,
    fontFamily: 'Inter, sans-serif',
    maxWidth: 1200,
    margin: '0 auto',
    width: '100%',
  },
  header: {
    textAlign: 'center',
    marginBottom: theme.spacing[8],
  },
  badge: {
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    backgroundColor: theme.colors.primaryLight,
    padding: '4px 12px',
    borderRadius: theme.radius.full,
  },
  title: {
    fontSize: theme.typography.size.xxl,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    marginTop: theme.spacing[3],
    marginHorizontal: 0,
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.size.sm,
    color: theme.colors.textSecondary,
    maxWidth: 600,
    margin: '0 auto',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: theme.spacing[6],
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.card,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: theme.shadows.sm,
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows.md,
    } as any,
  },
  cardContent: {
    padding: theme.spacing[5],
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  categoryBadge: {
    alignSelf: 'start',
    fontSize: 10,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryLight,
    padding: '2px 8px',
    borderRadius: theme.radius.sm,
    textTransform: 'uppercase',
    marginBottom: theme.spacing[3],
  },
  cardTitle: {
    fontSize: theme.typography.size.md,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.secondary,
    margin: 0,
    lineHeight: 1.4,
  },
  cardLink: {
    color: theme.colors.secondary,
    textDecoration: 'none',
  },
  excerpt: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.textSecondary,
    lineHeight: 1.6,
    marginTop: theme.spacing[2],
    flex: 1,
  },
  metaRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginTop: theme.spacing[4],
    borderTop: `1px solid ${theme.colors.border}`,
    paddingTop: theme.spacing[3],
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  cardFooter: {
    borderTop: `1px solid ${theme.colors.border}`,
    padding: `${theme.spacing[3]}px ${theme.spacing[5]}px`,
    backgroundColor: theme.colors.surface,
  },
  readMore: {
    display: 'flex',
    alignItems: 'center',
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.bold as any,
    color: theme.colors.primary,
    textDecoration: 'none',
  },
});
