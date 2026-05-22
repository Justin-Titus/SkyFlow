import { AuthForm } from '@/components/auth/AuthForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login | SkyFlow',
  description: 'Sign in to your SkyFlow account',
}

export default function LoginPage() {
  return <AuthForm type="login" />
}
