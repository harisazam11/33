import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { UserRole, UserStatus } from '@prisma/client';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  badgeNumber: z.string().min(1, 'Badge number is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'OFFICER']),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = userSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { name, badgeNumber, email, password, role } = validation.data;
    const upperCaseBadgeNumber = badgeNumber.toUpperCase();

    // Check if user already exists
    const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingUserByEmail) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const existingUserByBadge = await prisma.user.findUnique({ where: { badgeNumber: upperCaseBadgeNumber } });
    if (existingUserByBadge) {
      return NextResponse.json({ message: 'User with this badge number already exists' }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        badgeNumber: upperCaseBadgeNumber,
        email,
        password: hashedPassword,
        role: role as UserRole,
        status: 'Inactive' as UserStatus, // New users start as Inactive by default
      },
    });

    // Omit password from the response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error('User creation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An internal error occurred' }, { status: 500 });
  }
}
