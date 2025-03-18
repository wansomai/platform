// src/app/api/projects/[id]/team/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Schema validation for adding team members
const addTeamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required')
});

// Configure email transport
const setupEmailTransport = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASSWORD || ''
    }
  });
};

// Send invitation email to new users
const sendInvitationEmail = async (
  email: string, 
  projectName: string, 
  inviterName: string,
  inviteToken: string
) => {
  const transport = setupEmailTransport();
  
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invitation?token=${inviteToken}`;
  
  const message = {
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    to: email,
    subject: `You've been invited to collaborate on ${projectName}`,
    text: `Hello,

${inviterName} has invited you to collaborate on the project "${projectName}".

Click the link below to accept the invitation and create your account:
${inviteUrl}

If you already have an account, you'll be able to access this project after accepting the invitation.

This invitation will expire in 7 days.

Thanks,
The Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Project Invitation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px; }
    .button { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Project Invitation</h1>
  </div>
  <div class="content">
    <p>Hello,</p>
    <p><strong>${inviterName}</strong> has invited you to collaborate on the project <strong>"${projectName}"</strong>.</p>
    <p>Click the button below to accept the invitation and create your account:</p>
    <p style="text-align: center;">
      <a href="${inviteUrl}" class="button">Accept Invitation</a>
    </p>
    <p>If you already have an account, you'll be able to access this project after accepting the invitation.</p>
    <p>This invitation will expire in 7 days.</p>
    <div class="footer">
      <p>Thanks,<br>The Team</p>
    </div>
  </div>
</body>
</html>
    `
  };
  
  return transport.sendMail(message);
};

// GET handler - List team members for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const projectId = (await params).id;
    
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Project not found' 
        },
        { status: 404 }
      );
    }
    
    // Get team members
    const teamMembers = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          }
        }
      }
    });
    
    // Format for response
    const formattedTeamMembers = teamMembers.map(member => ({
      id: member.user.id,
      name: member.user.fullName,
      email: member.user.email,
      role: member.role,
    }));
    
    return NextResponse.json({
      status: 200,
      message: 'Team members retrieved successfully',
      data: formattedTeamMembers
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// POST handler - Add a team member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, userId: string }> }
) {
  try {
    const projectId = (await params).id;
    const userId = (await params).userId;
    
    
    // Get project to verify it exists and get details for the invitation
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        organizationId: true
      }
    });
    
    if (!project) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Project not found' 
        },
        { status: 404 }
      );
    }
    
    // Get current user (inviter) details for the invitation email
    const inviter = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        fullName: true,
        email: true
      }
    });
    
    if (!inviter) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Inviter user not found' 
        },
        { status: 404 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { email, role } = addTeamMemberSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    // If user exists, add them to the project
    if (existingUser) {
      // Check if they're already a team member
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: existingUser.id,
            projectId
          }
        }
      });
      
      if (existingMember) {
        return NextResponse.json(
          { 
            status: 409,
            message: 'User is already a member of this project' 
          },
          { status: 409 }
        );
      }
      
      // Add user to project
      const projectMember = await prisma.projectMember.create({
        data: {
          role,
          user: {
            connect: { id: existingUser.id }
          },
          project: {
            connect: { id: projectId }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            }
          }
        }
      });
      
      // Format response
      const teamMember = {
        id: projectMember.user.id,
        name: projectMember.user.fullName,
        email: projectMember.user.email,
        role: projectMember.role,
      };
      
      return NextResponse.json({
        status: 201,
        message: 'Team member added successfully',
        data: teamMember
      }, { status: 201 });
    } else {
      // User doesn't exist - create an invitation instead of returning 404
      
      // Generate a unique invitation token
      const inviteToken = uuidv4();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // Expires in 7 days
      
      // Create invitation record
      const invitation = await prisma.invitation.create({
        data: {
          email,
          role,
          token: inviteToken,
          expiresAt: expiryDate,
          project: {
            connect: { id: projectId }
          },
          invitedBy: {
            connect: { id: userId }
          },
          organization: {
            connect: { id: project.organizationId }
          }
        }
      });
      
      // Send invitation email
      try {
        await sendInvitationEmail(
          email,
          project.title,
          inviter.fullName || inviter.email,
          inviteToken
        );
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Continue even if email fails - the invitation is still created
      }
      
      return NextResponse.json({
        status: 201,
        message: 'Invitation sent successfully',
        data: {
          email,
          role,
          invitationId: invitation.id,
          expiresAt: invitation.expiresAt
        }
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error adding team member:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          status: 400,
          message: 'Validation failed', 
          errors: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}