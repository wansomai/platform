// src/app/api/organizations/[id]/invitations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '@/lib/email-service';

// Validation schema for invitation creation
const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.string().refine(role => ['admin', 'manager', 'member'].includes(role.toLowerCase()), {
    message: "Role must be one of: admin, manager, member"
  })
});

// Get pending invitations for an organization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const organizationId = (await params).id;
    
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Verify user belongs to this organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, role: true }
    });
    
    if (!user || user.organizationId !== organizationId) {
      return NextResponse.json(
        { message: 'Access denied', error: true }, 
        { status: 403 }
      );
    }
    
    // Only admins and managers can view invitations
    if (user.role !== 'admin' && user.role !== 'manager' && user.role !== 'owner') {
      return NextResponse.json(
        { message: 'Only admins and managers can view invitations', error: true }, 
        { status: 403 }
      );
    }
    
    // Get active invitations
    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId,
        expiresAt: { gt: new Date() } // Only active invitations
      },
      include: {
        invitedBy: {
          select: { 
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Format response data
    const formattedInvitations = invitations.map(invitation => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      token: invitation.token,
      expiresAt: invitation.expiresAt.toISOString(),
      invitedById: invitation.invitedById,
      invitedByName: invitation.invitedBy.fullName || invitation.invitedBy.email,
      createdAt: invitation.createdAt.toISOString()
    }));
    
    return NextResponse.json({
      status: 200,
      message: 'Organization invitations retrieved successfully',
      data: formattedInvitations
    });
  } catch (error) {
    console.error('Error retrieving organization invitations:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve organization invitations', error: true },
      { status: 500 }
    );
  }
}

// Create a new invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const organizationId = (await params).id;
    
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Verify user belongs to this organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        organizationId: true, 
        role: true,
        email: true,
        fullName: true
      }
    });
    
    if (!user || user.organizationId !== organizationId) {
      return NextResponse.json(
        { message: 'Access denied', error: true }, 
        { status: 403 }
      );
    }
    
    // Only admins and managers can create invitations
    if (user.role !== 'admin' && user.role !== 'manager' && user.role !== 'owner') {
      return NextResponse.json(
        { message: 'Only admins and managers can create invitations', error: true }, 
        { status: 403 }
      );
    }
    
    // Validate request body
    const body = await request.json();
    const { email, role } = inviteSchema.parse(body);
    
    // Get organization details
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true }
    });
    
    if (!organization) {
      return NextResponse.json(
        { message: 'Organization not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Check if the email is already used by an existing user in this organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        organizationId
      }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email is already a member of this organization', error: true }, 
        { status: 400 }
      );
    }
    
    // Check if there's already an active invitation for this email
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId,
        expiresAt: { gt: new Date() }
      }
    });
    
    if (existingInvitation) {
      return NextResponse.json(
        { message: 'An active invitation already exists for this email', error: true }, 
        { status: 400 }
      );
    }
    
    // Generate invitation token and expiry (7 days from now)
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        role,
        token,
        expiresAt,
        organizationId,
        invitedById: userId,
        projectId: '' // Required by schema but not used for org invitations
      }
    });
    
    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invitation?token=${token}`;
    const inviterName = user.fullName || user.email;
    const organizationName = organization.name;
    
    // Prepare email HTML
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #005c4d; padding: 20px; text-align: center; color: white; }
        .content { padding: 20px; border: 1px solid #ddd; border-top: none; }
        .button { display: inline-block; background-color: #005c4d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You've been invited to join ${organizationName}</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>${inviterName} has invited you to join the ${organizationName} organization as a <strong>${role}</strong>.</p>
          <p>Click the button below to accept this invitation:</p>
          <p style="text-align: center;">
            <a href="${inviteUrl}" class="button">Accept Invitation</a>
          </p>
          <p>This invitation will expire in 7 days.</p>
          <p>If you don't have an account yet, you'll be able to create one when you accept the invitation.</p>
          <p>If you already have an account, you'll be added to the organization after accepting.</p>
          <p>If you believe this invitation was sent by mistake, you can safely ignore it.</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // Send the email
    await sendEmail({
      to: email,
      subject: `Invitation to join ${organizationName}`,
      html: emailHtml
    });
    
    return NextResponse.json({
      status: 201,
      message: 'Invitation sent successfully',
      data: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating invitation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid invitation data', errors: error.errors, error: true },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Failed to create invitation', error: true },
      { status: 500 }
    );
  }
}