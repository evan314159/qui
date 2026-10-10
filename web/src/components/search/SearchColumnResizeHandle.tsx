/*
 * Copyright (c) 2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { useRef, useState, type PointerEvent } from "react"

import { clampSearchColumnWidth } from "@/lib/search-table-columns"
import { cn } from "@/lib/utils"

interface SearchColumnResizeHandleProps {
  onResize: (width: number) => void
  onReset: () => void
}

export function SearchColumnResizeHandle({ onResize, onReset }: SearchColumnResizeHandleProps) {
  const drag = useRef<{ startX: number; startWidth: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    // The rendered width: the title column is usually wider than its stored minimum.
    drag.current = { startX: event.clientX, startWidth: event.currentTarget.parentElement?.getBoundingClientRect().width ?? 0 }
    setDragging(true)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    onResize(clampSearchColumnWidth(drag.current.startWidth + event.clientX - drag.current.startX))
  }

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    drag.current = null
    setDragging(false)
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onReset()
      }}
      className="group/resize absolute right-0 top-0 z-10 flex h-full w-2 cursor-col-resize touch-none select-none justify-end"
    >
      <div className={cn("h-full w-px bg-border group-hover/resize:bg-primary/50", dragging && "bg-primary")} />
    </div>
  )
}
