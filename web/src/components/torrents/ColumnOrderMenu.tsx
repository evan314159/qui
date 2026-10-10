/*
 * Copyright (c) 2025-2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { columnLabel } from "@/lib/torrent-table/column-label"
import type { ColumnDnd } from "@/hooks/torrent-table/useColumnDnd"
import type { ColumnOrderState } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"
import { ColumnOrderList } from "@/components/ui/column-order-list"
import type { TorrentTable } from "./tanstackTableFeatures"

// sensors/onDragEnd are shared with the header drag so both paths use the same thresholds and reorder math.
interface ColumnOrderMenuProps extends Pick<ColumnDnd, "sensors" | "onDragEnd"> {
  table: TorrentTable
  columnOrder: ColumnOrderState
}

export function ColumnOrderMenu({ table, columnOrder, sensors, onDragEnd }: ColumnOrderMenuProps) {
  const { t } = useTranslation("torrents")
  const hideableColumns = table.getAllColumns().filter((col) => col.getCanHide())

  // Preserve the persisted column order within the menu list.
  const sorted = [...hideableColumns].sort((a, b) => {
    const ai = columnOrder.indexOf(a.id)
    const bi = columnOrder.indexOf(b.id)
    return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi)
  })

  return (
    <ColumnOrderList
      items={sorted.map((column) => ({
        id: column.id,
        label: columnLabel(column),
        visible: column.getIsVisible(),
        // The select column is pinned first; header drag disables it the same way.
        canMove: column.id !== "select",
      }))}
      sensors={sensors}
      onDragEnd={onDragEnd}
      onToggle={(id, visible) => table.getColumn(id)?.toggleVisibility(visible)}
      reorderLabel={(label) => t("tableView.reorderColumn", { column: label })}
    />
  )
}
