
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import type { ChallanStatus } from '@prisma/client';

const updateChallanSchema = z.object({
  status: z.enum(['Paid', 'Unpaid', 'Contested']).optional(),
  fineAmount: z.number().nonnegative().optional(),
  violationType: z.string().optional(),
  vehicleType: z.string().optional(),
  violationLocation: z.string().optional(),
  reviewNotes: z.string().optional(),
  isFlaggedForReview: z.boolean().optional(),
  originalFineAmount: z.number().optional(),
  fineAmountEditedByAdmin: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id:string } }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { id } = params;

  try {
    const body = await req.json();
    const validation = updateChallanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const updateData: any = { ...validation.data };

    if (updateData.status) {
      updateData.status = updateData.status as ChallanStatus;
    }

    const updatedChallan = await prisma.challan.update({
      where: { id },
      data: updateData,
      include: {
        issuedBy: {
          select: {
            badgeNumber: true,
          },
        },
      },
    });
    
    const formattedChallan = {
        ...updatedChallan,
        issuedByOfficerBadgeId: updatedChallan.issuedBy.badgeNumber,
        date: updatedChallan.date.toISOString(),
        createdAt: updatedChallan.createdAt.toISOString(),
        updatedAt: updatedChallan.updatedAt.toISOString(),
    };


    return NextResponse.json(formattedChallan, { status: 200 });
  } catch (error) {
    console.error(`Error updating challan ${id}:`, error);
    if (error instanceof prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
       return NextResponse.json({ message: 'Challan not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
