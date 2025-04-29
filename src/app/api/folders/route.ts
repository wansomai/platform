// app/api/folders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';

export async function GET(request: NextRequest) {
  try {
    // Get user ID and organization
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Get folders for the organization, with document counts
    const folders = await prisma.folder.findMany({
      where: { organizationId: user.organizationId },
      include: {
        _count: {
          select: { documents: true }
        },
        children: {
          include: {
            _count: {
              select: { documents: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    // Format response
    const formattedFolders = folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      documentCount: folder._count.documents,
      children: folder.children.map(child => ({
        id: child.id,
        name: child.name,
        documentCount: child._count.documents
      })),
      createdAt: folder.createdAt.toISOString()
    }));
    
    return NextResponse.json({
      status: 200,
      message: 'Folders retrieved successfully',
      data: formattedFolders
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { message: 'Failed to fetch folders', error: true },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID and organization
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Parse request body
    const { name, parentId } = await request.json();
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { message: 'Folder name is required', error: true },
        { status: 400 }
      );
    }
    
    // If parentId is provided, verify it exists and belongs to the organization
    if (parentId) {
      const parentFolder = await prisma.folder.findUnique({
        where: { 
          id: parentId,
          organizationId: user.organizationId
        }
      });
      
      if (!parentFolder) {
        return NextResponse.json(
          { message: 'Parent folder not found', error: true },
          { status: 404 }
        );
      }
    }
    
    // Create folder
    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        organizationId: user.organizationId,
        parentId: parentId || null,
        createdBy: userId
      }
    });
    
    return NextResponse.json({
      status: 201,
      message: 'Folder created successfully',
      data: folder
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { message: 'Failed to create folder', error: true },
      { status: 500 }
    );
  }
}