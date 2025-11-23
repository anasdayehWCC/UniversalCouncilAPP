'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@careminutes/ui'
import { useLockNavigationContext } from '@/hooks/use-lock-navigation-context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export const NavButton = ({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) => {
  const { lockNavigation, setLockNavigation } = useLockNavigationContext()
  const router = useRouter()
  if (lockNavigation) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Button variant="ghost" type="button">{children as any}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to leave the page?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {typeof lockNavigation == 'string'
                ? lockNavigation
                : `You have a recording that has not been uploaded, are you sure you
              want to leave this page? (Your recording will be discarded if you
              do not upload it, or save a local copy.)`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setLockNavigation(false)
                router.push(href)
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Button asChild variant="ghost">
      <Link href={href}>{children}</Link>
    </Button>
  )
}
