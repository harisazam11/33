
"use client";
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageTitle from "@/components/shared/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Sigma, CalendarDays, Home as HomeIcon, UserX, Loader2 } from "lucide-react";
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import type { ViolationRecord } from '@/types';

export default function OfficerHomePage() {
  const { data: session, status: sessionStatus } = useSession();

  const { data: allChallans = [], isLoading: isLoadingChallans } = useQuery<ViolationRecord[]>({
    queryKey: ['officerChallans', session?.user?.id],
    queryFn: async () => {
      const response = await fetch('/api/officer/challans');
      if (!response.ok) {
        throw new Error('Failed to fetch violation history');
      }
      return response.json();
    },
    enabled: !!session?.user?.id,
  });

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    let todaysChallansCount = 0;
    let todaysTotalFine = 0;
    let weeklyChallansCount = 0;

    allChallans.forEach(challan => {
      const challanDate = new Date(challan.date);
      challanDate.setHours(0, 0, 0, 0);

      if (challanDate.getTime() === today.getTime()) {
        todaysChallansCount++;
        todaysTotalFine += challan.fineAmount;
      }
      if (challanDate >= oneWeekAgo && challanDate <= today) {
        weeklyChallansCount++;
      }
    });

    return {
      todaysChallansCount,
      todaysTotalFine,
      weeklyChallansCount
    };
  }, [allChallans]);

  if (sessionStatus === 'loading' || (session && isLoadingChallans)) {
    return (
      <>
        <PageTitle title="Officer Home" description="Loading your dashboard..." />
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="mx-auto h-12 w-12 mb-4 animate-spin" />
          <h3 className="text-xl font-semibold">Loading Officer Dashboard...</h3>
        </div>
      </>
    );
  }

  if (!session?.user) {
    return (
      <>
        <PageTitle title="Access Denied" description="You must be logged in to view this page." />
        <Card className="w-full shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <UserX className="text-destructive h-6 w-6" /> Not Logged In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-4">
              Please log in to access the officer portal.
            </p>
            <Link href="/login" passHref>
              <Button className="w-full mt-4">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Officer Home" description="Issue new challans and view your activity summary." />
      
      <Card className="mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">New Parking Violation</CardTitle>
          <CardDescription>Click the button below to start issuing a new parking e-challan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/officer/issue-challan" passHref>
            <Button size="lg" className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground group">
              <FileText className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" /> Issue New Parking E-Challan
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-4 font-headline text-primary">Your Activity Summary</h2>
        <p className="text-sm text-muted-foreground mb-4">Click any card to view your full violation history. Stats are updated live.</p>
        <div className="grid gap-6 md:grid-cols-3">
          <Link href="/officer/violation-history" className="block hover:shadow-xl transition-shadow duration-200 rounded-lg">
            <Card className="shadow-lg h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Issued Challans</CardTitle>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary font-headline">{stats.todaysChallansCount}</div>
                <p className="text-xs text-muted-foreground">Challans issued by you today</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/officer/violation-history" className="block hover:shadow-xl transition-shadow duration-200 rounded-lg">
            <Card className="shadow-lg h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Total Fine Amount</CardTitle>
                <Sigma className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500 font-headline">PKR {stats.todaysTotalFine.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total fine amount from challans today</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/officer/violation-history" className="block hover:shadow-xl transition-shadow duration-200 rounded-lg">
            <Card className="shadow-lg h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Challans This Week</CardTitle>
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-500 font-headline">{stats.weeklyChallansCount}</div>
                <p className="text-xs text-muted-foreground">Challans issued by you in the last 7 days</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </>
  );
}
