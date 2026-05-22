import { AuthForm } from '@/components/auth/AuthForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account | SkyFlow',
  description: 'Join SkyFlow to start booking premium flights',
}

export default function RegisterPage() {
  return <AuthForm type="register" />
}
