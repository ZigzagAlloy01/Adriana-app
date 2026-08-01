# Overview

Hello, everyone. This is a dynamic web application written in TypeScript, and the purpose of the application is to be used as a couple’s dashboard application. This is: a web application where a boyfriend and a girlfriend can have a personal space to manage their dates, photos, memories, messages and goals. The structure is the one of a single-page client-side web application, built using React, TypeScript and Vite. It has entry points and core routing (inside src/main.tsx, src/App.tsx, src/routes/), UI components and layouts (inside src/components/, src/layouts/), views and pages (inside src/pages/), application state and data flows (inside src/store/, src/services/), type safety (inside src/types/) and deployment configuration (inside vite.config.ts, vercel.json, tsconfig.json).

[Software Demo Video](https://youtu.be/XHqvGbrnDUs)
[Vercel Page](https://adriana-app.vercel.app/)

# Development Environment

The present software was produced using Visual Studio Code (VS Code) as the only and primary Integrated Development Environment (IDE), and its native IntelliSense was used for syntax validation. VS Code provides excellent support for TypeScript, React, Git integration, debugging, syntax highlighting and extensions that improve productivity.

The application was developed primarily using TypeScript, which is a statically typed superset of JavaScript that improves software reliability by introducing compile-time type checking, interfaces, generics and tooling support.

The user interface was built with React, using the Functional Component architecture and React Hooks, like: useState, useEffect, useRef. The React Hooks are useful to manage component state, side effects, DOM references and lifecycle behavior. Application navigation was built through React Router DOM, which allows client-side routing without forcing full page reloads.

The project was bootstrapped using Vite, a modern frontend build tool that provides extremely fast startup times and improves the development experience. Vite has an advantage compared to traditional bundlers: Vite compiles only the modules currently being used.

Package management was handled with Node.js and npm, which were used throughout the project to install dependencies, manage package versions, execute develipment scripts and to build and maintain the final version of the application.

Global state management was implemented using Zustand, which can manage shared application state, including: authenticated user, current couple, dashboard information and loading states. An advantage of Zustand is that it keeps components independent while maintaining a synchronized application state.

Version control was managed with Git and the source code was hosted on GitHub, allowing backups, version tracking and the deployment of the project as a web service.

In the process of configuring the project, I selected Oxlint, Radix and Maia. 
Oxlint is a code linter faster than ESLint, and it helps to speed local build times, and to find unused variables and syntax issues.
Radix provides unstyled components that area fully accessible for screen readers and keyboard navigation (this means that I don’t have to code accessibility from scratch). Besides, Radix allows me to apply my own visual identity to the web app using Tailwind CSS. In addition, to accelerate interface develipment, the application integrates shadcn/ui, which is built on top of Radix UI and generates reusable React components that can be customized with Tailwind CSS.
Maia is a visual component style that defines the density, border rounding, spacing and visual hierarchy of the application. It makes easier for me to ensure that the entire interface looks cohesive and professional.

The graphical interface (as was mentioned), was built using Tailwind CSS, a CSS framework that allows responsive and customizable user interfaces without writing extremely large CSS files. The global rules are defined in the components.json file. Animations and transitions were implemented using Framer Motion, which allows smooth page transitions and interactive UI effects. The calendar functionality was implemented using FullCalendar React, along with the Day Grid and Interaction plugings to enable event scheduling. Date selection controls were implemented using React Day Picker, which provides customizable date picker components integrated with React. 

Path aliases were configured through TypeScript and Vite, to allow imports like:

import { supabase } from "@/services/supabase";

Instead of the usual long relative paths. This improved code readability and maintainability.

The application uses Supabase as a Backend-as-a-Service (BaaS), and it provided several backend services, including: PostgreSQL relational database, Authentication system, Row Level Security (RLS), Remote Procedure Calls (RPC), REST API automatically generated from database tables and Secure user session management. Communication with the backend is performed relying on the official Supabase JavaScript SDK, which manages user authentication, database queries, inserts, updates and secure sessions. The application can communicate asynchronously with Supabase using async/await, which allows non-blocking operations while waiting for remote databases responses. This mechanism is used in several functions and events in the application, such as: user registration, login, creating a couple, joining a couple through invitation codes, updating anniversary dates and loading dashboard information.

These are the main and most relevant terminal commands that were used in this project

1.	npm create vite@latest adriana-app -- --template react-ts 
/* It is named Adriana in honor to my own girlfriend*/
2.	cd adriana-app
3.	npm i -D @types/node
4.	npm install
5.	npm install react-router-dom
6.	npm install @supabase/supabase-js
7.	npm install @supabase/supabase-js
8.	npm install zustand
9.	npm install tailwindcss @tailwindcss/vite
10.	npm install lucide-react
11.	npm install framer-motion
12.	npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/interaction
13.	npm install react-day-picker
14.	npm install clsx class-variance-authority tailwind-merge
15.	npm install uuid
16.	npm install -D prettier eslint-config-prettier
17.	npx shadcn@latest init
18.	npx shadcn@latest add button
19.	npx shadcn@latest add card
20.	And to run the project: npm run dev

In addition, inside tsconfig.app.json there must be added:

{
    "compilerOptions":  {
      "baseUrl": ".",
      "paths": {
        "@/*": ["src/*"]
      }
    }
}

And inside vite.config.ts there must be at least:

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import tailwindcss from "@tailwindcss/vite"

  export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})

