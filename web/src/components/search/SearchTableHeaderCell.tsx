/*
 * Copyright (c) 2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ReactNode } from "react"

import type { SearchTableColumnId } from "@/lib/search-table-columns"

import { SearchColumnResizeHandle } from "./SearchColumnResizeHandle"

interface SearchTableHeaderCellProps {
  id: SearchTableColumnId
  label: string
  /** Sort indicator, shown while the table is sorted by this column. */
  sortIcon?: ReactNode
  /** Clicking the header sorts when this is set. */
  onSort?: () => void
  filter: ReactNode
  onResize: (width: number) => void
  onResetWidth: () => void
}

export function SearchTableHeaderCell({
  id,
  label,
  sortIcon,
  onSort,
  filter,
  onResize,
  onResetWidth,
}: SearchTableHeaderCellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1 : undefined,
      }}
      className="relative h-10 px-2 flex items-center text-sm font-medium text-muted-foreground"
    >
      {/* Drag listeners sit here, not on the cell, so the resize handle can start its own drag. */}
      <div
        className="group flex w-full items-center justify-between gap-2 cursor-grab select-none active:cursor-grabbing"
        onClick={onSort}
        {...attributes}
        {...listeners}
      >
        <span className="select-none truncate">{label}</span>
        <div className="flex items-center gap-1">
          {sortIcon}
          <div onClick={(e) => e.stopPropagation()}>{filter}</div>
        </div>
      </div>
      <SearchColumnResizeHandle onResize={onResize} onReset={onResetWidth} />
    </div>
  )
}
