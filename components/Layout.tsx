import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const navItems = [
  { href: '/dashboard',       icon: '⬡', label: 'Dashboard' },
  { href: '/inspect',         icon: '🔍', label: 'AI Inspection' },
  { href: '/inspections',     icon: '📋', label: 'Inspection History' },
  { href: '/monuments',       icon: '🏛', label: 'Monuments' },
  { href: '/timeline',        icon: '📈', label: 'Deterioration Timeline' },
  { href: '/documentation',   icon: '📄', label: 'Documentation' },
];

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function Layout({ children, title, subtitle }: LayoutProps) {
  const router = useRouter();

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <h1>DharoharAI</h1>
          <p>Heritage Inspection Platform</p>
        </div>

        <div className="sidebar-nav">
          <div className="sidebar-section">Navigation</div>
          {navItems.map((item) => {
            const isActive = router.pathname === item.href ||
              (item.href !== '/dashboard' && router.pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <span className={`nav-link${isActive ? ' active' : ''}`}>
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
          fontSize: '0.7rem',
          color: 'var(--text-dim)',
          lineHeight: 1.6,
        }}>
          <div style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold-dark)', marginBottom: 2 }}>
            DharoharAI v1.0
          </div>
          <div>AI-Powered Monument</div>
          <div>Conservation Platform</div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="main-content">
        {title && (
          <div className="page-header">
            <h2 className="page-title">{title}</h2>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="page-body">
          {children}
        </div>
      </main>
    </div>
  );
}
