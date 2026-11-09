
"use client";

import { useState } from 'react';
import { signIn } from "next-auth/react";
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ThemeToggle from '@/components/shared/ThemeToggle';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [badgeIdInput, setBadgeIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false, // Handle redirect manually or let middleware handle it
        badgeNumber: badgeIdInput,
        password: passwordInput,
      });

      if (result?.error) {
        setError("Invalid badge ID or password. Please try again.");
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid credentials provided.",
        });
      } else if (result?.ok) {
        toast({
          title: "Login Successful",
          description: "Redirecting to your dashboard...",
        });
        // Let middleware handle the redirect by refreshing the page
        router.refresh(); 
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-background to-secondary relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary mb-2 font-headline flex items-center justify-center gap-2">
            <LogIn className="h-8 w-8" /> System Login
          </CardTitle>
          <CardDescription className="text-foreground/80">
            Enter your Badge ID / Username and Password to proceed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="badgeId">Badge ID / Username</Label>
              <Input 
                id="badgeId" 
                type="text" 
                placeholder="Enter your Badge ID or Username" 
                value={badgeIdInput}
                onChange={(e) => setBadgeIdInput(e.target.value)}
                className="uppercase"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter your password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="pr-10"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full text-lg py-3 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-foreground/70 text-sm">
        <p>&copy; {new Date().getFullYear()} Quetta Traffic Police. All rights reserved.</p>
        <p className="mt-1">
          <Link href="/" className="hover:underline text-primary">Back to Home</Link>
        </p>
      </footer>
    </main>
  );
}
