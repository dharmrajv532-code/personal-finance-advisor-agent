'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Toaster } from 'sonner';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isStandalone = pathname === '/' || pathname === '/onboarding';

  if (isStandalone) {
    return (
      <>
        {children}
        <Toaster position="bottom-right" richColors closeButton toastOptions={{ duration: 4000, style: { fontFamily: 'Inter, sans-serif' } }} />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      {/* Ambient drifting background glow blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 opacity-[0.03] dark:opacity-[0.05]">
        <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] rounded-full bg-primary blur-[120px] animate-blob1" />
        <div className="absolute bottom-[15%] right-[10%] w-[500px] h-[500px] rounded-full bg-secondary blur-[100px] animate-blob2" />
      </div>

      <div className="hidden md:block h-full">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {children}
        </main>
      </div>
      
      <Toaster position="bottom-right" richColors closeButton toastOptions={{ duration: 4000, style: { fontFamily: 'Inter, sans-serif' } }} />
    </div>
  );
}