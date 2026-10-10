/*
 * Copyright (c) 2025-2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { closestCenter, DndContext, type DragEndEvent, type useSensors } from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

export interface ColumnOrderListItem {
  id: string
  label: string
  visible: boolean
  /** When false the checkbox is locked. */
  canHide?: boolean
  /** When false the column stays where it is: no drag handle. */
  canMove?: boolean
}

function SortableColumnItem({ item, reorderLabel, onToggle }: {
  item: ColumnOrderListItem
  reorderLabel: (label: string) => string
  onToggle: (id: string, visible: boolean) => void
}) {
  const canMove = item.canMove !== false
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canMove,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
      }}
    >
      {/*
       * The wrapper div stops pointer-event bubbling after dnd-kit's listeners
       * have fired on the button, preventing Radix's DismissableLayer from
       * treating the drag-start as a "click outside" and closing the dropdown.
       */}
      <div onPointerDown={(e) => e.stopPropagation()}>
        <button
          className="ml-1 flex-shrink-0 cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing disabled:invisible"
          aria-label={reorderLabel(item.label)}
          disabled={!canMove}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </div>
      <DropdownMenuCheckboxItem
        className="flex-1 capitalize"
        checked={item.visible}
        disabled={item.canHide === false}
        onCheckedChange={(value) => onToggle(item.id, !!value)}
        onSelect={(e) => e.preventDefault()}
      >
        <span className="truncate">{item.label}</span>
      </DropdownMenuCheckboxItem>
    </div>
  )
}

interface ColumnOrderListProps {
  /** In display order. */
  items: ColumnOrderListItem[]
  sensors: ReturnType<typeof useSensors>
  onDragEnd: (event: DragEndEvent) => void
  onToggle: (id: string, visible: boolean) => void
  reorderLabel: (label: string) => string
}

/** The drag-to-reorder, checkbox-to-show column list that goes inside a dropdown menu. */
export function ColumnOrderList({ items, sensors, onDragEnd, onToggle, reorderLabel }: ColumnOrderListProps) {
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableColumnItem key={item.id} item={item} reorderLabel={reorderLabel} onToggle={onToggle} />
        ))}
      </SortableContext>
    </DndContext>
  )
}
