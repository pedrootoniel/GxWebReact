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
    <div className="min-h-screen bg-[#0a0a0f] pt-16">
      <div className="relative border-b border-[#8b5c28]/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3d2e1a]/8 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,40,0.06)_0%,transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="font-cinzel text-3xl font-bold text-[#d4af52] tracking-wide">{title}</h1>
          <p className="text-[#8a7e6a] mt-1.5 text-sm">{subtitle}</p>
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
