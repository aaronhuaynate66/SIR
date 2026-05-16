'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/executive',              label: 'General'        },
  { href: '/executive/stakeholders', label: 'Stakeholders'   },
  { href: '/executive/pipeline',     label: 'Pipeline'       },
  { href: '/executive/capital',      label: 'Capital'        },
  { href: '/executive/reporte',      label: 'Reporte'        },
];

export default function ExecutiveNavTabs() {
  const pathname = usePathname();
  return (
    <>
      <style>{`
        .exec-tabs::-webkit-scrollbar { display: none; }
        .exec-tab:hover { color: #fff !important; }
      `}</style>
      <div
        className="exec-tabs"
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: 28,
          borderBottom: '1px solid #2a2d3e',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {TABS.map(tab => {
          const isActive = tab.href === '/executive'
            ? pathname === '/executive'
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="exec-tab"
              style={{
                padding: '9px 20px',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : '#64748b',
                textDecoration: 'none',
                borderBottom: `2px solid ${isActive ? '#7C6FCD' : 'transparent'}`,
                marginBottom: -1,
                whiteSpace: 'nowrap',
                display: 'block',
                transition: 'color 0.15s',
                flexShrink: 0,
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}
