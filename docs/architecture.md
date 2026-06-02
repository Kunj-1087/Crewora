# Crewora Architecture Overview

This monorepo leverages standard Node/NPM Workspaces to co-locate, develop, and publish multiple packages and apps.

## Key Design Patterns
1. **Centralized UI Layer (`@crewora/ui`)**:
   - Reusable React elements (Buttons, Inputs, Cards, etc.).
   - Global stylesheet standard (`globals.css` with CSS custom variables for HSL tailored theme).
2. **Centralized API client (`@crewora/api-client`)**:
   - Core Axios instance.
   - Access token session refresh loop & memory token storage wrapper.
3. **Shared Domain Rules (`@crewora/shared`)**:
   - TypeScript Types.
   - Zod validation schemas shared between client apps and backend servers.
   - Global multi-language translations (`en.json`, `gu.json`).
4. **Platform Splitting**:
   - `apps/web`: Responsive next.js application.
   - `apps/mobile`: next.js static output packaged via Capacitor to native Android app.
