
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);

    // 1. Get Active Officers
    const activeOfficers = await prisma.user.count({
      where: {
        role: 'OFFICER',
        status: 'Active',
      },
    });

    // 2. Get Active Restricted Zones
    const totalRestrictedZones = await prisma.restrictedArea.count({
      where: {
        status: 'Active',
      },
    });

    // 3. Get Challan stats for the current month
    const challansInMonth = await prisma.challan.findMany({
        where: {
            date: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    const challansThisMonth = challansInMonth.length;
    
    const totalFineAmountThisMonth = challansInMonth.reduce((sum, challan) => sum + challan.fineAmount, 0);

    const fineCollectedThisMonth = challansInMonth
      .filter(challan => challan.status === 'Paid')
      .reduce((sum, challan) => sum + challan.fineAmount, 0);
    
    const finesToBeCollectedThisMonth = totalFineAmountThisMonth - fineCollectedThisMonth;


    return NextResponse.json({
      activeOfficers,
      challansThisMonth,
      totalFineAmountThisMonth,
      fineCollectedThisMonth,
      finesToBeCollectedThisMonth,
      totalRestrictedZones,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
