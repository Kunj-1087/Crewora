# Monorepo Contribution & Feature Development Guide

To maintain architecture clean separation and prevent code duplication, you MUST follow these standards when adding new features or components:

## Feature Development Workflow

When implementing any new feature, split it logically across these layers:

1. **Domain Logic & Types**:
   - Save TypeScript types, helper formulas, and validation rules in `packages/shared/`.
2. **API Logic & Requests**:
   - Write API fetch services, request bodies, and parameters in `packages/api-client/`.
3. **UI Components & Elements**:
   - Build generic visual components (buttons, input fields, cards, custom badges) in `packages/ui/`.
4. **Web Screens**:
   - Build website screens, routes, and layout compositions in `apps/web/`.
5. **Mobile Screens**:
   - Build application screens, tab-bar navigation, and native hooks in `apps/mobile/`.
