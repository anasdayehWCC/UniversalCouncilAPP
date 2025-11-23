"use client"

import * as React from "react"
import { PressableCard } from "@careminutes/ui"

type Props = React.ComponentProps<typeof PressableCard>

/**
 * Thin alias to keep a consistent import path for future RN-Web bridging.
 */
export const PressableSurface: React.FC<Props> = (props) => <PressableCard {...props} />
