// src/lib/intentClassification.ts

export interface IntentAnalysis {
  intent: 'analysis' | 'edit' | 'research' | 'template';
  confidence: number;
  reasoning: string;
  shouldUpdateCanvas: boolean;
}

/**
 * Classify user intent to determine if canvas should be updated
 */
export function classifyUserIntent(message: string, isDraftingMode: boolean = false): IntentAnalysis {
  const lowerMessage = message.toLowerCase().trim();

  // In drafting mode, prioritize creation/editing patterns
  // Check edit/creation patterns FIRST when in drafting mode

  // Edit/Action patterns (SHOULD update canvas) - Check these first in drafting mode
  const editPatterns = [
    /add.*clause/i,
    /insert.*section/i,
    /update.*the/i,
    /change.*this/i,
    /modify.*the/i,
    /remove.*this/i,
    /delete.*the/i,
    /replace.*with/i,
    /generate.*new/i,
    /create.*a/i,
    /draft.*a/i,
    /draft.*an/i,
    /write.*a/i,
    /write.*an/i,
    /include.*the/i,
    /apply.*changes/i,
    /implement.*the/i,
    /fix.*this/i,
    /correct.*the/i,
    /revise.*this/i,
    /rewrite.*the/i,
    /please.*add/i,
    /can you.*add/i,
    /can you.*create/i,
    /can you.*draft/i,
    /can you.*write/i,
    /make.*it/i,
    /put.*in/i,
    /i need.*contract/i,
    /i need.*agreement/i,
    /i need.*document/i,
    /help me.*draft/i,
    /help me.*create/i,
    /help me.*write/i
  ];

  // Template patterns (should create new canvas)
  const templatePatterns = [
    /create.*template/i,
    /generate.*template/i,
    /new.*contract/i,
    /new.*agreement/i,
    /draft.*agreement/i,
    /draft.*contract/i,
    /employment.*contract/i,
    /nda.*template/i,
    /service.*agreement/i,
    /template.*for/i,
    /memorandum.*of.*understanding/i,
    /mou\b/i,
    /partnership.*agreement/i,
    /confidentiality.*agreement/i,
    /license.*agreement/i,
    /terms.*of.*service/i,
    /privacy.*policy/i,
    /operating.*agreement/i
  ];

  // Check edit/template patterns FIRST if in drafting mode
  if (isDraftingMode) {
    for (const pattern of templatePatterns) {
      if (pattern.test(lowerMessage)) {
        return {
          intent: 'template',
          confidence: 0.9,
          reasoning: 'Drafting mode: Detected document creation pattern',
          shouldUpdateCanvas: true
        };
      }
    }

    for (const pattern of editPatterns) {
      if (pattern.test(lowerMessage)) {
        return {
          intent: 'edit',
          confidence: 0.9,
          reasoning: 'Drafting mode: Detected document editing pattern',
          shouldUpdateCanvas: true
        };
      }
    }
  }

  // Analysis/Question patterns (should NOT update canvas)
  const analysisPatterns = [
    /what.*missing/i,
    /which.*clause/i,
    /is this.*valid/i,
    /review.*document/i,
    /check.*for/i,
    /analyze.*this/i,
    /what.*would.*you/i,
    /do you.*see/i,
    /any.*issues/i,
    /problems.*with/i,
    /suggestions.*for/i,
    /improve.*this/i,
    /what.*about/i,
    /tell me.*about/i,
    /explain.*this/i,
    /why.*is/i,
    /how.*does/i,
    /what.*happens.*if/i,
    /is.*there/i,
    /does.*this.*include/i,
    /should.*this.*have/i,
    /compliance.*with/i,
    /legal.*issues/i,
    /enforceability/i,
    /interpretation.*of/i
  ];

  // Research patterns (should respond in chat)
  const researchPatterns = [
    /find.*cases/i,
    /research.*on/i,
    /look up.*law/i,
    /what.*does.*statute/i,
    /precedent.*for/i,
    /case.*law/i,
    /regulation.*about/i,
    /legal.*definition/i,
    /court.*ruling/i,
    /jurisdiction.*rules/i
  ];

  // Check each pattern category (order matters!)
  for (const pattern of analysisPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        intent: 'analysis',
        confidence: 0.8,
        reasoning: 'Detected question/analysis pattern - user wants information, not document changes',
        shouldUpdateCanvas: false
      };
    }
  }

  for (const pattern of researchPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        intent: 'research', 
        confidence: 0.8,
        reasoning: 'Detected research pattern - user wants legal information lookup',
        shouldUpdateCanvas: false
      };
    }
  }

  for (const pattern of templatePatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        intent: 'template',
        confidence: 0.8, 
        reasoning: 'Detected template creation pattern - should create new document',
        shouldUpdateCanvas: true
      };
    }
  }

  for (const pattern of editPatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        intent: 'edit',
        confidence: 0.8,
        reasoning: 'Detected edit/action pattern - user wants document changes',
        shouldUpdateCanvas: true
      };
    }
  }

  // Default fallback - be conservative, don't update canvas unless explicitly requested
  const hasActionWords = /add|create|generate|update|change|modify|insert|include|apply|implement|fix|correct|revise|write|draft/i.test(lowerMessage);
  
  if (hasActionWords) {
    return {
      intent: 'edit',
      confidence: 0.6,
      reasoning: 'Contains action words but unclear intent - assuming edit request', 
      shouldUpdateCanvas: true
    };
  }

  return {
    intent: 'analysis',
    confidence: 0.7,
    reasoning: 'No clear action words detected - treating as analysis/question',
    shouldUpdateCanvas: false
  };
}

