import { type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  showSidebar?: boolean;
}

export default function Layout({ children, title, subtitle, showSidebar = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 pt-16">
      <div className="bg-gradient-to-b from-slate-800/50 to-transparent border-b border-slate-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="text-slate-400 mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {showSidebar ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">{children}</div>
            <div className="lg:col-span-1">
              <Sidebar />
            </div>
          </div>
        ) : (
          children
        )}
      </div>

      <Footer />
    </div>
  );
}
