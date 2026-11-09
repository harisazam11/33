
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import type { RestrictedAreaStatus } from '@prisma/client';

const updateAreaSchema = z.object({
  name: z.string().min(1, "Zone name is required.").optional(),
  locationDescription: z.string().min(1, "Location description is required.").optional(),
  restrictionType: z.string().min(1, "Restriction type is required.").optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  notes: z.string().optional().nullable(),
});

// PATCH (update) a restricted area
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  
  const { id } = params;

  try {
    const body = await req.json();
    const validation = updateAreaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...validation.data };
    if (updateData.status) {
      updateData.status = updateData.status as RestrictedAreaStatus;
    }

    const updatedArea = await prisma.restrictedArea.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(updatedArea, { status: 200 });
  } catch (error) {
    console.error(`Error updating area ${id}:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a restricted area
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { id } = params;

  try {
    await prisma.restrictedArea.delete({
      where: { id },
    });
    return new NextResponse(null, { status: 204 }); // Success, no content
  } catch (error) {
    console.error(`Error deleting area ${id}:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
