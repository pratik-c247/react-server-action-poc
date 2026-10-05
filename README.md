# React Server Action POC

A focused proof-of-concept demonstrating how **Next.js Server Actions** simplify form handling by eliminating the need for a separate API route, client-side fetch calls, and duplicated validation logic.

---

## Problem Statement

Traditional React form submissions typically require:

- A dedicated API route (`/api/users`) to receive the POST request
- A client-side `fetch` / `axios` call wired to the form's `onSubmit` handler
- Validation logic written **twice** — once on the client (for fast feedback) and once on the server (for security)
- Manual loading state management with `useState`
- Custom logic to prevent duplicate submissions while a request is in flight

Server Actions address all of these at once by letting you call a server function **directly from a form**, with React managing the pending state automatically.

---

## What This POC Covers

| Concern | How it is handled here |
|---|---|
| No separate API route | `createUser` in `actions.ts` is called directly via `<form action={formAction}>` |
| Server-side validation | Name length and RFC-compliant email regex checked on the server before any write |
| Field-level error display | `FormState.errors` carries per-field messages back to the client |
| Pending / loading state | `useFormStatus()` disables the button and changes its label during submission |
| Duplicate submission prevention | Button is disabled while `pending === true`; server also checks for duplicate email |
| Form reset after success | `formRef.current?.reset()` called inside a `useEffect` that watches `state.success` |
| Data revalidation | `revalidatePath('/')` called after a successful write so server-rendered data stays fresh |
| Live user list | Submitted users are appended to the UI immediately via `submittedUser` in the response |

---

## Project Structure

```
app/
├── actions.ts      # Server Action — validation, duplicate check, in-memory store, revalidation
├── page.tsx        # Client component — form, pending state, user list
├── layout.tsx      # Root layout
└── globals.css     # Global styles
```

### `actions.ts` — Server Side

```
'use server'
```

All functions in this file run **exclusively on the server**. The `'use server'` directive is what makes them Server Actions.

**Key responsibilities:**

- `createUser(prevState, formData)` — the Server Action bound to the form. Validates input, checks for duplicate emails, writes to the store, and returns a typed `FormState` object.
- `getUsers()` — exposes the current user list so the page can hydrate on mount.
- In-memory `users` array — simulates a database. In a production app this would be replaced with a real DB call (Prisma, Drizzle, etc.).

### `page.tsx` — Client Side

```
'use client'
```

Keeps the minimum client logic needed to drive the form UX.

**Key responsibilities:**

- `useActionState(createUser, initialState)` — binds the Server Action to the form and gives back the latest `FormState` after each submission.
- `useFormStatus()` (inside `SubmitButton`) — reads the pending state of the nearest `<form>` ancestor without prop drilling.
- `useEffect` on `state.success` — resets the form DOM via `formRef` and appends the new user to the local list.
- `UserCard` — displays each registered user with an initials avatar, email, and timestamp.

---

## Data Flow

```
User fills form
       │
       ▼
<form action={formAction}>  ← no fetch, no onSubmit handler
       │
       ▼  (Next.js serialises FormData and calls the Server Action)
createUser(prevState, formData)   ← runs on the server
       │
       ├─ validation fails  →  returns { success: false, errors: { ... } }
       │                              ↓
       │                       field errors rendered inline
       │
       └─ validation passes
               │
               ├─ duplicate email  →  returns { success: false, errors: { email: '...' } }
               │
               └─ write to store
                       │
                       ▼
               revalidatePath('/')
                       │
                       ▼
               returns { success: true, submittedUser: { ... } }
                       │
                       ▼  (back on the client)
               form resets  +  new UserCard appended to list
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm

### Installation

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## Dependencies

| Package | Version | Role |
|---|---|---|
| `next` | 16.3.8 | Framework — App Router, Server Actions, `revalidatePath` |
| `react` | 19.2.8 | `useActionState`, `useFormStatus`, `useRef`, `useEffect` |
| `react-dom` | 19.2.8 | `useFormStatus` lives here |
| `typescript` | ^5 | Type safety across server and client |

---

## Key Concepts Demonstrated

### 1. `useActionState`

```ts
const [state, formAction] = useActionState(createUser, initialState)
```

Replaces the `useState` + `fetch` + error-handling boilerplate you would otherwise write manually. The action is called with `(prevState, formData)` on every submission, and the returned value becomes the new `state`.

### 2. `useFormStatus`

```ts
const { pending } = useFormStatus()
```

Must live in a **child** component of the `<form>` (here, `SubmitButton`). It reads the submission state of the closest ancestor form without any prop passing.

### 3. Server-side validation only

Validation lives in `actions.ts`, which runs on the server. There is no client-side validation library in this POC — demonstrating that a single server-side check is sufficient when using Server Actions. Adding client-side validation on top is optional and purely a UX enhancement.

### 4. Duplicate submission prevention

Two layers:
1. **UI layer** — the submit button is disabled while `pending === true`, so rapid clicks cannot fire a second request.
2. **Server layer** — `createUser` checks the `users` array for an existing email before writing, returning a field-level error if a duplicate is found.

### 5. `revalidatePath`

```ts
revalidatePath('/')
```

Called after a successful write. This tells Next.js to invalidate any cached server-rendered output for `/`, ensuring that a full page refresh (or a subsequent server render) reflects the latest data.

---

## Limitations of This POC

- The `users` array is **in-memory only** — data is lost when the dev server restarts. Replace it with a real database for any persistent use case.
- No authentication or authorization — any visitor can submit the form.
- No pagination on the user list.
- Styling uses inline styles for simplicity; a production app would use Tailwind CSS or a component library.

---

## Next Steps

To evolve this POC into a production-ready feature:

1. Replace the in-memory store with a database (e.g., Prisma + PostgreSQL).
2. Add a schema validation library such as **Zod** for richer, reusable validation rules.
3. Introduce authentication (e.g., NextAuth.js) to protect the action.
4. Add optimistic UI updates using `useOptimistic` for an even snappier UX.
5. Extract styles into Tailwind CSS utility classes.
