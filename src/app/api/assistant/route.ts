// app/api/assistant/route.ts
import { NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth/authorization';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Assistant ID from environment variables
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;

// Encoder for streaming response
const encoder = new TextEncoder();

export async function POST(request: NextRequest) {
  try {
    // Uncomment to re-enable authentication
    // const userId = getUserIdFromRequest(request);
    // if (!userId) {
    //   return new Response(JSON.stringify({ 
    //     error: "Unauthorized", 
    //     message: "Authentication required" 
    //   }), { 
    //     status: 401, 
    //     headers: { 'Content-Type': 'application/json' }
    //   });
    // }

    // Process the form data
    const formData = await request.formData();
    const message = formData.get('message')?.toString() || '';
    const threadId = formData.get('threadId')?.toString() || null;
    
    // Process files
    const files = formData.getAll('files');
    const fileIds: string[] = [];
    
    for (const fileItem of files) {
      if (fileItem instanceof File) {
        const arrayBuffer = await fileItem.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadedFile = await openai.files.create({
          file: new File([buffer], fileItem.name, { type: fileItem.type }),
          purpose: 'assistants',
        });
        fileIds.push(uploadedFile.id);
      }
    }

    // Validate input
    if (!message && fileIds.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No message or files provided' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get or create thread
    let thread;
    if (threadId) {
      try {
        thread = await openai.beta.threads.retrieve(threadId);
      } catch (error) {
        console.warn(`Thread ${threadId} not found, creating a new one:`, error);
        thread = await openai.beta.threads.create();
      }
    } else {
      thread = await openai.beta.threads.create();
    }

    // Add user message to thread
    if (fileIds.length > 0) {
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: message,
        attachments: fileIds.map(fileId => ({ 
          file_id: fileId, 
          tools: [{ type: "file_search" }] 
        })),
      });
    } else {
      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: message,
      });
    }

    // Create a stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status to client immediately
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'status',
                status: 'started',
                threadId: thread.id,
                content: '',
              }) + '\n'
            )
          );

          // Start the stream from OpenAI
          const runStream = await openai.beta.threads.runs.stream(thread.id, {
            assistant_id: ASSISTANT_ID || '',
          });

          // Process each chunk from OpenAI
          for await (const chunk of runStream) {

            // Handle different event types
            if (chunk.event === 'thread.message.delta') {
              if (
                chunk.data?.delta?.content && 
                chunk.data.delta.content.length > 0 && 
                chunk.data.delta.content[0].type === 'text'
              ) {
                // Get the text content
                const textValue = chunk.data.delta.content[0].text?.value;
                
                if (textValue) {
                 
                  // Send the text delta to the client
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        type: 'delta',
                        threadId: thread.id,
                        messageId: chunk.data.id || chunk.data.id,
                        content: textValue,
                      }) + '\n'
                    )
                  );
                }
              }
            } else if (chunk.event === 'thread.message.created') {
             
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'status',
                    status: 'message_created',
                    threadId: thread.id,
                    messageId: chunk.data.id,
                  }) + '\n'
                )
              );
            } else if (chunk.event === 'thread.run.completed') {
             
              // Signal completion to the client
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'status',
                    status: 'completed',
                    threadId: thread.id,
                  }) + '\n'
                )
              );
            } else if (chunk.event === 'thread.run.failed') {
              // Log failure
              console.error(`Run failed for thread ${thread.id}:`, chunk.data || 'Unknown error');
              
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'error',
                    error: chunk.data || 'Run failed',
                  }) + '\n'
                )
              );
            } else if (chunk.event === 'thread.run.requires_action') {
             
              // For now, just inform the client that tools are being used
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'status',
                    status: 'tool_call',
                    threadId: thread.id,
                    content: 'Using tools to process your request...',
                  }) + '\n'
                )
              );
            }
          }

          // Clean up temporary files
          if (!threadId) {
         
            for (const fileId of fileIds) {
              try {
                await openai.files.del(fileId);
             
              } catch (error) {
                console.error(`Error deleting file ${fileId}:`, error);
              }
            }
          }
          
        } catch (error) {
          console.error('Error in stream processing:', error);
          
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
              }) + '\n'
            )
          );
        } finally {
          controller.close();
        }
      }
    });

    // Return the stream response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in assistant endpoint:', error);
    
    return new Response(
      JSON.stringify({
        message: 'Error processing request',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}