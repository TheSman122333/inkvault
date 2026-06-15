'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'TODAY' },
  { href: '/goals', label: 'GOALS' },
  { href: '/vault', label: 'VAULT' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto border-t border-ink-200 bg-paper">
      <div className="flex">
        {tabs.map(tab => {
          const active = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 py-3 text-center font-mono text-[10px] tracking-[2px] ${
                active ? 'text-ink-950' : 'text-ink-400'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
