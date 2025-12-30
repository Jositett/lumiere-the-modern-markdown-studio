import React from 'react';
import { Link } from 'react-router-dom';
import { useEditorStore } from '@/lib/store';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Menu, ShieldCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
export function TopNav() {
  const user = useEditorStore((s) => s.user);
  return (
    <header className="fixed top-0 w-full z-[50] h-16 border-b bg-background/80 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
          <Link 
            to="/" 
            className="text-xl font-display font-bold tracking-tight text-foreground hover:text-brand-600 transition-colors"
          >
            Lumiere
          </Link>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium">
          <Link to="/" className="hover:text-brand-600 transition-colors">Home</Link>
          <Link to="/docs" className="hover:text-brand-600 transition-colors">Docs</Link>
          <Link to="/pricing" className="hover:text-brand-600 transition-colors">Pricing</Link>
        </nav>
        {/* Right side: Theme + CTAs + Mobile Menu */}
        <div className="flex items-center gap-4">
          <ThemeToggle className="static h-fit" />
          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Button variant="ghost" size="sm" asChild title="Admin Panel">
                    <Link to="/admin">
                      <ShieldCheck className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
                <Button 
                  asChild 
                  className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-6"
                >
                  <Link to="/app">Go to Studio</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden lg:inline-flex">
                  <Link to="/auth">Login</Link>
                </Button>
                <Button 
                  asChild 
                  className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-6"
                >
                  <Link to="/app">Start Writing</Link>
                </Button>
              </>
            )}
          </div>
          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/">Home</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/docs">Docs</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/pricing">Pricing</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user?.role === 'admin' && (
                <DropdownMenuItem asChild>
                  <Link to="/admin">Admin Panel</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {user ? (
                <DropdownMenuItem asChild>
                  <Link to="/app" className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-md px-4 py-2 text-sm font-medium">
                    Go to Studio
                  </Link>
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/auth">Login</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/app" className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-md px-4 py-2 text-sm font-medium">
                      Start Writing
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}