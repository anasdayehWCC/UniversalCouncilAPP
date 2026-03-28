'use client'

import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import React from 'react'
import { Button } from '@careminutes/ui'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

type Props = { children: React.ReactNode }
type State = { hasError: boolean; error?: Error }

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-12 text-white">
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-2 text-amber-200">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-semibold">Something went wrong</span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold">We hit a snag.</h1>
          <p className="mt-2 max-w-xl text-center text-sm text-white/70">
            Your session is safe; try reloading. If this persists, support can use the timestamp and Sentry report to diagnose the issue.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              onClick={this.handleReload}
              className="bg-white/15 text-white hover:bg-white/25"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload page
            </Button>
            <Button variant="ghost" asChild className="text-white hover:bg-white/10">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go home
              </Link>
            </Button>
          </div>
          {this.state.error && (
            <code className="mt-4 max-w-2xl rounded-xl bg-black/40 p-3 text-xs text-amber-100">
              {this.state.error.message}
            </code>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
