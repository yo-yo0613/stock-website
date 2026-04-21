# Build a Bento Grid Website

The goal is to create a stunning, responsive layout that utilizes the popular "Bento Grid" design approach. This interface will be built with React, styled using TailwindCSS for maximum flexibility and rapid development, and animated with Framer Motion to create a heavily polished, dynamic, and engaging user experience.

## User Review Required

> [!IMPORTANT]
> The project will be initialized inside this current folder using `Vite`. Please review the tools and dependencies to ensure they meet your exact requirements.
> Tools: **React (TypeScript), TailwindCSS, Framer Motion, Lucide-React (Icons)**

## Proposed Changes

### Configuration and Setup
- Bootstrap a Vite application in the current directory (`npx -y create-vite@latest ./ --template react-ts --skip-git`)
- Install framework dependencies (`npm install framer-motion lucide-react clsx tailwind-merge`)
- Install dev dependencies for Tailwind CSS (`npm install -D tailwindcss postcss autoprefixer`)
- Initialize and configure Tailwind CSS (`npx tailwindcss init -p`)

### Application Code

#### [MODIFY] c:\Users\14L1\Desktop\Bento-grid\tailwind.config.js
Configure Tailwind to scan React files for classes and extend the theme for custom colors or grid configurations, adding nice styling utilities.

#### [MODIFY] c:\Users\14L1\Desktop\Bento-grid\src\index.css
Set up the fundamental global styles, typography, and basic Tailwind directives.

#### [MODIFY] c:\Users\14L1\Desktop\Bento-grid\src\App.tsx
The main landing file. We will compose multiple Bento Grid components here.

#### [NEW] c:\Users\14L1\Desktop\Bento-grid\src\components\BentoGrid.tsx
A generic container component specifically structured using CSS Grid (via Tailwind) designed to house multiple Bento items.

#### [NEW] c:\Users\14L1\Desktop\Bento-grid\src\components\BentoCard.tsx
The specific items or "Cards" within the grid. It’ll use Framer Motion for hover effects and general entry animations, aiming for a premium "glassmorphic" or neat dark-mode standard.

## Open Questions

> [!QUESTION]
> Do you have any specific theme, color palette, or content in mind for the Bento Grid (e.g., a personal portfolio, product showcase, generic template)?
> If not, I will design a high-quality portfolio/dashboard demonstration with sleek, modern dark-mode features and animations!

## Verification Plan

### Automated Tests
- Run `npm run dev` to serve the website locally.
- Read logs internally using the browser subagent if needed, or by tracking command status.

### Manual Verification
- Visual inspection via local development server. Ensure animations, styling, and grid functionality are perfect on both desktop and mobile layouts.
