import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const Breadcrumbs: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  return (
    <nav className="flex items-center text-xs text-zinc-500 space-x-1.5 mb-1">
      <Link to="/dashboard" className="hover:text-zinc-900 transition-colors flex items-center">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
          {item.href ? (
            <Link to={item.href} className="hover:text-zinc-900 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-zinc-800 font-semibold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