/**
 * Enhanced classification using context from existing document
 */
export function classifyWithContext(
  message: string,
  hasExistingDocument: boolean,
  recentMessages: string[] = [],
  isDraftingMode: boolean = false,
  hasPendingDraft: boolean = false
): IntentAnalysis {
  const baseClassification = classifyUserIntent(message, isDraftingMode);

  // If there's a pending draft request, check if user is providing information
  if (hasPendingDraft && isDraftingMode) {
    // Patterns that indicate user is providing requested information
    const isProvidingInfo =
      // Short answers with entity names, dates, numbers
      /^[A-Z][a-zA-Z\s&.,'-]+(?:and|,|&)[A-Za-z\s&.,'-]+$/.test(message.trim()) || // "ABC Corp and John Smith"
      /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(message) || // Contains dates
      /\$[\d,]+|\d+(?:\.\d{2})?(?:\s*(?:dollars|USD|EUR|GBP))?/i.test(message) || // Contains money amounts
      message.split(' ').length <= 15 || // Short response (likely answering a question)
      /^(yes|no|sure|okay|ok|right|correct),?\s/i.test(message); // Starts with affirmation

    if (isProvidingInfo) {
      return {
        intent: 'edit',
        confidence: 0.9,
        reasoning: 'User providing information for pending draft request',
        shouldUpdateCanvas: true
      };
    }
  }

  // Context-based adjustments
  if (!hasExistingDocument && isDraftingMode) {
    // No existing document - more likely to be creation request
    if (baseClassification.intent === 'analysis' && baseClassification.confidence < 0.8) {
      return {
        ...baseClassification,
        intent: 'template',
        shouldUpdateCanvas: true,
        reasoning: 'No existing document detected - likely creation request'
      };
    }
  }

  // Check recent context for confirmation patterns
  const hasRecentConfirmation = recentMessages.some(msg =>
    /yes|ok|sure|go ahead|apply|implement|add them|do it|proceed|continue/i.test(msg)
  );

  if (hasRecentConfirmation && baseClassification.intent === 'analysis') {
    return {
      ...baseClassification,
      intent: 'edit',
      shouldUpdateCanvas: true,
      reasoning: 'User confirmed action from recent context'
    };
  }

  return baseClassification;
}