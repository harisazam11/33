
"use client";
import Link from "next/link";
import PageTitle from "@/components/shared/PageTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ListChecks, MapPin, AlertTriangle, CheckCircle, AlertCircle as AlertCircleIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type SystemStats = {
  activeOfficers: number;
  challansThisMonth: number;
  totalFineAmountThisMonth: number;
  fineCollectedThisMonth: number;
  finesToBeCollectedThisMonth: number;
  totalRestrictedZones: number;
};

type SystemStatItem = {
  title: string;
  value: string | number;
  iconElement: JSX.Element;
  valueColor: string;
  href: string;
};

export default function AdminDashboardPage() {

  const { data: stats, isLoading, isError, error } = useQuery<SystemStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard-stats');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch dashboard stats');
      }
      return response.json();
    },
    // Refetch every 5 minutes or when the window is refocused to keep stats fresh
    refetchInterval: 5 * 60 * 1000, 
    staleTime: 5 * 60 * 1000,
  });

  const statItems: SystemStatItem[] = [
    { title: "Active Officers", value: stats?.activeOfficers ?? 0, iconElement: <Users className="h-7 w-7 mb-2 text-primary" />, valueColor: "text-primary", href: "/admin/manage-officers" },
    { title: "Challans This Month", value: stats?.challansThisMonth ?? 0, iconElement: <ListChecks className="h-7 w-7 mb-2 text-green-500" />, valueColor: "text-green-500", href: "/admin/analytics" },
    {
      title: "Total Fine Amounts (Month)",
      value: `PKR ${(stats?.totalFineAmountThisMonth ?? 0).toLocaleString()}`,
      iconElement: <span className="text-2xl font-bold mb-1 text-blue-500">PKR</span>, 
      valueColor: "text-blue-500",
      href: "/admin/analytics"
    },
    { title: "Fine Collected (Month)", value: `PKR ${(stats?.fineCollectedThisMonth ?? 0).toLocaleString()}`, iconElement: <CheckCircle className="h-7 w-7 mb-2 text-teal-500" />, valueColor: "text-teal-500", href: "/admin/analytics" },
    { title: "Fines To Be Collected (Month)", value: `PKR ${(stats?.finesToBeCollectedThisMonth ?? 0).toLocaleString()}`, iconElement: <AlertTriangle className="h-7 w-7 mb-2 text-orange-500" />, valueColor: "text-orange-500", href: "/admin/analytics" },
    { title: "Active Restricted Zones", value: stats?.totalRestrictedZones ?? 0, iconElement: <MapPin className="h-7 w-7 mb-2 text-purple-500" />, valueColor: "text-purple-500", href: "/admin/restricted-areas" },
  ];

  return (
    <>
      <PageTitle title="Admin Dashboard" description="System overview and key metrics for the E-Challan system." />
      
      <Card>
        <CardHeader>
            <CardTitle className="font-headline">System Overview</CardTitle>
            <CardDescription>Key metrics for the Parking E-Challan system. Click any metric for more details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array(6).fill(0).map((_, index) => (
              <div key={index} className="flex flex-col items-center justify-center p-4 h-32 bg-muted rounded-lg animate-pulse">
                  <div className="h-8 bg-muted-foreground/30 rounded w-1/2 mb-3"></div>
                  <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
              </div>
            ))
          ) : isError ? (
            <div className="md:col-span-2 lg:col-span-3 text-center py-12 text-destructive">
                <AlertCircleIcon className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold">Error Fetching Dashboard Stats</h3>
                <p>{error?.message || "An unknown error occurred."}</p>
            </div>
          ) : (
            statItems.map(item => (
              <Link href={item.href} key={item.title}>
                <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer h-32">
                    {item.iconElement}
                    <span className={`text-3xl font-bold font-headline ${item.valueColor}`}>{item.value}</span>
                    <span className="text-sm text-muted-foreground mt-1 text-center">{item.title}</span>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
