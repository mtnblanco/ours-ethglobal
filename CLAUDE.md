# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo for "Ours" - a Web3 real estate tokenization platform that enables fractional investment in tangible assets. The platform allows investors to purchase tokenized shares of real estate properties with direct rental yield distribution via smart contracts.

## Repository Structure

The repository consists of three main workspaces:

- **`ours-platform/`** - Next.js 16 frontend application with React 19
- **`contracts/`** - Hardhat 3 Beta smart contracts workspace (currently minimal setup)
- **`backend/`** - Backend services (currently empty/placeholder)
- **`styles/`** - Shared assets (logo, etc.)

## Development Commands

### Frontend (ours-platform/)

```bash
cd ours-platform
npm run dev        # Start Next.js dev server on http://localhost:3000
npm run build      # Build production bundle
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Smart Contracts (contracts/)

```bash
cd contracts
npx hardhat compile    # Compile Solidity contracts
npx hardhat test       # Run contract tests
npx hardhat node       # Start local Ethereum node
```

The Hardhat workspace uses Hardhat 3 Beta with native TypeScript support. Currently uses Solidity 0.8.28.

## Architecture Notes

### Frontend Architecture

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS with custom brand color system
- **Animations**: Framer Motion for page transitions and UI animations
- **Type Safety**: TypeScript with strict mode enabled

#### Brand Color System

The application uses a consistent dark theme with a custom color palette defined in `tailwind.config.ts`:
- `brand-dark` (#020617) - Deepest navy/black backgrounds
- `brand-navy` (#0f172a) - Secondary backgrounds
- `brand-primary` (#0ea5e9) - Sky blue for CTAs and highlights
- `brand-accent` (#38bdf8) - Lighter sky blue for hover states
- `brand-surface` (#1e293b) - Card/surface backgrounds

#### Page Structure

The frontend uses Next.js App Router with the following routes:
- `/` - Landing page with hero, featured assets, and how-it-works sections
- `/login` - User login page
- `/register` - User registration page
- `/marketplace` - Asset marketplace listing
- `/marketplace/[id]` - Individual asset detail pages

All pages use the `'use client'` directive as they require client-side interactivity.

#### Key UI Patterns

- Animation variants are defined at component level using Framer Motion
- Consistent use of `fadeIn` and `staggerContainer` animation patterns
- Cards use hover effects with border color transitions and subtle transforms
- Navigation is fixed with backdrop blur effect

### Smart Contract Workspace

Currently a minimal Hardhat 3 Beta setup without plugins. The workspace is prepared for:
- Solidity contract development
- TypeScript-based deployment scripts
- Contract testing infrastructure

No contracts have been implemented yet.

### Path Aliases

The frontend uses TypeScript path aliases:
- `@/*` maps to the root of the `ours-platform/` directory

## Key Dependencies

### Frontend
- `next`: 16.0.3
- `react` & `react-dom`: 19.2.0
- `framer-motion`: ^12.23.24 (animations)
- `lucide-react`: ^0.554.0 (icons)
- `tailwindcss`: ^3.4.17

### Contracts
- `hardhat`: ^3.0.15 (beta)
- TypeScript support is native in Hardhat 3

## Working with This Codebase

### When Adding New Routes

- Create new directories under `app/` following Next.js App Router conventions
- Include `'use client'` directive if using React hooks or browser APIs
- Maintain the established animation patterns using Framer Motion
- Use the brand color system from Tailwind config

### When Working with Smart Contracts

- Smart contracts should be placed in a `contracts/contracts/` directory (standard Hardhat structure)
- Tests go in `contracts/test/`
- Deployment scripts go in `contracts/scripts/`
- The project uses Hardhat 3 with ESM (module type in package.json)

### Styling Guidelines

- All components use Tailwind utility classes
- Maintain dark theme consistency using brand colors
- Use `backdrop-blur` for glassmorphism effects on overlays
- Card components typically have `border border-white/5` with low opacity borders
