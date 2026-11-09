
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import type { RestrictedAreaStatus } from '@prisma/client';

const restrictedAreaSchema = z.object({
  name: z.string().min(1, "Zone name is required."),
  locationDescription: z.string().min(1, "Location description is required."),
  restrictionType: z.string().min(1, "Restriction type is required."),
  status: z.enum(['Active', 'Inactive']),
  notes: z.string().optional().nullable(),
});

// GET all restricted areas
export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const areas = await prisma.restrictedArea.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(areas);
  } catch (error) {
    console.error('Error fetching restricted areas:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST a new restricted area
export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validation = restrictedAreaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { name, locationDescription, restrictionType, status, notes } = validation.data;

    const newArea = await prisma.restrictedArea.create({
      data: {
        name,
        locationDescription,
        restrictionType,
        status: status as RestrictedAreaStatus,
        notes,
      },
    });

    return NextResponse.json(newArea, { status: 201 });
  } catch (error) {
    console.error('Error creating restricted area:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
