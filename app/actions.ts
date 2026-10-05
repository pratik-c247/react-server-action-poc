'use server'

import { revalidatePath } from 'next/cache'

export type User = {
  id: string
  name: string
  email: string
  createdAt: string
}

export type FormState = {
  success: boolean
  message: string
  errors: {
    name?: string
    email?: string
  }
  submittedUser?: User
}

const users: User[] = []

export async function getUsers(): Promise<User[]> {
  return [...users]
}

export async function createUser(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = formData.get('name')?.toString().trim() ?? ''
  const email = formData.get('email')?.toString().trim() ?? ''

  const errors: FormState['errors'] = {}

  if (!name) {
    errors.name = 'Name is required'
  } else if (name.length < 3) {
    errors.name = 'Name must be at least 3 characters'
  }

  if (!email) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email'
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, message: 'Please fix the errors below.', errors }
  }

  const duplicate = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  )
  if (duplicate) {
    return {
      success: false,
      message: '',
      errors: { email: 'This email is already registered' },
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 800))

  const newUser: User = {
    id: crypto.randomUUID(),
    name,
    email,
    createdAt: new Date().toISOString(),
  }
  users.push(newUser)

  revalidatePath('/')

  return {
    success: true,
    message: `User "${name}" created successfully!`,
    errors: {},
    submittedUser: newUser,
  }
}
