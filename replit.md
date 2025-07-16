# ValuEnable AI Assistant - Insurance Voice Helper

## Overview

This is a full-stack web application for an AI-powered insurance voice assistant. The application allows users to interact with an AI agent through both text and voice input to get help with insurance-related queries, policy information, claims processing, and general insurance guidance.

**Current Status**: Fully operational voice assistant with multilingual support (Hindi/English/Marathi/Gujarati, no Urdu), enhanced with ElevenLabs integration, following detailed ValuEnable conversation flow scripts, comprehensive MP4 training data upload with improved transcription algorithms, and successful knowledge base integration with accurate policy information retrieval.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**Latest Update (July 16, 2025):**
- ✅ Fixed voice input double-click issue with enhanced debouncing
- ✅ Removed Urdu language support (Hindi/English/Marathi/Gujarati only)
- ✅ Implemented complete MP4/WAV training data upload system
- ✅ Added multer-based file upload with 100MB limit
- ✅ Automatic transcription processing with OpenAI Whisper
- ✅ Robust file type validation (supports MP4, WAV, MP3, WebM, OGG, M4A)
- ✅ Training data management endpoints fully functional
- ✅ Database storage with base64 encoded audio data
- ✅ Async background processing for transcription
- ✅ Implemented detailed ValuEnable conversation flow script
- ✅ Enhanced OpenAI system prompt with structured conversation branches
- ✅ Added reprocess functionality for improved transcription quality
- ✅ Updated knowledge base with conversation flow guidelines
- ✅ Veena now follows professional insurance agent conversation structure
- ✅ Added delete functionality for training data with confirmation dialog
- ✅ Created complete CRUD operations for training data management
- ✅ Fixed API request handling for proper HTTP method support
- ✅ Fixed voice input double-processing issue with proper audio blob reset
- ✅ Improved voice recording state management for multiple recordings
- ✅ Enhanced VoiceModal component with better cleanup between recordings
- ✅ Implemented complete voice output functionality for AI responses
- ✅ Added auto-speak feature for AI messages with toggle control
- ✅ Enhanced speech synthesis with natural female voice selection
- ✅ Added manual speak/stop controls for individual AI messages
- ✅ Integrated voice controls into conversation interface
- ✅ **Fixed critical knowledge base integration issue** - resolved SQL array query errors
- ✅ **AI now properly retrieves specific policy information** from knowledge base
- ✅ **Enhanced premium query handling** - prioritizes policy details, payments, and revival info
- ✅ **Simplified knowledge base search** - uses in-memory filtering to avoid SQL array complications
- ✅ **Confirmed accurate policy data access** - Premium paid: ₹4,00,000, Sum Assured: ₹10,00,000
- ✅ **Voice input and output both working** with proper policy information retrieval
- ✅ **Enhanced complete audio file processing** - entire MP4/WAV files now processed with improved transcription
- ✅ **Optimized OpenAI Whisper transcription** - verbose JSON format with contextual prompts for better accuracy
- ✅ **Improved training data analysis** - comprehensive extraction of complete conversation insights
- ✅ **Enhanced quality scoring system** - better evaluation of complete audio transcriptions (5-100% range)
- ✅ **Conversation flow preservation** - maintains dialogue structure while removing only corrupted repetitions
- ✅ **Multilingual conversation support** - AI responds in Hindi/English/Marathi/Gujarati based on user language

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management
- **Styling**: Tailwind CSS with CSS variables for theming
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Design System**: "New York" style with neutral base colors and customizable themes

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Design**: RESTful API with JSON responses
- **Error Handling**: Centralized error middleware with structured responses

### Data Storage Solutions
- **Database**: PostgreSQL for persistent data storage (Active)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Defined in shared TypeScript files for consistency
- **Session Management**: PostgreSQL-based session storage with connect-pg-simple
- **Storage Implementation**: DatabaseStorage class for all CRUD operations
- **In-Memory Fallback**: Memory-based storage implementation available for development

## Key Components

