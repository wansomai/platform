// app/api/projects/[id]/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkProjectAccess } from '@/lib/auth/authorization';
import { withAuth, withErrorHandler } from '@/lib/api/middleware';
import { getJurisdictionByCountryCode } from '@/lib/jurisdictions';

// Default settings with jurisdiction support
const DEFAULT_SETTINGS = {
  citeSources: true,
  suggestActions: true,
  webSearch: false,
  legalDrafting: false,
  googleCalendar: false,
  gmail: false,
  aiAssociates: true,
  model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
  temperature: 0.5,
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

  const detectedCountryCode = request.headers.get('x-vercel-ip-country');
  const suggestedJurisdiction = detectedCountryCode
    ? getJurisdictionByCountryCode(detectedCountryCode) ?? null
    : null;

  return NextResponse.json({
    status: 200,
    message: 'Settings retrieved successfully',
    data: { settings, suggestedJurisdiction }
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
    googleCalendar: typeof settings.googleCalendar === 'boolean' ? settings.googleCalendar : DEFAULT_SETTINGS.googleCalendar,
    gmail: typeof settings.gmail === 'boolean' ? settings.gmail : DEFAULT_SETTINGS.gmail,
    aiAssociates: typeof settings.aiAssociates === 'boolean' ? settings.aiAssociates : DEFAULT_SETTINGS.aiAssociates,
    model: typeof settings.model === 'string' ? settings.model : DEFAULT_SETTINGS.model,
    temperature: typeof settings.temperature === 'number' ? settings.temperature : DEFAULT_SETTINGS.temperature,
    // Support both singular jurisdiction and plural jurisdictions (from UI)
    // The AI prompt reads settings.jurisdiction, so we normalize here
    jurisdiction: settings.jurisdiction && typeof settings.jurisdiction === 'object' && !Array.isArray(settings.jurisdiction) ? {
      id: settings.jurisdiction.id,
      name: settings.jurisdiction.name,
      country: settings.jurisdiction.country,
      state: settings.jurisdiction.state,
      legalSystem: settings.jurisdiction.legalSystem,
      citationStyle: settings.jurisdiction.citationStyle
    } : Array.isArray(settings.jurisdictions) && settings.jurisdictions.length > 0 ? {
      id: settings.jurisdictions[0].id,
      name: settings.jurisdictions[0].name,
      country: settings.jurisdictions[0].country,
      state: settings.jurisdictions[0].state,
      legalSystem: settings.jurisdictions[0].legalSystem,
      citationStyle: settings.jurisdictions[0].citationStyle
    } : undefined,
    jurisdictions: Array.isArray(settings.jurisdictions) ? settings.jurisdictions.map((j: any) => ({
      id: j.id,
      name: j.name,
      country: j.country,
      state: j.state,
      legalSystem: j.legalSystem,
      citationStyle: j.citationStyle
    })) : undefined
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