// Copyright (c) 2026, s0up and the autobrr contributors.
// SPDX-License-Identifier: GPL-2.0-or-later

package qbittorrent

import (
	"strings"

	qbt "github.com/autobrr/go-qbittorrent"

	"github.com/autobrr/qui/pkg/stringutils"
)

// splitSearchTerms reads a search the way qBittorrent's WebUI filter does. A word
// starting with "-" excludes torrents containing it, as in "1080p -cam". A word
// starting with "+" is required, which a plain word already is, so the "+" is
// dropped. A "+" or "-" on its own is ignored. Only a "-" or "+" that starts a
// word counts, so "x264-GRP" and "c++" are untouched.
//
// It returns the text to match and the lower-cased words to exclude. A search
// with none of this comes back exactly as given.
func splitSearchTerms(search string) (string, []string) {
	// Almost no search has either character, so skip the tokenizing for those.
	if !strings.ContainsAny(search, "-+") {
		return search, nil
	}

	var kept, excluded []string
	changed := false
	for _, word := range strings.Fields(search) {
		switch {
		case word == "-" || word == "+":
			changed = true
		case strings.HasPrefix(word, "-"):
			excluded = append(excluded, strings.ToLower(word[1:]))
			changed = true
		case strings.HasPrefix(word, "+"):
			kept = append(kept, word[1:])
			changed = true
		default:
			kept = append(kept, word)
		}
	}
	if !changed {
		return search, nil
	}
	return strings.Join(kept, " "), excluded
}

// dropExcludedTorrents removes the torrents whose name, category or tags
// contain any excluded word, case-insensitively. It returns its input when
// nothing is removed.
func dropExcludedTorrents(torrents []qbt.Torrent, excluded []string) []qbt.Torrent {
	var kept []qbt.Torrent
	for i := range torrents {
		if torrentHasExcludedTerm(&torrents[i], excluded) {
			if kept == nil {
				kept = make([]qbt.Torrent, i, len(torrents))
				copy(kept, torrents[:i])
			}
			continue
		}
		if kept != nil {
			kept = append(kept, torrents[i])
		}
	}
	if kept == nil {
		return torrents
	}
	return kept
}

func torrentHasExcludedTerm(torrent *qbt.Torrent, excluded []string) bool {
	for _, term := range excluded {
		if stringutils.ContainsFold(torrent.Name, term) ||
			stringutils.ContainsFold(torrent.Category, term) ||
			stringutils.ContainsFold(torrent.Tags, term) {
			return true
		}
	}
	return false
}