### Database Schema
- **Users**: Basic user authentication and identification
- **Conversations**: Session-based conversation tracking with metadata
- **Messages**: Individual messages with type classification (user/ai/system)
- **Knowledge Base**: Structured insurance information for AI responses
- **Training Data**: Storage for MP4 call recordings with transcription processing

### AI Integration
- **OpenAI Service**: GPT-4o integration for natural language processing
- **Speech Services**: Audio transcription and text-to-speech capabilities
- **Knowledge Base Search**: Semantic search through insurance knowledge base
- **Context Management**: Conversation history and context preservation

### Voice Features
- **Speech Recognition**: Browser-based speech-to-text using Web Speech API
- **Audio Recording**: MediaRecorder API for audio capture
- **Speech Synthesis**: Browser-based text-to-speech for AI responses
- **Voice Controls**: Comprehensive voice interaction interface

### UI Components
- **Conversation Area**: Real-time message display with typing indicators
- **Voice Modal**: Dedicated interface for voice interactions
- **Sidebar**: Quick actions and analytics dashboard
- **Responsive Design**: Mobile-first approach with adaptive layouts

## Data Flow

1. **User Interaction**: User initiates conversation through text or voice input
2. **Session Management**: System creates or retrieves conversation session
3. **Message Processing**: User input is processed and stored in database
4. **AI Processing**: 
   - Knowledge base search for relevant information
   - Context building from conversation history
   - OpenAI API call for response generation
5. **Response Delivery**: AI response is stored and delivered to user
6. **Voice Synthesis**: Text responses converted to speech when requested
7. **Analytics**: Conversation metrics and performance data collected

## API Endpoints

### Training Data Management
- **POST /api/training/upload**: Upload MP4 call recordings for training
- **GET /api/training**: List all training data entries
- **GET /api/training/:id**: Get specific training data entry details
- **POST /api/training/:id/reprocess**: Reprocess training data with improved algorithms
- **DELETE /api/training/:id**: Delete training data entry with confirmation

### Voice & Conversation Management
- **POST /api/conversations**: Start new conversation session
- **GET /api/conversations/:sessionId**: Get conversation with messages
- **POST /api/conversations/:sessionId/messages**: Send text message
- **POST /api/conversations/:sessionId/voice**: Process voice input
- **GET /api/conversations/:sessionId/analytics**: Get conversation analytics

## External Dependencies

### Core Technologies
- **OpenAI API**: For natural language processing and audio transcription
- **ElevenLabs API**: Enhanced speech processing and text-to-speech capabilities
- **Neon Database**: Serverless PostgreSQL hosting
- **Radix UI**: Accessible UI component primitives
- **TanStack React Query**: Server state management and caching

### Voice Processing
- **Web Speech API**: Browser-native speech recognition
- **MediaRecorder API**: Audio recording capabilities
- **OpenAI Whisper**: Audio transcription service with multilingual support
- **ElevenLabs TTS**: High-quality text-to-speech synthesis

### Development Tools
- **Vite**: Development server and build tool
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Server-side bundling for production

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Development database with memory fallback
- **Environment Variables**: OpenAI API key and database URL configuration

### Production Build
- **Frontend**: Vite build with optimized assets
- **Backend**: ESBuild bundling for Node.js deployment
- **Database**: Automated migrations with Drizzle Kit
- **Environment**: Production environment variable management

### Architecture Decisions

1. **Full-Stack TypeScript**: Chosen for type safety and shared type definitions between frontend and backend
2. **Drizzle ORM**: Selected for type-safe database operations and better TypeScript integration compared to alternatives
3. **Memory Storage Fallback**: Implemented for development flexibility and testing without database dependency
4. **Conversation Sessions**: Session-based architecture allows for stateful conversations without requiring user authentication
5. **Knowledge Base Integration**: Structured insurance knowledge base provides consistent and accurate responses
6. **Voice-First Design**: UI optimized for voice interactions while maintaining full text-based functionality
7. **Serverless Database**: Neon Database chosen for scalability and maintenance-free PostgreSQL hosting

The application follows a clean architecture pattern with clear separation between presentation, business logic, and data layers, making it maintainable and extensible for future insurance domain features.