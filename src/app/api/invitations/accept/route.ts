// src/app/api/invitations/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import { z } from 'zod';
import { sendEmail } from '@/lib/email-service';

// Validation schema for accepting invitation
const acceptInvitationSchema = z.object({
  token: z.string().uuid('Invalid token format')
});

// Accept an invitation
export async function POST(request: NextRequest) {
  try {
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Get the user's details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        organizationId: true,
        role: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Validate request body
    const body = await request.json();
    const { token } = acceptInvitationSchema.parse(body);
    
    // Get invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: true,
        invitedBy: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });
    
    if (!invitation) {
      return NextResponse.json(
        { message: 'Invitation not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { message: 'This invitation has expired', error: true }, 
        { status: 400 }
      );
    }
    
    // Check if the invitation is for the current user's email
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { message: 'This invitation is for a different email address', error: true }, 
        { status: 403 }
      );
    }
    
    // Start a transaction to handle the user's organization update
    await prisma.$transaction(async (tx) => {
      // Get current projects from user's current organization
      const userProjects = await tx.projectMember.findMany({
        where: { userId: user.id },
        select: { projectId: true, role: true }
      });
      
      // If the user is already in the invited organization, just update their role if needed
      if (user.organizationId === invitation.organizationId) {
        // If the invitation offers a higher role than current, update it
        const roleHierarchy = { owner: 3, admin: 2, manager: 1, member: 0 };
        const currentRoleValue = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
        const invitedRoleValue = roleHierarchy[invitation.role as keyof typeof roleHierarchy] || 0;
        
        if (invitedRoleValue > currentRoleValue) {
          await tx.user.update({
            where: { id: user.id },
            data: { role: invitation.role }
          });
        }
      } else {
        // User switching organizations - update their organization and role
        await tx.user.update({
          where: { id: user.id },
          data: {
            organizationId: invitation.organizationId,
            role: invitation.role
          }
        });
        
        // Remove from previous organization's projects if they were the only member
        if (userProjects.length > 0) {
          for (const project of userProjects) {
            // Check if this user is the only member of the project
            const projectMemberCount = await tx.projectMember.count({
              where: { projectId: project.projectId }
            });
            
            if (projectMemberCount <= 1) {
              // Delete the project if user was the only member
              await tx.project.delete({
                where: { id: project.projectId }
              });
            } else {
              // Just remove the user from the project
              await tx.projectMember.delete({
                where: {
                  userId_projectId: {
                    userId: user.id,
                    projectId: project.projectId
                  }
                }
              });
            }
          }
        }
      }
      
      // Delete the invitation
      await tx.invitation.delete({
        where: { id: invitation.id }
      });
    });
    
    // Send notification email to the person who sent the invitation
    const inviterEmail = invitation.invitedBy.email;
    const inviterName = invitation.invitedBy.fullName || invitation.invitedBy.email;
    const newMemberName = user.fullName || user.email;
    const organizationName = invitation.organization.name;
    
    const notificationHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #005c4d; padding: 20px; text-align: center; color: white; }
        .content { padding: 20px; border: 1px solid #ddd; border-top: none; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Invitation Accepted</h1>
        </div>
        <div class="content">
          <p>Hello ${inviterName},</p>
          <p><strong>${newMemberName}</strong> has accepted your invitation to join the ${organizationName} organization.</p>
          <p>They now have access to the organization as a <strong>${invitation.role}</strong>.</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // Send the notification
    await sendEmail({
      to: inviterEmail,
      subject: `${newMemberName} has joined ${organizationName}`,
      html: notificationHtml
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Invitation accepted successfully',
      data: {
        organizationId: invitation.organizationId,
        organizationName: invitation.organization.name,
        role: invitation.role
      }
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid invitation data', errors: error.errors, error: true },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Failed to accept invitation', error: true },
      { status: 500 }
    );
  }
}