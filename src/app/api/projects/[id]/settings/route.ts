// app/api/projects/[id]/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkProjectAccess } from '@/lib/auth/authorization';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';

// Default settings with jurisdiction support
const DEFAULT_SETTINGS = {
  citeSources: true,
  suggestActions: true,
  webSearch: false,
  legalDrafting: false,
  model: 'gemini-2.0-flash-exp',
  temperature: 0.7,
  jurisdiction: undefined
};

// Get settings for a project
export const GET = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;

  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied to this project' },
      { status: 403 }
    );
  }

  // Check if project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      knowledgeBase: {
        select: {
          settings: true
        }
      }
    }
  });

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  const settings = project.knowledgeBase?.settings || DEFAULT_SETTINGS;

  return NextResponse.json({
    status: 200,
    message: 'Settings retrieved successfully',
    data: { settings }
  });
}));

// Update settings for a project
export const PUT = withErrorHandler(withAuth(async (
  request: NextRequest,
  userId: string,
  { params }: { params: Promise<{ id: string }> }
) => {
  const projectId = (await params).id;
  const body = await request.json();
  const { settings } = body;

  // Validate settings structure
  if (!settings || typeof settings !== 'object') {
    return NextResponse.json(
      { error: 'Invalid settings format' },
      { status: 400 }
    );
  }

  // Check if user has access to this project
  const hasAccess = await checkProjectAccess(projectId, userId);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied to this project' },
      { status: 403 }
    );
  }

  // Validate individual settings with jurisdiction support
  const validatedSettings = {
    citeSources: typeof settings.citeSources === 'boolean' ? settings.citeSources : DEFAULT_SETTINGS.citeSources,
    suggestActions: typeof settings.suggestActions === 'boolean' ? settings.suggestActions : DEFAULT_SETTINGS.suggestActions,
    webSearch: typeof settings.webSearch === 'boolean' ? settings.webSearch : DEFAULT_SETTINGS.webSearch,
    legalDrafting: typeof settings.legalDrafting === 'boolean' ? settings.legalDrafting : DEFAULT_SETTINGS.legalDrafting,
    model: typeof settings.model === 'string' ? settings.model : DEFAULT_SETTINGS.model,
    temperature: typeof settings.temperature === 'number' ? settings.temperature : DEFAULT_SETTINGS.temperature,
    jurisdiction: settings.jurisdiction && typeof settings.jurisdiction === 'object' ? {
      id: settings.jurisdiction.id,
      name: settings.jurisdiction.name,
      country: settings.jurisdiction.country,
      state: settings.jurisdiction.state,
      legalSystem: settings.jurisdiction.legalSystem,
      citationStyle: settings.jurisdiction.citationStyle
    } : undefined
  };

  // Get current project
  const currentProject = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true }
  });

  if (!currentProject) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  // Update or create knowledgeBase with settings
  await prisma.knowledgeBase.upsert({
    where: { projectId },
    update: {
      settings: validatedSettings
    },
    create: {
      projectId,
      settings: validatedSettings
    }
  });

  return NextResponse.json({
    status: 200,
    message: 'Settings updated successfully',
    data: { settings: validatedSettings }
  });
}));