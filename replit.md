# Overview

This is a retail management system called "La Rosa" built with React, Express.js, and PostgreSQL. The application serves both boutique (in-store) and online operations, providing comprehensive point-of-sale functionality, inventory management, order processing, returns handling, and reporting capabilities. The system supports Arabic language (RTL) interface and includes features for employee management, product catalog with variants, sales tracking, and business analytics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18** with TypeScript for type safety and modern component patterns
- **Vite** as the build tool for fast development and optimized production builds
- **Wouter** for lightweight client-side routing instead of React Router
- **TanStack Query (React Query)** for server state management, caching, and data synchronization
- **Shadcn/ui** component library built on Radix UI primitives for consistent, accessible UI components
- **Tailwind CSS** for utility-first styling with CSS variables for theming
- **Right-to-Left (RTL)** layout support for Arabic language interface

## Backend Architecture
- **Express.js** server with TypeScript for type-safe API development
- **RESTful API** design with consistent error handling and response patterns
- **Middleware chain** for request logging, JSON parsing, and error handling
- **File upload** support using Multer for product images
- **Session-based** architecture (prepared for authentication scaling)

## Database Layer
- **PostgreSQL** as the primary database with connection pooling
- **Drizzle ORM** for type-safe database operations and schema management
- **Neon Database** integration for serverless PostgreSQL hosting
- **Schema-first** approach with shared types between client and server

## Data Model Design
- **Employee management** with role-based permissions (staff/manager)
- **Product catalog** with hierarchical structure (Product → Colors → Sizes)
- **Sales tracking** with line items and payment method support
- **Order management** for online store with shipping and status tracking
- **Returns and exchanges** system with reason tracking
- **Multi-store** support (boutique vs online operations)

## Authentication & Authorization
- **Employee-based** login system stored in localStorage
- **Store context** management for boutique vs online operations
- **Role-based** access control preparation (staff/manager roles defined)

## State Management
- **Custom React Context** for global state (employee, store selection)
- **TanStack Query** for server state with automatic caching and synchronization
- **Form state** managed by React Hook Form with Zod validation
- **Local state** for UI interactions and temporary data

## API Architecture
- **Resource-based** routing (`/api/employees`, `/api/products`, etc.)
- **Consistent response** format with proper HTTP status codes
- **Request validation** using Zod schemas
- **Error handling** with centralized error middleware
- **File upload** endpoints for product images

## Development & Build System
- **Vite development** server with HMR and React Fast Refresh
- **TypeScript** for full-stack type safety with shared schemas
- **ESBuild** for production server bundling
- **Path aliases** for clean imports (`@/`, `@shared/`)
- **Development tooling** with Replit-specific plugins for enhanced development experience

# External Dependencies

## Database & ORM
- **@neondatabase/serverless** - Serverless PostgreSQL client for Neon Database
- **drizzle-orm** - Type-safe ORM for database operations
- **drizzle-kit** - Database migrations and schema management tools

## UI Framework & Styling
- **@radix-ui/react-*** - Comprehensive set of accessible UI primitive components
- **tailwindcss** - Utility-first CSS framework for styling
- **class-variance-authority** - Utility for managing component variants
- **clsx** - Conditional className utility

## Form Handling & Validation
- **react-hook-form** - Performance-focused forms library
- **@hookform/resolvers** - Validation resolvers for React Hook Form
- **zod** - TypeScript-first schema validation
- **drizzle-zod** - Zod schema generation from Drizzle schemas

## Data Fetching & State Management
- **@tanstack/react-query** - Server state management with caching
- **wouter** - Minimalist routing library for React

## File Handling
- **multer** - Multipart form data handling for file uploads
- **@types/multer** - TypeScript definitions for Multer

## Development Tools
- **vite** - Fast build tool and development server
- **typescript** - Static type checking
- **@vitejs/plugin-react** - React support for Vite
- **@replit/vite-plugin-*** - Replit-specific development enhancements

## Utility Libraries
- **date-fns** - Modern JavaScript date utility library
- **cmdk** - Command menu component for search interfaces
- **nanoid** - Secure URL-friendly unique string ID generator