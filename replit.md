# Chat Application Project

## Overview
Chat application with sophisticated UI featuring code formatting, conversation history, and Supabase database integration. Authentication has been removed per user request to simplify the system.

## Recent Changes
- **2025-01-29**: Removed authentication system completely
  - Eliminated useAuth hooks from frontend components
  - Removed auth middleware from backend routes
  - Simplified chat sidebar to load conversations without user dependency
  - All routes now accessible without authentication

## User Preferences
- Prefers Portuguese language in interface
- Wants 20 conversations loaded per page in sidebar
- Requires vertical scroll with infinite pagination
- Prefers Supabase over PostgreSQL for database

## Project Architecture
### Frontend
- React with TypeScript and Vite
- Wouter for routing
- TanStack Query for data fetching
- Tailwind CSS + shadcn/ui for styling
- Theme provider for dark/light mode

### Backend
- Express.js server
- Supabase database connection
- No authentication required
- RESTful API endpoints

### Key Features
- Code block formatting with syntax highlighting
- Inline code formatting with proper styling
- Conversation history from Supabase
- Infinite scroll pagination (20 items per load)
- Theme switching capability
- Chat interface with message formatting

## Database Structure
- Uses Supabase with student_id field (value: 5) for user identification
- Conversations stored with message content and metadata
- No user authentication tables needed

## API Endpoints
- `/api/conversations-all` - Get all conversations
- `/api/conversations` - Get conversations for specific user
- `/api/webhook/send` - Send messages to n8n webhook
- `/api/test-supabase` - Test database connection

## Environment Variables Required
- SUPABASE_URL
- SUPABASE_ANON_KEY
- N8N_WEBHOOK_URL (optional)