The project was deployed to Vercel, which automatically builds and hosts the application directly from the GitHub repository. Vercel also provides HTTPS, CDN distribution, automatic deployments, and support for Single Page Applications through URL rewriting. The vercel.json at the root of the file must have:

{
    "rewrites": [
        {
            "source": "/(.*)",
            "destination": "/"
        }
    ]
}

# Useful Websites

- [Youtube: Connect to Supabase](https://www.youtube.com/watch?v=6oDdMf-CTTw)
- [Youtube: TypeScript Full Course for Beginners](https://www.youtube.com/watch?v=gieEQFIfgYc)
- [TypeScriptLang](https://www.typescriptlang.org/docs/)
- [W3Schools](https://www.w3schools.com/typescript/index.php)

# Future Work

- Expand the application with mobile support, push notifications, relationship statistics, anniversary reminders, and AI-assisted recommendations for dates and activities.
- Implement profile avatars, customizable themes, and additional personalization features.
- Improve the user experience by adding offline support.

# Extra

This is the directory tree:

ADRIANA-APP/
├── @\lib/  
│   └── utils.ts
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── assets/
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    ├── components/
    │   ├── common/
    │   └── ui/
    │       ├── button.tsx
    │       └── card.tsx
    ├── layouts/
    ├── lib/
    │   └── utils.ts
    ├── pages/
    │   ├── auth/
    │   │   ├── login.tsx
    │   │   └── register.tsx
    │   ├── calendar/
    │   │   └── CalendarPage.tsx
    │   ├── dashboard/
    │   │   ├── components/
    │   │   │   ├── CoupleHeader.tsx
    │   │   │   ├── DaysTogetherCard.tsx
    │   │   │   ├── MemoriesPreview.tsx
    │   │   │   ├── NextDateCard.tsx
    │   │   │   ├── PhotosPreview.tsx
    │   │   │   └── QuickActions.tsx
    │   │   └── Dashboard.tsx
    │   ├── gallery/
    │   │   └── GalleryPage.tsx
    │   ├── goals/
    │   │   └── GoalsPage.tsx
    │   ├── letters/
    │   │   └── LettersPage.tsx
    │   ├── memories/
    │   │   └── MemoriesPage.tsx
    │   ├── messages/
    │   │   └── MessagesPage.tsx
    │   ├── notifications/
    │   │   └── NotificationsPage.tsx
    │   └── onboarding/
    │       ├── CreateCouple.tsx
    │       ├── index.tsx
    │       └── JoinCouple.tsx
    ├── routes/
    │   ├── AppRouter.tsx
    │   └── ProtectedRoute.tsx
    ├── services/
    │   ├── couples.ts
    │   ├── dashboard.ts
    │   ├── helpers.ts
    │   └── supabase.ts
    ├── store/
    │   ├── authStore.ts
    │   ├── coupleStore.ts
    │   └── dashboardStore.ts
    ├── types/
    │   ├── dashboard.ts
    │   ├── domain.ts
    │   └── supabase.ts
    ├── App.css
    ├── App.tsx
    ├── index.css
    └── main.tsx
├── .gitignore
├── .oxlintrc.json
├── components.json
├── index.html
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vercel.json
└── vite.config.ts
