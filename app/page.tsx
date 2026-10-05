'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { createUser, getUsers, type FormState, type User } from './actions'
import { useState } from 'react'

const initialState: FormState = {
  success: false,
  message: '',
  errors: {},
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        padding: '10px 24px',
        background: pending ? '#94a3b8' : '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: pending ? 'not-allowed' : 'pointer',
        fontSize: 15,
        transition: 'background 0.2s',
      }}
    >
      {pending ? 'Submitting…' : 'Create User'}
    </button>
  )
}

function UserCard({ user }: { user: User }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        background: '#f8fafc',
      }}
    >
      {/* Avatar circle with initials */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: '#2563eb',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>
          {user.name}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
          {user.email}
        </p>
      </div>
      <p
        style={{
          marginLeft: 'auto',
          fontSize: 11,
          color: '#94a3b8',
          whiteSpace: 'nowrap',
        }}
      >
        {new Date(user.createdAt).toLocaleTimeString()}
      </p>
    </div>
  )
}

export default function Home() {
  const [state, formAction] = useActionState(createUser, initialState)
  const [users, setUsers] = useState<User[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  // Load users on mount
  useEffect(() => {
    getUsers().then(setUsers)
  }, [])

  // On success: reset the form and refresh the user list
  useEffect(() => {
    if (state.success && state.submittedUser) {
      formRef.current?.reset()
      setUsers((prev) => [...prev, state.submittedUser!])
    }
  }, [state])

  return (
    <main style={{ maxWidth: 520, margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: 4, color: '#0f172a' }}>Server Action POC</h1>
      <p style={{ color: '#64748b', marginBottom: 28, fontSize: 14 }}>
        Form with server-side validation, pending state, duplicate prevention, and live user list.
      </p>

      {/* ── Form ─────────────────────────────────────────── */}
      <form
        ref={formRef}
        action={formAction}
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: 18, color: '#1e293b' }}>
          Create a User
        </h2>

        {/* Name field */}
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="name"
            style={{ display: 'block', fontWeight: 500, marginBottom: 4, color: '#334155' }}
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Jane Doe"
            style={{
              display: 'block',
              width: '100%',
              padding: '9px 12px',
              border: `1px solid ${state.errors.name ? '#ef4444' : '#cbd5e1'}`,
              borderRadius: 6,
              fontSize: 14,
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          {state.errors.name && (
            <p style={{ margin: '4px 0 0', color: '#ef4444', fontSize: 13 }}>
              {state.errors.name}
            </p>
          )}
        </div>

        {/* Email field */}
        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="email"
            style={{ display: 'block', fontWeight: 500, marginBottom: 4, color: '#334155' }}
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="jane@example.com"
            style={{
              display: 'block',
              width: '100%',
              padding: '9px 12px',
              border: `1px solid ${state.errors.email ? '#ef4444' : '#cbd5e1'}`,
              borderRadius: 6,
              fontSize: 14,
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          {state.errors.email && (
            <p style={{ margin: '4px 0 0', color: '#ef4444', fontSize: 13 }}>
              {state.errors.email}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <SubmitButton />

          {/* Global message — success or generic error */}
          {state.message && !state.errors.name && !state.errors.email && (
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: state.success ? '#16a34a' : '#dc2626',
              }}
            >
              {state.message}
            </p>
          )}
        </div>
      </form>

      {/* ── Users list ───────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: 16, color: '#1e293b', marginBottom: 12 }}>
          Registered Users{' '}
          <span
            style={{
              background: '#e2e8f0',
              borderRadius: 12,
              padding: '2px 8px',
              fontSize: 13,
              color: '#475569',
            }}
          >
            {users.length}
          </span>
        </h2>

        {users.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 14 }}>
            No users yet — submit the form above.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map((u) => (
              <UserCard key={u.id} user={u} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
