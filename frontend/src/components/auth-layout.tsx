import type { ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type AuthLayoutProps = {
  title: string
  description: string
  footer: ReactNode
  children: ReactNode
}

export function AuthLayout({
  title,
  description,
  footer,
  children,
}: AuthLayoutProps) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          {footer}
        </CardFooter>
      </Card>
    </main>
  )
}
