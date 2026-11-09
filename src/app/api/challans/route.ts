
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import type { ChallanStatus } from '@prisma/client';

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const searchTerm = searchParams.get('searchTerm') || '';
  const statuses = searchParams.get('status')?.split(',') || [];
  const officerId = searchParams.get('officerId') || '';

  const whereClause: any = {
    AND: [],
  };

  if (searchTerm) {
    whereClause.AND.push({
      OR: [
        { id: { contains: searchTerm } },
        { plateNumber: { contains: searchTerm } },
        { violationType: { contains: searchTerm } },
        { violationLocation: { contains: searchTerm } },
        { capturedGeoLocation: { contains: searchTerm } },
        { notes: { contains: searchTerm } },
        { reviewNotes: { contains: searchTerm } },
        { issuedBy: { badgeNumber: { contains: searchTerm } } },
      ],
    });
  }

  if (statuses.length > 0) {
    whereClause.AND.push({
      status: { in: statuses as ChallanStatus[] },
    });
  }
  
  if (officerId) {
    whereClause.AND.push({
      issuedBy: { badgeNumber: { contains: officerId } },
    });
  }

  if (whereClause.AND.length === 0) {
      delete whereClause.AND;
  }

  try {
    const challans = await prisma.challan.findMany({
      where: whereClause,
      include: {
        issuedBy: {
          select: {
            badgeNumber: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const formattedChallans = challans.map(c => ({
      ...c,
      issuedByOfficerBadgeId: c.issuedBy.badgeNumber,
      date: c.date.toISOString(),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedChallans);
  } catch (error) {
    console.error('Error fetching challans:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
