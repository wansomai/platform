# LangGraph Agent Architecture for Legal Canvas

## Overview
Transform the current binary canvas update system into an intelligent agent-based architecture using LangGraph.

## Current vs Proposed Architecture

### Current (Problematic)
```
User Message → if(legalDrafting) → Always Update Canvas
```

### Proposed (LangGraph Agent)
```
User Message → Agent Analysis → Tool Selection → Targeted Action
```

## Agent Tools Design

### 1. Document Analysis Tool
```python
@tool
def analyze_document(query: str, document_content: str) -> str:
    """
    Analyze document for missing clauses, issues, improvements.
    Returns analysis in chat - does NOT modify document.
    """
    # Analyze document against query
    # Return suggestions, missing clauses, issues
    pass
```

**Use Cases:**
- "Which clauses are missing?"
- "Is this contract enforceable?"  
- "What legal issues do you see?"
- "Review this for compliance"

### 2. Canvas Update Tool  
```python
@tool
def update_canvas(instruction: str, current_content: str) -> str:
    """
    Make actual changes to the document in canvas.
    Only used for explicit editing requests.
    """
    # Perform document updates
    # Stream changes to canvas
    pass
```

**Use Cases:**
- "Add an indemnification clause"
- "Update the termination section"
- "Generate a new contract"
- "Apply the suggested changes"

### 3. Legal Research Tool
```python
@tool 
def research_legal_precedent(topic: str, jurisdiction: str) -> str:
    """
    Research legal precedents, statutes, regulations.
    Returns research results in chat.
    """
    pass
```

### 4. Document Template Tool
```python
@tool
def generate_template(document_type: str, jurisdiction: str) -> str:
    """
    Generate document templates (NDA, employment, etc.)
    Creates new canvas document.
    """
    pass
```

## Agent Decision Logic

### Intent Classification Examples:

**Analysis/Question Intents → Chat Response**
- "What's missing?"
- "Is this valid?"  
- "What would you change?"
- "Review this section"
- "Explain this clause"

**Action/Edit Intents → Canvas Update**
- "Add [specific clause]"
- "Update the [section]"  
- "Generate a [document type]"
- "Apply the changes"
- "Implement the suggestions"

**Research Intents → Research Tool**  
- "Find cases about [topic]"
- "What does [statute] say?"
- "Research [legal concept]"

## Implementation Benefits

### 1. User Experience
- **Non-destructive analysis**: Questions don't change document
- **Explicit consent**: User reviews before changes
- **Better control**: Clear separation between analysis and action

### 2. Developer Experience  
- **Modular tools**: Each tool has single responsibility
- **Easy testing**: Tools can be tested independently  
- **Maintainable**: Business logic centralized in agent

### 3. Scalability
- **Add new tools**: Contract review, clause library, etc.
- **Domain expansion**: Corporate law, IP law, etc.
- **Integration ready**: Connect to legal databases, APIs

## Migration Strategy

### Phase 1: Intent Detection (Immediate)
- Add simple intent classification to current system
- Route analysis questions to chat response
- Keep canvas updates for explicit edit requests

### Phase 2: Tool Extraction (Short-term)  
- Extract canvas update logic into dedicated tool
- Add document analysis tool
- Implement basic agent routing

### Phase 3: LangGraph Integration (Medium-term)
- Full LangGraph agent implementation
- Add research and template tools
- Implement complex workflow orchestration

### Phase 4: Advanced Features (Long-term)
- Multi-step workflows
- Conditional tool chaining  
- Learning from user preferences
- Integration with legal databases

## Example Conversations

### Analysis Request (Chat Response)
```
User: "Which clauses are missing in this NDA?"

Agent: [Uses analyze_document tool]
→ Chat: "I've reviewed your NDA and found these missing clauses:
1. Mutual obligations section
2. Return of confidential information clause  
3. Jurisdiction and governing law
4. Duration of confidentiality

Would you like me to add any of these to your document?"
```

### Edit Request (Canvas Update)
```  
User: "Yes, add the mutual obligations section"

Agent: [Uses update_canvas tool]
→ Canvas: [Document updates with new section]
→ Chat: "I've added the mutual obligations section to your NDA."
```

## Technical Implementation

### Agent Configuration
```python
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.graph import StateGraph

# Define agent state
class AgentState(TypedDict):
    messages: List[BaseMessage]  
    document_content: str
    project_context: dict
    
# Create agent graph
workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_runnable)
workflow.add_node("tools", ToolNode(tools))

workflow.add_edge("__start__", "agent")
workflow.add_conditional_edges("agent", tools_condition)
workflow.add_edge("tools", "agent")
```

### Tool Registration
```python
tools = [
    analyze_document,
    update_canvas,  
    research_legal_precedent,
    generate_template
]

agent_runnable = create_openai_tools_agent(llm, tools, prompt)
```

This architecture would transform your legal workspace into a true AI-powered legal assistant that knows when to analyze, when to act, and how to help users make informed decisions.

Thoughts on this approach?