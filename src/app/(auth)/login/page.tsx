'use client'
import { useSearchParams } from "next/navigation";
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { validateRedirectUrl } from '@/lib/redirect'

// Use refactored LoginForm from features directory
import { LoginForm } from '@/features/auth/components/login-form'

export default function SignIn() {
  const searchParams = useSearchParams();

  // ⚠️ SECURITY: Validate redirect URL to prevent open redirect attacks
  const redirectParam = searchParams.get("redirect")
  const redirectTo = validateRedirectUrl(redirectParam, "/dashboard")

  return (
    <Card className='gap-4'>
      <CardHeader>
        <CardTitle className='text-lg tracking-tight'>Sign in</CardTitle>
        <CardDescription>
          Enter your email and password below to <br />
          log into your account. Don&apos;t have an account?{' '}
          <Link
            href='/register'
            className='hover:text-primary underline underline-offset-4'
          >
            Sign up
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm redirectTo={redirectTo} />
      </CardContent>
      <CardFooter>
        <p className='text-muted-foreground px-8 text-center text-sm'>
          By clicking sign in, you agree to our{' '}
          <a
            href='/terms'
            className='hover:text-primary underline underline-offset-4'
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href='/privacy'
            className='hover:text-primary underline underline-offset-4'
          >
            Privacy Policy
          </a>
          .
        </p>
      </CardFooter>
    </Card>
  )
}
