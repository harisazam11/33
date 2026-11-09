import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import type { ChallanStatus } from "@prisma/client";

const createChallanSchema = z.object({
  plateNumber: z.string().min(1),
  vehicleType: z.string().min(1),
  violationType: z.string().min(1),
  violationLocation: z.string().min(1),
  notes: z.string().optional().nullable(),
  fineAmount: z.coerce.number().nonnegative(),
  capturedTimestamp: z.string().optional().nullable(),
  capturedGeoLocation: z.string().optional().nullable(),
});

// GET all challans for the logged-in officer
export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "OFFICER") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const challans = await prisma.challan.findMany({
      where: {
        issuedByOfficerId: session.user.id,
      },
      include: {
        vehicle: {
          select: {
            plateNumber: true,
          },
        },
        issuedBy: {
          select: {
            badgeNumber: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    const formattedChallans = challans.map((c) => ({
      ...c,
      issuedByOfficerBadgeId: c.issuedBy.badgeNumber,
    }));

    return NextResponse.json(formattedChallans);
  } catch (error) {
    console.error("Error fetching officer challans:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST a new challan
export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "OFFICER") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validation = createChallanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { plateNumber, ...challanData } = validation.data;

    console.log("DANGER DANGER: ", plateNumber);
    // Find the vehicle to link it
    const vehicle = await prisma.vehicle.findUnique({
      where: { plateNumber },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: `Vehicle with plate number ${plateNumber} not found.` },
        { status: 404 }
      );
    }

    const newChallan = await prisma.challan.create({
      data: {
        ...challanData,
        date: new Date(),
        status: "Unpaid" as ChallanStatus,
        issuedByOfficerId: session.user.id,
        vehicleId: vehicle.id,
        // Default values for fields not provided by officer on creation
        isFlaggedForReview: false,
        fineAmountEditedByAdmin: false,
        plateNumber,
      },
    });

    return NextResponse.json(newChallan, { status: 201 });
  } catch (error) {
    console.error("Error creating challan:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
