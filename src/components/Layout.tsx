
import { ReactNode } from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="flex-1 pl-[72px] p-8 bg-background">
        {children}
      </main>
    </div>
  );
};

export default Layout;
