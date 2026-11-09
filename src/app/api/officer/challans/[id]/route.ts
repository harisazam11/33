import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const flagChallanSchema = z.object({
  isFlaggedForReview: z.literal(true),
  officerReviewNotes: z.string().min(1, "Review notes are required."),
  officerSuggestedFineAmount: z.number().nonnegative().optional().nullable(),
  officerSuggestedViolationType: z.string().optional().nullable(),
  officerSuggestedVehicleType: z.string().optional().nullable(),
  officerSuggestedViolationLocation: z.string().optional().nullable(),
});

// PATCH (flag) a challan
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (session?.user?.role !== "OFFICER") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  try {
    const body = await req.json();
    const validation = flagChallanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // First, verify the challan exists and belongs to this officer
    const challanToUpdate = await prisma.challan.findFirst({
      where: {
        id: id,
        issuedByOfficerId: session.user.id,
      },
    });

    if (!challanToUpdate) {
      return NextResponse.json(
        {
          message:
            "Challan not found or you do not have permission to edit it.",
        },
        { status: 404 }
      );
    }

    if (challanToUpdate.status === "Paid") {
      return NextResponse.json(
        { message: "Cannot flag a challan that has already been paid." },
        { status: 400 }
      );
    }

    const updatedChallan = await prisma.challan.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json(updatedChallan, { status: 200 });
  } catch (error) {
    console.error(`Error flagging challan ${id}:`, error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
