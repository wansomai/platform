// app/api/assistant/quick/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Assistant ID - you would create this once in the OpenAI dashboard
// and then use that ID in your application
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }
    // Handle multipart form data (with files) or regular JSON
    const contentType = request.headers.get('content-type') || '';
    let message = '';
    let fileIds: string[] = [];
     console.log(request.body,'request body')

      const formData = await request.formData();
      message = formData.get('message')?.toString() || '';    
      // Process files
      const files = formData.getAll('files');
      // Upload each file to OpenAI and get file IDs
      for (const fileItem of files) {
        if (fileItem instanceof File) {
          const file = fileItem;
          
          // Convert File to Buffer
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Upload file to OpenAI
          const uploadedFile = await openai.files.create({
            file: new File([buffer], file.name, { type: file.type }),
            purpose: 'assistants',
          });
          
          fileIds.push(uploadedFile.id);
        }
      }
    
    if (!message) {
      return NextResponse.json(
        { message: 'No message or files provided' },
        { status: 400 }
      );
    }
    
    // Create a thread
    const thread = await openai.beta.threads.create();
    // Add user message to thread
    if(fileIds.length>0){
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: message,
        attachments: [{ file_id: fileIds[0], tools: [{ type: "file_search" }] }],
      });
    }
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message,
    });
    
    // Run the assistant on the thread
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID || '',
    });
    
    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    // Poll until the run completes or fails
    let attempts = 0;
    const maxAttempts = 60; // 30 second timeout with 500ms intervals
    
    while (
      runStatus.status !== 'completed' && 
      runStatus.status !== 'failed' && 
      attempts < maxAttempts
    ) {
      await new Promise(resolve => setTimeout(resolve, 500));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
    }
    
    if (runStatus.status === 'failed') {
      return NextResponse.json(
        { 
          message: 'Assistant processing failed', 
          error: runStatus.last_error?.message 
        },
        { status: 500 }
      );
    }
    
    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { message: 'Processing timed out' },
        { status: 504 }
      );
    }
    
    // Get the assistant's response
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    // Get the last assistant message
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
    
    if (assistantMessages.length === 0) {
      return NextResponse.json(
        { message: 'No response generated' },
        { status: 500 }
      );
    }
    
    // Extract the text content
    const latestMessage = assistantMessages[0];
    let responseContent = '';
    
    // Extract the text from the message content
    for (const contentPart of latestMessage.content) {
      if (contentPart.type === 'text') {
        responseContent = contentPart.text.value;
        break;
      }
    }
    
    // Clean up files after use
    // Note: In production, you might want to keep files for a certain period
    // or implement a cleanup job instead of deleting immediately
    for (const fileId of fileIds) {
      try {
        await openai.files.del(fileId);
      } catch (error) {
        console.error(`Error deleting file ${fileId}:`, error);
      }
    }
    
    return NextResponse.json({
      content: responseContent,
      timestamp: new Date().toISOString(),
      threadId: thread.id // You might want to save this to continue the conversation
    });
    
  } catch (error) {
    console.error('Error in assistant endpoint:', error);
    
    return NextResponse.json(
      { 
        message: 'Error processing request',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}