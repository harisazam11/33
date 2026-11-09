
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET all ACTIVE restricted areas for officers
export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'OFFICER') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const areas = await prisma.restrictedArea.findMany({
      where: {
        status: 'Active',
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(areas);
  } catch (error) {
    console.error('Error fetching active restricted areas:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
