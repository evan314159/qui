/*
 * Copyright (c) 2026, s0up and the autobrr contributors.
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import { useClientSetting } from "@/lib/client-settings"
import { DEFAULT_SEARCH_TYPE, parseSearchType, type SearchType } from "@/lib/search-derived-params"

const STORAGE_KEY = "qui-search-type"
const OPTIONS = { defaultValue: DEFAULT_SEARCH_TYPE, parse: parseSearchType }

/** The Search page's type (Movies, TV, ...), remembered from the last time it was changed. */
export function usePersistedSearchType() {
  return useClientSetting<SearchType>(STORAGE_KEY, OPTIONS)
}
