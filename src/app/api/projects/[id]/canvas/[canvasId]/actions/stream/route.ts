// app/api/projects/[id]/canvas/[canvasId]/actions/stream/route.ts
// Streaming endpoint for real-time AI processing

import { checkProjectAccess, getUserIdFromRequest } from "@/lib/auth/authorization";
import { NextRequest, NextResponse } from "next/server";
import { aiActionSchema } from "../route";
import { CanvasLangGraphAgent } from "@/lib/agents/CanvasLangGraphAgent";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; canvasId: string }> }
) {
  try {
    const { id: projectId, canvasId } = await params;
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { status: 401, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check project access
    const hasAccess = await checkProjectAccess(projectId, userId);
    if (!hasAccess) {
      return NextResponse.json(
        { status: 403, message: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = aiActionSchema.parse(body);

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              message: 'Starting AI processing...',
              timestamp: new Date().toISOString()
            })}\n\n`)
          );

          // Initialize agent and process
          const agent = new CanvasLangGraphAgent();
          
          // Set up streaming callbacks
          const streamCallbacks = {
            onProgress: (step: string, data: any) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'progress',
                  step,
                  data,
                  timestamp: new Date().toISOString()
                })}\n\n`)
              );
            },
            onToken: (token: string) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'token',
                  token,
                  timestamp: new Date().toISOString()
                })}\n\n`)
              );
            },
            onComplete: (result: any) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'complete',
                  result,
                  timestamp: new Date().toISOString()
                })}\n\n`)
              );
              controller.close();
            },
            onError: (error: any) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'error',
                  error: error.message || 'Processing failed',
                  timestamp: new Date().toISOString()
                })}\n\n`)
              );
              controller.close();
            }
          };

          // Process with streaming
          await agent.processActionWithStreaming(validatedData, streamCallbacks);

        } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Streaming failed',
            timestamp: new Date().toISOString()
          })}\n\n`)
        );
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });

  } catch (error) {
    console.error('Error in streaming AI action:', error);
    return NextResponse.json(
      { status: 500, message: 'Streaming setup failed' },
      { status: 500 }
    );
  }
}