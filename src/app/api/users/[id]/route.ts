
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import type { UserStatus } from '@prisma/client';

const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  status: z.enum(['Active', 'Inactive', 'Suspended']).optional(),

  // For officer password reset by an admin
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  
  // For an admin changing their own password
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').optional(),
}).refine(data => {
    // Cannot have both types of password changes at once
    return !(data.password && data.newPassword);
}, {
    message: "Cannot perform both password reset and password change at the same time.",
    path: ["password"],
}).refine(data => {
    // If changing password with newPassword, currentPassword must be provided
    return !(data.newPassword && !data.currentPassword);
}, {
    message: "Current password is required to set a new password.",
    path: ["currentPassword"],
});


// PATCH (update) a user
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  
  const { id } = params;

  try {
    const body = await req.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, email, status, password, currentPassword, newPassword } = validation.data;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (status) {
        updateData.status = status as UserStatus;
    }

    // Case 1: Admin is changing their own password from the Settings page
    if (newPassword && currentPassword) {
      if (session.user.id !== id) {
        return NextResponse.json({ message: 'Can only change your own password from the settings page.' }, { status: 403 });
      }
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user || !user.password) {
        return NextResponse.json({ message: 'User not found or has no password set.' }, { status: 404 });
      }
      const passwordsMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordsMatch) {
        return NextResponse.json({ message: 'Incorrect current password' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }
    // Case 2: Admin is resetting an officer's password from the Manage Officers page
    else if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }
    
    // Check for email uniqueness if it's being changed
    if (email) {
        const existingUserByEmail = await prisma.user.findFirst({ where: { email, id: { not: id } } });
        if (existingUserByEmail) {
            return NextResponse.json({ message: `Email "${email}" already exists.` }, { status: 409 });
        }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No update data provided." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a user
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    if (session.user.id === id) {
        return NextResponse.json({ message: 'You cannot delete your own account.' }, { status: 400 });
    }

    try {
        await prisma.user.delete({
            where: { id },
        });
        return new NextResponse(null, { status: 204 }); // Success, no content
    } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
