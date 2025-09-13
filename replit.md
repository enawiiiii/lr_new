# Store Management System

## Overview

This is a comprehensive Arabic store management system designed for managing both a physical boutique and an online store. The application separates data and operations between two distinct contexts - "البوتيك" (boutique) for in-store operations and "أونلاين" (online) for e-commerce operations. Each context maintains completely separate inventories, sales/orders, returns, and reporting systems.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Arabic RTL support
- **State Management**: Context API for global app state (employee and context selection)
- **Data Fetching**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **File Upload**: Multer for handling product image uploads
- **API Design**: RESTful endpoints with context-aware data separation

### Database Design
- **Contexts**: Separate data by 'boutique' and 'online' contexts using enum fields
- **Products**: Shared product schema with context separation, JSON fields for colors/sizes/inventory
- **Sales vs Orders**: Sales table for boutique transactions, Orders table for online transactions
- **Activities**: Audit log for tracking all system activities
- **Returns**: Unified returns system for both contexts

### Authentication & Authorization
- **Employee-Based**: Simple employee selection system (عبدالرحمن, هبة, هديل)
- **Context Isolation**: Each employee can switch between boutique and online contexts
- **No Traditional Auth**: Uses session-based employee tracking without passwords

### Key Design Patterns
- **Context Separation**: Complete data isolation between boutique and online operations
- **Type Safety**: Full TypeScript coverage with Zod schemas for validation
- **Component Composition**: Reusable UI components with consistent Arabic styling
- **Error Handling**: Toast notifications for user feedback
- **Real-time Updates**: Query invalidation for immediate UI updates after mutations

### Arabic RTL Support
- **Layout**: Right-to-left layout with proper Arabic font (Noto Sans Arabic)
- **Navigation**: Arabic labels and icons with RTL-friendly positioning
- **Forms**: Arabic placeholders and validation messages
- **Styling**: Custom CSS variables for RTL-optimized components

## External Dependencies

### Database & ORM
- **@neondatabase/serverless**: PostgreSQL serverless driver for Neon database
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **drizzle-kit**: Database migration and introspection tools

### UI & Styling
- **@radix-ui/***: Headless UI components for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Dynamic class name generation
- **lucide-react**: Icon library for UI elements

### Data Management
- **@tanstack/react-query**: Server state management and caching
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation with Zod integration
- **zod**: Runtime type validation and schema generation

### File Handling
- **multer**: Express middleware for multipart/form-data (image uploads)
- **File storage**: Local filesystem for product images

### Development Tools
- **vite**: Fast build tool with HMR support
- **typescript**: Static type checking
- **@replit/vite-plugin-***: Replit-specific development enhancements

### Date & Utilities
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional class name utility
- **nanoid**: Unique ID generation for database records