
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'OFFICER') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const plateNumber = searchParams.get('plateNumber');

  if (!plateNumber) {
    return NextResponse.json({ message: 'Plate number is required' }, { status: 400 });
  }

  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: {
        plateNumber: plateNumber.toUpperCase(),
      },
    });

    if (!vehicle) {
      return NextResponse.json({ message: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error verifying plate:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
