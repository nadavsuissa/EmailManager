# Shared Modules

This directory contains shared modules, utilities, and configurations that are used across the application's client, server, and Firebase functions.

## Directory Structure

- `config/`: Contains centralized configuration and environment variable handling
- `services/`: Contains shared service utilities and type definitions

## Configuration

The `config/env.ts` module provides a centralized way to access environment variables across both server and client applications. It automatically detects the runtime environment and loads the appropriate variables.

### Usage

```typescript
import config from '../shared/config/env';

// Access configuration properties
const apiKey = config.openai.apiKey;
const defaultLanguage = config.language.default;
```

### Environment Variables

Copy the `.env.example` file to create your own `.env` file:

```bash
cp shared/config/.env.example .env
```

Then modify the values according to your environment.

## OpenAI Service

The `services/openai.types.ts` module provides shared types, constants, and utilities for working with the OpenAI API across all parts of the application.

### Usage

```typescript
import { 
  TaskExtractionResult,
  SYSTEM_PROMPTS,
  openaiUtils 
} from '../shared/services/openai.types';

// Use the shared prompts
const systemPrompt = SYSTEM_PROMPTS.TASK_EXTRACTION['he'];

// Use the utility functions
const prompt = openaiUtils.createTaskExtractionPrompt(
  emailContent, 
  emailSubject, 
  'he'
);
```

## Best Practices

1. Always use the shared configuration instead of accessing environment variables directly
2. Keep shared types and utilities in the appropriate modules
3. Update the shared modules when making changes that affect multiple parts of the application
4. Document any new shared functionality in this README 