# Prompts Directory

This directory contains all the prompt templates and conversation flows used by the ValuEnable AI Assistant.

## Structure

### `index.ts`
The main prompts file containing all organized prompt templates:

- **SystemPrompts**: Core system prompts for AI assistant behavior
- **TrainingPrompts**: Templates for training data analysis and processing
- **ConversationFlows**: Structured conversation branches for different scenarios
- **ResponseTemplates**: Common response patterns for errors, success, and multilingual support
- **PolicyInformation**: Standard policy details and common query responses

### Key Components

#### SystemPrompts
- `VEENA_BASE_SYSTEM_PROMPT`: Main system prompt with complete conversation flow
- `KNOWLEDGE_BASE_INSTRUCTION`: Additional instructions for knowledge base integration

#### ConversationFlows
- `GREETING_FLOW`: Initial customer contact and name collection
- `PAYMENT_FLOW`: Payment-related conversation branches
- `FINANCIAL_DIFFICULTY_FLOW`: Handling customers with financial constraints
- `POLICY_INFO_FLOW`: Policy details, lapse concerns, and claims information
- `SERVICE_FLOW`: Technical issues, callbacks, and conversation closure

#### ResponseTemplates
- `ERROR_RESPONSES`: Standard error handling messages
- `SUCCESS_RESPONSES`: Positive confirmation messages
- `MULTILINGUAL_RESPONSES`: Hindi, Marathi, and Gujarati translations

#### PolicyInformation
- `POLICY_DETAILS`: Standard policy information (premium, sum assured, etc.)
- `POLICY_QUERIES`: Common query responses with policy-specific data

### PromptManager Utility Class

The `PromptManager` class provides utility methods for:
- Formatting training prompts with dynamic data
- Getting system prompts with optional training insights
- Retrieving multilingual responses
- Formatting conversation flows with variables

## Usage

Import the prompts in your service files:

```typescript
import { PromptManager, SystemPrompts, ConversationFlows } from '../prompts/index';

// Get system prompt with training insights
const systemPrompt = PromptManager.getSystemPrompt(trainingInsights);

// Format training data
const trainingPrompt = PromptManager.formatTrainingPrompt({
  customerQuestions: questions,
  agentResponses: responses,
  keyInsights: insights,
  usableDataCount: count,
  averageQualityScore: score
});

// Get multilingual response
const hindiResponse = PromptManager.getResponseForLanguage('hindi', 'greeting');
```

## Benefits

1. **Centralized Management**: All prompts are in one location for easy maintenance
2. **Type Safety**: TypeScript interfaces ensure consistent prompt structure
3. **Reusability**: Common prompt patterns can be reused across services
4. **Versioning**: Easy to track changes and maintain prompt history
5. **Testing**: Isolated prompt logic for better unit testing
6. **Multilingual Support**: Organized language-specific responses
7. **Dynamic Content**: Template variables for personalized responses

## Maintenance

When adding new prompts:
1. Add to the appropriate category in `index.ts`
2. Update the `PromptManager` utility methods if needed
3. Update this README with new structure information
4. Test the prompts in the application before deployment

## Integration

The prompts are integrated into:
- `server/services/openai.ts` - Main AI service using system prompts
- `server/services/trainingService.ts` - Training data analysis and processing
- Future services requiring standardized conversation flows