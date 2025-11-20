import { Alpha } from '@/components/layout/alpha'
import { Logo } from '@/components/layout/logo'
import { NavButton } from '@/components/layout/nav-button'
import { FeatureFlags } from '@/lib/feature-flags'
import { getServerSideFeatureFlag } from '@/lib/posthog'
import { FileText, Home, Settings } from 'lucide-react'
import Link from 'next/link'

export const Header = async () => {
  const userTemplatesEnabled = await getServerSideFeatureFlag(
    FeatureFlags.UserTemplatesEnabled
  )
  return (
    <>
      <header className="flex h-[64px] items-center justify-between border-b border-gray-200 bg-primary px-8 dark:border-gray-800">
        <div className="flex items-center">
          <Link
            href="/"
            target="_blank"
            className="font-gds-transport flex items-center gap-3 text-3xl text-white"
          >
            <Logo />
          </Link>
        </div>
        <div>
          <Link
            href="https://ai.gov.uk"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              width="65"
              height="40"
              aria-label="i.AI"
              focusable="false"
              viewBox="0 0 167 105"
            >
              <g id="Layer_2" data-name="Layer 2">
                <g id="Layer_1-2" data-name="Layer 1">
                  <rect y="24.937" width="22" fill="#fff" height="80" x="0" />
                  <rect
                    fill="#c50878"
                    x="144.87"
                    width="21.82"
                    height="104.15"
                  />
                  <circle r="11" cx="11" fill="#fff" cy="11" />
                  <path
                    fill="#c50878"
                    d="M122.1,104.15,115,83.7H79.41l-6.75,20.45H48.52L87.06,0H108.6l38.15,104.15ZM97.44,27.8,85.76,63.55h23.1Z"
                  />
                  <circle r="11" cx="36.700001" fill="#fff" cy="93.682587" />
                </g>
              </g>
            </svg>
          </Link>
        </div>
      </header>

      <div className="header-grid w-full items-center border-b px-6 py-1">
        <div
          className="flex items-center justify-center"
          style={{ gridArea: 'alpha' }}
        >
          <Alpha />
        </div>
        <div className="flex items-center" style={{ gridArea: 'nav' }}>
          <NavButton href="/">
            <Home size="1rem" /> Home
          </NavButton>
          {userTemplatesEnabled && (
            <NavButton href="/templates">
              <FileText size="1rem" /> Templates
            </NavButton>
          )}
          <NavButton href="/settings">
            <Settings size="1rem" /> Settings
          </NavButton>
        </div>
      </div>
    </>
  )
}
