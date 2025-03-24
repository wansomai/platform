// app/api/conversations/[id]/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth/authorization';

// Default settings
const DEFAULT_SETTINGS = {
  citeSources: true,
  suggestActions: true,
  webSearch: false,
  model: 'gpt-3.5-turbo',
  temperature: 0.7
};

// Get settings for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const conversationId = (await params).id;
    
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Verify conversation access
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        project: {
          select: {
            organizationId: true,
            members: {
              where: { userId }
            }
          }
        }
      }
    });
    
    if (!conversation) {
      return NextResponse.json(
        { message: 'Conversation not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    // Check if user has access
    const hasAccess = conversation.project.members.length > 0 || 
                     (conversation.project.organizationId === user?.organizationId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Access denied to this conversation', error: true }, 
        { status: 403 }
      );
    }
    
    // Check if conversation meta exists with settings
    const conversationMeta = await prisma.conversationMeta.findUnique({
      where: { conversationId }
    });
    
    // Return settings or defaults
    let settings = DEFAULT_SETTINGS;
    
    if (conversationMeta?.settings) {
      try {
        // Parse settings if they're stored as a JSON string
        if (typeof conversationMeta.settings === 'string') {
          settings = JSON.parse(conversationMeta.settings);
        } else {
          // Otherwise assume it's already a JSON object from Prisma
          settings = conversationMeta.settings as any;
        }
      } catch (error) {
        console.error('Error parsing settings', error);
        // Fall back to defaults if parsing fails
      }
    }
    
    return NextResponse.json({
      status: 200,
      message: 'Conversation settings retrieved successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Error fetching conversation settings:', error);
    return NextResponse.json(
      { message: 'Failed to fetch conversation settings', error: true },
      { status: 500 }
    );
  }
}

// Update settings for a conversation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const conversationId = (await params).id;
    
    // Get user ID from token
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { message: 'Authentication required', error: true }, 
        { status: 401 }
      );
    }
    
    // Get settings from request body
    const { settings } = await request.json();
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { message: 'Invalid settings object', error: true }, 
        { status: 400 }
      );
    }
    
    // Validate settings (basic validation)
    const validatedSettings = {
      citeSources: typeof settings.citeSources === 'boolean' ? settings.citeSources : DEFAULT_SETTINGS.citeSources,
      suggestActions: typeof settings.suggestActions === 'boolean' ? settings.suggestActions : DEFAULT_SETTINGS.suggestActions,
      webSearch: typeof settings.webSearch === 'boolean' ? settings.webSearch : DEFAULT_SETTINGS.webSearch,
      model: typeof settings.model === 'string' ? settings.model : DEFAULT_SETTINGS.model,
      temperature: typeof settings.temperature === 'number' ? settings.temperature : DEFAULT_SETTINGS.temperature
    };
    
    // Verify conversation access
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        project: {
          select: {
            organizationId: true,
            members: {
              where: { userId }
            }
          }
        }
      }
    });
    
    if (!conversation) {
      return NextResponse.json(
        { message: 'Conversation not found', error: true }, 
        { status: 404 }
      );
    }
    
    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true }
    });
    
    // Check if user has access
    const hasAccess = conversation.project.members.length > 0 || 
                     (conversation.project.organizationId === user?.organizationId);
    
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Access denied to this conversation', error: true }, 
        { status: 403 }
      );
    }
    
    // Upsert conversation meta with settings
    await prisma.conversationMeta.upsert({
      where: { conversationId },
      update: { settings: validatedSettings },
      create: {
        conversationId,
        settings: validatedSettings
      }
    });
    
    return NextResponse.json({
      status: 200,
      message: 'Settings updated successfully',
      data: { settings: validatedSettings }
    });
  } catch (error) {
    console.error('Error updating conversation settings:', error);
    return NextResponse.json(
      { message: 'Failed to update conversation settings', error: true },
      { status: 500 }
    );
  }
}