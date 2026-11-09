
"use client"; // Required for ThemeToggle
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react'; 
import ThemeToggle from '@/components/shared/ThemeToggle'; // Import ThemeToggle

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-background to-secondary relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-primary mb-4 font-headline">
          Quetta Parking E-Challan System
        </h1>
        <p className="text-xl text-foreground/80 max-w-2xl mx-auto">
          Modernizing parking violation management for a safer Quetta. Please log in to access the system.
        </p>
      </div>

      <div className="w-full max-w-xs"> 
        <Link href="/login" passHref> 
          <Button className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground">
            <LogIn className="mr-2 h-5 w-5" />
            Login
          </Button>
        </Link>
      </div>

      <footer className="mt-16 text-center text-foreground/70">
        <p>&copy; {new Date().getFullYear()} Quetta Traffic Police. All rights reserved.</p>
      </footer>
    </main>
  );
}
