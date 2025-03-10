// src/app/api/projects/[id]/client/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema validation
const clientInfoSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  contact_person: z.string().optional(),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
})

// GET handler - Get client information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // Get project knowledge base
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { projectId }
    })
    
    if (!knowledgeBase) {
      return NextResponse.json(
        { 
          status: 404,
          message: 'Knowledge base not found' 
        },
        { status: 404 }
      )
    }
    
    // Extract client info
    const clientInfo = knowledgeBase.clientInfo as any || null
    
    return NextResponse.json({
      status: 200,
      message: 'Client information retrieved successfully',
      data: clientInfo
    })
  } catch (error) {
    console.error('Error fetching client information:', error)
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// PUT handler - Update client information
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // Parse and validate request body
    const body = await request.json()
    const clientInfo = clientInfoSchema.parse(body)
    
    // Get knowledge base
    let knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { projectId }
    })
    
    // If knowledge base doesn't exist, create it
    if (!knowledgeBase) {
      knowledgeBase = await prisma.knowledgeBase.create({
        data: {
          project: {
            connect: { id: projectId }
          }
        }
      })
    }
    
    // Update client info
    const updatedKnowledgeBase = await prisma.knowledgeBase.update({
      where: { id: knowledgeBase.id },
      data: {
        clientInfo: clientInfo as any
      }
    })
    
    return NextResponse.json({
      status: 200,
      message: 'Client information updated successfully',
      data: clientInfo
    })
  } catch (error) {
    console.error('Error updating client information:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          status: 400,
          message: 'Validation failed', 
          errors: error.errors 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        status: 500,
        message: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}