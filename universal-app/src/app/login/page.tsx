'use client';

import React from 'react';
import Image from 'next/image';
import { useDemo } from '@/context/DemoContext';
import { DOMAINS } from '@/config/domains';
import { cn, hexToRgba } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnimatedIcon } from '@/components/ui/AnimatedIcon';
import { Network } from 'lucide-react';
import { motion } from 'framer-motion';
import { cardMotion, reducedCardMotion } from '@/config/motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const personaOrder = ['sarah', 'nina', 'david', 'priya', 'marcus', 'elena'];

export default function LoginPage() {
  const { switchUser, currentUser, config, personas: personaMap, featureFlags } = useDemo();
  const reduceMotion = usePrefersReducedMotion();

  const personas = Object.keys(personaMap).sort((a, b) => {
    const aIdx = personaOrder.indexOf(a);
    const bIdx = personaOrder.indexOf(b);
    return (aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx) - (bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx);
  });

  const handleSelect = (id: string) => {
    switchUser(id);
    // Navigation handled by switchUser in DemoContext
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden bg-background"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at top, ${hexToRgba(config.theme.primary, 0.18)} 0%, transparent 38%),
              radial-gradient(circle at bottom right, ${hexToRgba(config.theme.accent, 0.16)} 0%, transparent 30%),
              linear-gradient(180deg, ${hexToRgba(config.theme.primary, 0.08)} 0%, rgba(255,255,255,0.96) 46%, rgba(255,255,255,1) 100%)
            `,
          }}
        />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center gap-8 sm:gap-10 px-2 sm:px-0">
        <header className="flex flex-col items-center text-center gap-4">
          <div
            className="glass-panel w-16 h-16 rounded-2xl flex items-center justify-center border shadow-2xl"
            style={{
              borderColor: 'var(--login-panel-border)',
              backgroundColor: 'var(--login-panel-bg)',
            }}
          >
            <AnimatedIcon pulse hoverColor={config.theme.primary} filledColor={config.theme.accent}>
              <Network className="w-7 h-7" />
            </AnimatedIcon>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-foreground">
              Minute Platform
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              One App. Multiple Domains.
            </p>
          </div>
          <p className="max-w-xl text-xs sm:text-sm text-muted-foreground text-balance">
            Select a persona to see how the interface adapts for social workers, managers, and platform admins across councils.
          </p>
          <div
            className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs sm:text-sm text-muted-foreground shadow-sm backdrop-blur-md"
          >
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
              style={{ background: config.theme.gradient }}
            >
              {config.name[0]}
            </span>
            <span className="font-medium text-foreground">{config.authorityLabel}</span>
            <span className="h-1 w-1 rounded-full bg-muted" />
            <span className="text-muted-foreground">Currently viewing {config.name}</span>
          </div>
        </header>

        <section
          className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-h-[70vh] sm:max-h-none overflow-y-auto sm:overflow-visible pr-1 sm:pr-0 pb-2 sm:pb-0 snap-y snap-mandatory"
          aria-label="Persona selection"
        >
          {personas.map((id, index) => {
            const persona = personaMap[id];
            const isActive = currentUser.id === id;
            const personaDomain = DOMAINS[persona.domain];
            const functionLabel = persona.functionLabel ?? persona.role.replace('_', ' ');
            const functionBadgeStyle = {
              backgroundColor: hexToRgba(personaDomain.theme.accent, 0.2),
              borderColor: hexToRgba(personaDomain.theme.accent, 0.6),
              color: '#FFFFFF',
            };
            const domainBadgeStyle = {
              backgroundColor: hexToRgba(personaDomain.theme.primary, 0.25),
              borderColor: hexToRgba(personaDomain.theme.primary, 0.5),
              color: '#FFFFFF',
            };
            const pilotFlags = persona.pilotFlags ?? [];
            const pilotBadgeText = persona.pilotLabel ?? 'Pilot';
            const hasPilotBadge = pilotFlags.some(flag => featureFlags[flag]);
            const pilotBadgeStyle = {
              backgroundColor: hexToRgba(personaDomain.theme.accent, 0.25),
              borderColor: hexToRgba(personaDomain.theme.accent, 0.65),
              color: '#FFFFFF',
            };
            // Domain-driven ring: reuse persona domain accent for avatar outline/glow.
            const ringColor = hexToRgba(personaDomain.theme.accent, isActive ? 0.7 : 0.45);
            const ringGlow = hexToRgba(personaDomain.theme.accent, isActive ? 0.35 : 0.22);
            const ringShadow = `0 0 0 ${isActive ? 6 : 5}px ${ringColor}, 0 15px 32px -18px ${ringGlow}`;
            const ringHoverShadow = `0 0 0 ${isActive ? 7 : 6}px ${hexToRgba(personaDomain.theme.accent, 0.78)}, 0 18px 36px -18px ${hexToRgba(personaDomain.theme.accent, 0.35)}`;

            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => handleSelect(id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(id);
                  }
                }}
                whileHover={reduceMotion ? reducedCardMotion.hover : cardMotion.hover}
                whileFocus={reduceMotion ? reducedCardMotion.focus : cardMotion.focus}
                animate={!reduceMotion && isActive ? cardMotion.active : undefined}
                transition={reduceMotion ? reducedCardMotion.transition : cardMotion.transition}
                className="group text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--login-focus-ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950 rounded-3xl w-full min-h-[260px] snap-start"
              >
                <Card
                  variant="hero"
                  className={cn(
                    'flex h-full flex-col items-center justify-between gap-5 px-5 py-7 transition-all duration-300 group-hover:shadow-2xl',
                    isActive && 'ring-2 shadow-2xl'
                  )}
                  style={{
                    backgroundColor: 'var(--login-panel-bg)',
                    borderColor: isActive ? 'var(--login-panel-border)' : hexToRgba(personaDomain.theme.primary, 0.12),
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <div className="flex flex-col items-center gap-4">
                    <motion.div
                      whileHover={reduceMotion ? undefined : { scale: 1.05, boxShadow: ringHoverShadow }}
                      animate={reduceMotion ? undefined : isActive ? { scale: 1.02 } : undefined}
                      transition={reduceMotion ? { duration: 0.12 } : { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
                      className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 shadow-xl"
                      style={{ borderColor: ringColor, boxShadow: ringShadow }}
                      aria-hidden
                    >
                      <Image
                        src={persona.avatar}
                        alt={persona.name}
                        width={80}
                        height={80}
                        className="h-18 w-18 rounded-full object-cover"
                        priority={index < 3}
                        sizes="80px"
                      />
                    </motion.div>
                    <div className="space-y-1.5 text-center">
                      <p className="text-base font-semibold text-white">{persona.name}</p>
                      <p className="text-[12px] font-bold uppercase tracking-wide text-primary-foreground">
                        {persona.role.replace('_', ' ')}
                      </p>
                      <p className="line-clamp-2 text-[12px] font-medium" style={{ color: 'var(--login-muted-text)' }}>
                        {persona.team}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex w-full flex-col gap-2.5">
                    <Badge
                      variant="outline"
                      style={functionBadgeStyle}
                      className="w-full justify-center rounded-full border-2 px-4 py-2 text-[11px] font-bold tracking-wide uppercase shadow-lg"
                    >
                      {functionLabel}
                    </Badge>
                    <div className="flex items-center justify-between text-[11px] font-semibold">
                      <div className="flex items-center gap-2">
                        {hasPilotBadge && (
                          <Badge
                            variant="outline"
                            style={pilotBadgeStyle}
                            className="rounded-full border-2 px-3 py-1 text-[10px] font-bold tracking-wide uppercase shadow-lg"
                          >
                            {pilotBadgeText}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          style={domainBadgeStyle}
                          className="rounded-full border-2 px-3.5 py-1.5 text-[10px] font-bold tracking-wide shadow-lg"
                        >
                          {personaDomain.personaLabel}
                        </Badge>
                      </div>
                      {isActive && (
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-primary-foreground">
                          <span
                            className="h-2 w-2 rounded-full animate-pulse motion-reduce:animate-none shadow-lg bg-success"
                            style={{ boxShadow: '0 0 8px var(--success)' }}
                          />
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.button>
            );
          })}
        </section>

        <div className="flex flex-col items-center gap-2 text-xs text-[var(--login-muted-text)]">
          <Button
            variant="outline"
            size="sm"
            className="border-[var(--login-panel-border)] bg-[var(--login-panel-bg)] text-primary-foreground hover:bg-[var(--login-panel-border)] hover:text-primary-foreground"
            onClick={() => switchUser(currentUser.id)}
          >
            Skip for now – continue as {currentUser.name}
          </Button>
          <span>Changes are local to this demo only.</span>
          <a href="#" className="text-primary/70 hover:text-primary underline mt-2">Forgot Password?</a>
        </div>
      </div>
    </div>
  );
}
