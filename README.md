# Omnitest

An immersive, distraction-free testing/onboarding experience built with **Next.js 16**, **TypeScript**, **Tailwind CSS v4**, **Firebase Auth**, **Framer Motion**, and **lucide-react**.

## Features

- **Welcome page** with animated branding and a unified login / register form (email + password) backed by Firebase Auth.
- **Start screen** that greets the authenticated user and offers a single Start button + `Enter` hotkey, both of which request fullscreen and transition into the questionnaire.
- **Immersive questionnaire** (one question at a time) covering name, last name, username, age, pronouns, location, languages, education, links and the user's purpose. Progress is animated, navigation supports `Enter` to advance and `Esc` to go back, and answers are persisted to Firestore (`profiles/{uid}`).
- A polished color palette (`#0F172A → #7C3AED → #C4B5FD`), glassmorphism, ambient gradients, and fluid Framer Motion transitions throughout.

## Tech stack

- Next.js 16 (App Router) with Turbopack
- TypeScript
- Tailwind CSS v4 (CSS-only `@theme` configuration in `src/app/globals.css`)
- Firebase v12 (Auth + Firestore)
- Framer Motion 12
- lucide-react icons
- pnpm

## Getting started

```bash
pnpm install
pnpm dev
```

The dev server runs on [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
├─ app/
│  ├─ globals.css       # Tailwind v4 theme + animations
│  ├─ layout.tsx        # Root layout, fonts, AuthProvider
│  └─ page.tsx          # Entry — renders <Experience />
├─ components/
│  ├─ ambient-background.tsx
│  ├─ auth-form.tsx
│  ├─ experience.tsx
│  ├─ questionnaire.tsx
│  ├─ start-screen.tsx
│  ├─ welcome-screen.tsx
│  └─ ui/               # Button, Input, Textarea, Label
└─ lib/
   ├─ auth-context.tsx  # React context wrapping Firebase Auth
   ├─ auth-errors.ts
   ├─ firebase.ts       # Firebase init (client SDK)
   ├─ onboarding-fields.ts
   └─ utils.ts          # cn() helper
```

## Firebase

The Firebase web config is committed in `src/lib/firebase.ts` (the same SDK config provided when bootstrapping the project). Make sure **Email / Password** sign-in is enabled in the Firebase console and that Firestore rules permit authenticated users to write to `profiles/{uid}`.

## Notes

- The Start button calls `requestFullscreen()` to enter focus mode; some browsers may silently ignore this if the user previously dismissed the prompt.
- Pressing `Enter` on the Start screen triggers the same flow.
- Pressing `Enter` inside the questionnaire advances; `Esc` goes back. In a textarea, `Cmd/Ctrl+Enter` advances.
