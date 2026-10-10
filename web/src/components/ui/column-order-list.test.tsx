/*
 * Copyright (c) 2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DropdownMenu, DropdownMenuContent } from "@/components/ui/dropdown-menu"

import { ColumnOrderList, type ColumnOrderListItem } from "./column-order-list"

const items: ColumnOrderListItem[] = [
  { id: "select", label: "Select", visible: true, canMove: false },
  { id: "title", label: "Title", visible: true, canHide: false },
  { id: "size", label: "Size", visible: true },
  { id: "group", label: "Group", visible: false },
]

function renderList(onToggle = vi.fn()) {
  render(
    <DropdownMenu open>
      <DropdownMenuContent>
        <ColumnOrderList
          items={items}
          sensors={[]}
          onDragEnd={() => {}}
          onToggle={onToggle}
          reorderLabel={(label) => `reorder ${label}`}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
  return onToggle
}

beforeEach(() => {
  // Radix measures the menu; jsdom has no ResizeObserver.
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("ColumnOrderList", () => {
  it("lists the columns in the given order with their visibility", () => {
    renderList()

    const boxes = screen.getAllByRole("menuitemcheckbox")
    expect(boxes.map(box => box.textContent)).toEqual(["Select", "Title", "Size", "Group"])
    expect(boxes.map(box => box.getAttribute("aria-checked"))).toEqual(["true", "true", "true", "false"])
  })

  it("toggles a column but not one that cannot be hidden", () => {
    const onToggle = renderList()

    fireEvent.click(screen.getByText("Group"))
    expect(onToggle).toHaveBeenCalledWith("group", true)

    fireEvent.click(screen.getByText("Title"))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it("gives each movable column a labelled drag handle and pins the rest", () => {
    renderList()

    expect(screen.getByLabelText("reorder Size")).toBeTruthy()
    expect((screen.getByLabelText("reorder Select") as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByLabelText("reorder Title") as HTMLButtonElement).disabled).toBe(false)
  })
})
