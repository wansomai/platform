// src/lib/associateTools.ts
// Converts AIAssociate records into Gemini tool declarations

import { Type } from '@google/genai';
import { PrismaClient } from '@/prisma/client';
import { PRACTICE_AREA_LABELS } from '@/types/associates';

const prisma = new PrismaClient();

export interface AssociateTool {
  name: string;
  description: string;
  parameters: any;
  metadata: {
    associateId: string;
    associateName: string;
    knowledgeBase: string[];
    practiceAreas: string[];
  };
}

/**
 * Generates a unique, valid function name from associate name
 * Examples: "Tax Associate" -> "useTaxAssociate"
 *           "M&A Specialist" -> "useMAndASpecialist"
 */
export function generateAssociateFunctionName(associateName: string): string {
  const sanitized = associateName
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
    .split(' ')
    .map((word, index) =>
      index === 0 ? word.toLowerCase() :
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');

  return `use${sanitized.charAt(0).toUpperCase() + sanitized.slice(1)}`;
}

/**
 * Converts an AIAssociate into a Gemini tool declaration
 */
export function generateAssociateTool(associate: any): AssociateTool {
  const functionName = generateAssociateFunctionName(associate.name);

  // Build description from associate details
  const practiceAreasText = associate.practiceAreas
    .map((pa: string) => PRACTICE_AREA_LABELS[pa as keyof typeof PRACTICE_AREA_LABELS] || pa)
    .join(', ');

  const description = `
${associate.description || `AI Associate specialized in ${practiceAreasText}`}

**Specialization**: ${practiceAreasText}

**Capabilities**:
${associate.instructions}

${associate.steps && associate.steps.length > 0 ? `
**Workflow Steps**:
${associate.steps.map((step: any, idx: number) => `${idx + 1}. ${step.description}`).join('\n')}
` : ''}

**When to use this associate**:
Use this associate when the user's question relates to ${practiceAreasText.toLowerCase()}.
The associate has access to specialized knowledge and can provide expert guidance in these areas.

Call this function to delegate the query to this specialized associate.
  `.trim();

  return {
    name: functionName,
    description,
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "The user's question or request for the associate"
        },
        context: {
          type: Type.STRING,
          description: "Additional context or specific instructions for the associate (optional)"
        }
      },
      required: ["query"]
    },
    // Store metadata for execution
    metadata: {
      associateId: associate.id,
      associateName: associate.name,
      knowledgeBase: associate.knowledgeBase || [],
      practiceAreas: associate.practiceAreas || []
    }
  };
}

/**
 * Generates tools for all active associates in a project
 */
export async function generateProjectAssociateTools(
  projectId: string
): Promise<AssociateTool[]> {
  try {
    const projectAssociates = await prisma.projectAssociate.findMany({
      where: { projectId },
      include: {
        associate: {
          include: {
            steps: { orderBy: { stepOrder: 'asc' } }
          }
        }
      }
    });

    return projectAssociates
      .filter(pa => pa.associate && pa.associate.isActive) // Only active associates
      .map(pa => generateAssociateTool(pa.associate));
  } catch (error) {
    console.error('Error generating project associate tools:', error);
    return [];
  }
}

/**
 * Get all associate tools as Gemini function declarations
 * Formats them for the Gemini API
 */
export function getAssociateToolDeclarations(associateTools: AssociateTool[]) {
  return associateTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }));
}

/**
 * Find an associate by its generated function name
 * Used during function execution to look up the associate
 */
export async function findAssociateByFunctionName(
  functionName: string,
  projectId: string
): Promise<any> {
  try {
    // Get all associates for this project
    const projectAssociates = await prisma.projectAssociate.findMany({
      where: { projectId },
      include: {
        associate: {
          where: { isActive: true },
          include: {
            steps: { orderBy: { stepOrder: 'asc' } }
          }
        }
      }
    });

    // Match by regenerating function names
    for (const pa of projectAssociates) {
      if (!pa.associate) continue;

      const generatedName = generateAssociateFunctionName(pa.associate.name);
      if (generatedName === functionName) {
        return pa.associate;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding associate by function name:', error);
    return null;
  }
}
