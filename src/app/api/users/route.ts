
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import type { UserRole, UserStatus } from '@prisma/client';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  badgeNumber: z.string().min(1, 'Badge number is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  status: z.enum(['Active', 'Inactive', 'Suspended']),
  role: z.enum(['ADMIN', 'OFFICER']),
});

// GET all users with OFFICER role
export async function GET() {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'OFFICER',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        badgeNumber: true,
        email: true,
        status: true,
        role: true,
        lastLogin: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// POST a new user
export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validation = userSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, badgeNumber, email, password, status, role } = validation.data;
    const upperCaseBadgeNumber = badgeNumber.toUpperCase();

    const existingUserByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingUserByEmail) {
      return NextResponse.json({ message: `Email "${email}" already exists.` }, { status: 409 });
    }

    const existingUserByBadge = await prisma.user.findUnique({ where: { badgeNumber: upperCaseBadgeNumber } });
    if (existingUserByBadge) {
      return NextResponse.json({ message: `Badge number "${badgeNumber}" already exists.` }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        badgeNumber: upperCaseBadgeNumber,
        email,
        password: hashedPassword,
        role: role as UserRole,
        status: status as UserStatus,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An internal error occurred' }, { status: 500 });
  }
}
