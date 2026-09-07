'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, BarChart3 } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) return null;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-sm shadow-xs group-hover:bg-orange-700 transition-colors">
                CG
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black text-slate-900 tracking-tight leading-none">
                  CENTER <span className="text-orange-600">GÁS</span>
                </span>
                <span className="text-xs font-medium text-slate-500 mt-0.5 leading-none">
                  Pinheirinho • Curitiba
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                href="/"
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  pathname === '/'
                    ? 'bg-orange-50 text-orange-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutGrid size={17} className={pathname === '/' ? 'text-orange-600' : 'text-slate-500'} />
                Kanban Operativo
              </Link>
              <Link
                href="/metrics"
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  pathname === '/metrics'
                    ? 'bg-orange-50 text-orange-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BarChart3 size={17} className={pathname === '/metrics' ? 'text-orange-600' : 'text-slate-500'} />
                Dashboard KPIs
              </Link>
            </nav>
          </div>

          {/* Right Status */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Realtime Activo</span>
            </div>

            <div className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg">
              Panel de Despacho
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
