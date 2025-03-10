// src/app/api/assistant/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Schema validation for messages - Fix: Make threadId properly optional
const messageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  threadId: z.string().optional().nullable(), // Allow null values
});

// Function to clean assistant messages
const cleanAssistantMessage = (content: string): string => {
  // Remove any system instructions/artifacts that might be in the response
  return content
    .replace(/\n\nI'll help you with that\./g, '')
    .replace(/\n\nI'd be happy to help\./g, '')
    .replace(/\n\nCertainly\./g, '')
    .trim();
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { content, threadId } = messageSchema.parse(body);

    // Default assistant ID - you can make this configurable
    const assistantId = process.env.OPENAI_ASSISTANT_ID || 'asst_abc123'; // replace with your assistant ID

    // Check if we need to create a new thread or use an existing one
    let thread;
    if (threadId) {
      // Use existing thread
      try {
        thread = await openai.beta.threads.retrieve(threadId);
      } catch (error) {
        console.error('Error retrieving thread, creating a new one:', error);
        thread = await openai.beta.threads.create();
      }
    } else {
      // Create a new thread
      thread = await openai.beta.threads.create();
    }

    // Add the user message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content,
    });

    // Run the assistant on the thread
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    // Poll for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    // Simple polling mechanism with timeout
    let attempts = 0;
    const maxAttempts = 60; // 30 seconds max (0.5s * 60)
    
    while (runStatus.status !== 'completed' && runStatus.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
    }

    if (runStatus.status === 'failed') {
      return NextResponse.json(
        {
          status: 500,
          message: 'Assistant run failed',
          error: runStatus.last_error?.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        {
          status: 408,
          message: 'Request timeout',
          error: 'The assistant is taking too long to respond',
        },
        { status: 408 }
      );
    }

    // Get the messages from the thread
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    // Get the latest assistant message
    const assistantMessages = messages.data
      .filter(msg => msg.role === 'assistant')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    if (assistantMessages.length === 0) {
      return NextResponse.json(
        {
          status: 404,
          message: 'No assistant response found',
        },
        { status: 404 }
      );
    }

    // Extract and format the assistant's response
    const latestMessage = assistantMessages[0];
    let assistantResponse = '';
    
    if (latestMessage.content[0].type === 'text') {
      assistantResponse = cleanAssistantMessage(latestMessage.content[0].text.value);
    }

    return NextResponse.json({
      status: 200,
      message: 'Response received',
      data: {
        threadId: thread.id,
        content: assistantResponse,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error in assistant API:', error);
    
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
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}