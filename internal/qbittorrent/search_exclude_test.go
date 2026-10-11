// Copyright (c) 2026, s0up and the autobrr contributors.
// SPDX-License-Identifier: GPL-2.0-or-later

package qbittorrent

import (
	"testing"

	qbt "github.com/autobrr/go-qbittorrent"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSplitSearchTerms(t *testing.T) {
	tests := []struct {
		name        string
		search      string
		wantInclude string
		wantExclude []string
	}{
		{name: "empty", search: "", wantInclude: ""},
		{name: "plain words come back as given", search: "ubuntu  iso", wantInclude: "ubuntu  iso"},
		{name: "one exclusion", search: "1080p -cam", wantInclude: "1080p", wantExclude: []string{"cam"}},
		{name: "exclusion first and several", search: "-cam -ts 1080p", wantInclude: "1080p", wantExclude: []string{"cam", "ts"}},
		{name: "only exclusions", search: "-cam", wantInclude: "", wantExclude: []string{"cam"}},
		{name: "extra whitespace", search: "  -cam   1080p ", wantInclude: "1080p", wantExclude: []string{"cam"}},
		{name: "exclusion is lower-cased", search: "-CAM", wantInclude: "", wantExclude: []string{"cam"}},
		{name: "separators stay in an exclusion", search: "-web-dl", wantInclude: "", wantExclude: []string{"web-dl"}},
		{name: "plus makes a word required, which it already is", search: "+1080p -cam", wantInclude: "1080p", wantExclude: []string{"cam"}},
		{name: "lone minus is ignored", search: "-", wantInclude: ""},
		{name: "lone plus is ignored", search: "+", wantInclude: ""},
		{name: "lone minus in the middle is ignored", search: "artist - title", wantInclude: "artist title"},
		{name: "trailing lone minus is ignored", search: "1080p -", wantInclude: "1080p"},
		{name: "hyphen inside a word is kept", search: "x264-GRP", wantInclude: "x264-GRP"},
		{name: "hyphen inside a word next to an exclusion", search: "Spider-Man -cam", wantInclude: "Spider-Man", wantExclude: []string{"cam"}},
		{name: "plus inside a word is kept", search: "c++ -java", wantInclude: "c++", wantExclude: []string{"java"}},
		{name: "second hyphen stays in the term", search: "--foo", wantInclude: "", wantExclude: []string{"-foo"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			include, excluded := splitSearchTerms(tt.search)

			assert.Equal(t, tt.wantInclude, include)
			assert.Equal(t, tt.wantExclude, excluded)
		})
	}
}

func searchExcludeTorrents() []qbt.Torrent {
	return []qbt.Torrent{
		{Hash: "aaaa1111", Name: "Some.Movie.2024.1080p.BluRay.x264-GRP", Category: "movies", Tags: "keep"},
		{Hash: "bbbb2222", Name: "Some.Movie.2024.1080p.CAM.x264-TSGRP", Category: "movies", Tags: ""},
		{Hash: "cccc3333", Name: "Other.Show.S01E01.1080p.WEB.DL.x265-GRP", Category: "tv", Tags: "keep"},
		{Hash: "dddd4444", Name: "Other.Show.S01E02.1080p.WEB-DL.x265-GRP", Category: "tv", Tags: "hdr, seen"},
		{Hash: "eeee5555", Name: "Plain.Linux.ISO", Category: "cam-recordings", Tags: ""},
		{Hash: "ffff6666", Name: "Another.ISO", Category: "iso", Tags: "ts"},
	}
}

func searchNames(torrents []qbt.Torrent) []string {
	names := make([]string, 0, len(torrents))
	for _, torrent := range torrents {
		names = append(names, torrent.Name)
	}
	return names
}

func TestFilterTorrentsBySearchExcludesTerms(t *testing.T) {
	sm := &SyncManager{}

	tests := []struct {
		name   string
		search string
		want   []string
	}{
		{
			name:   "exclusion with a search word",
			search: "1080p -cam",
			want: []string{
				"Some.Movie.2024.1080p.BluRay.x264-GRP",
				"Other.Show.S01E01.1080p.WEB.DL.x265-GRP",
				"Other.Show.S01E02.1080p.WEB-DL.x265-GRP",
			},
		},
		{
			name:   "exclusion alone keeps everything else, including a category match",
			search: "-cam",
			want: []string{
				"Some.Movie.2024.1080p.BluRay.x264-GRP",
				"Other.Show.S01E01.1080p.WEB.DL.x265-GRP",
				"Other.Show.S01E02.1080p.WEB-DL.x265-GRP",
				"Another.ISO",
			},
		},
		{
			name:   "exclusion matches tags",
			search: "1080p -hdr",
			want: []string{
				"Some.Movie.2024.1080p.BluRay.x264-GRP",
				"Some.Movie.2024.1080p.CAM.x264-TSGRP",
				"Other.Show.S01E01.1080p.WEB.DL.x265-GRP",
			},
		},
		{
			name:   "an exclusion is plain text, so separators must match",
			search: "1080p -web-dl",
			want: []string{
				"Some.Movie.2024.1080p.BluRay.x264-GRP",
				"Some.Movie.2024.1080p.CAM.x264-TSGRP",
				"Other.Show.S01E01.1080p.WEB.DL.x265-GRP",
			},
		},
		{
			name:   "several exclusions",
			search: "1080p -cam -web",
			want:   []string{"Some.Movie.2024.1080p.BluRay.x264-GRP"},
		},
		{
			name:   "plus is the same as a plain word",
			search: "+1080p -cam",
			want: []string{
				"Some.Movie.2024.1080p.BluRay.x264-GRP",
				"Other.Show.S01E01.1080p.WEB.DL.x265-GRP",
				"Other.Show.S01E02.1080p.WEB-DL.x265-GRP",
			},
		},
		{
			name:   "a lone minus matches everything",
			search: "-",
			want:   searchNames(searchExcludeTorrents()),
		},
		{
			name:   "a trailing lone minus changes nothing",
			search: "iso -",
			want:   []string{"Plain.Linux.ISO", "Another.ISO"},
		},
		{
			name:   "glob search with an exclusion",
			search: "*1080p* -cam",
			want: []string{
				"Some.Movie.2024.1080p.BluRay.x264-GRP",
				"Other.Show.S01E01.1080p.WEB.DL.x265-GRP",
				"Other.Show.S01E02.1080p.WEB-DL.x265-GRP",
			},
		},
		{
			name:   "glob characters in an exclusion do not make the search a glob",
			search: "1080p -[cam]",
			want: []string{
				"Some.Movie.2024.1080p.BluRay.x264-GRP",
				"Some.Movie.2024.1080p.CAM.x264-TSGRP",
				"Other.Show.S01E01.1080p.WEB.DL.x265-GRP",
				"Other.Show.S01E02.1080p.WEB-DL.x265-GRP",
			},
		},
		{
			name:   "an exclusion does not match the hash",
			search: "iso -aaaa",
			want:   []string{"Plain.Linux.ISO", "Another.ISO"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := sm.filterTorrentsBySearch(searchExcludeTorrents(), tt.search)

			assert.ElementsMatch(t, tt.want, searchNames(result))
		})
	}
}

func TestFilterTorrentsBySearchKeepsHyphenatedWords(t *testing.T) {
	sm := &SyncManager{}

	result := sm.filterTorrentsBySearch(searchExcludeTorrents(), "x264-GRP")

	// Searched as before, not read as an exclusion: the release is still found.
	assert.Contains(t, searchNames(result), "Some.Movie.2024.1080p.BluRay.x264-GRP")
}

func TestDropExcludedTorrentsReturnsInputWhenNothingMatches(t *testing.T) {
	torrents := searchExcludeTorrents()

	result := dropExcludedTorrents(torrents, []string{"nomatch"})

	require.Len(t, result, len(torrents))
	assert.Same(t, &torrents[0], &result[0])
}

func TestDropExcludedTorrentsDoesNotChangeItsInput(t *testing.T) {
	torrents := searchExcludeTorrents()
	before := searchNames(torrents)

	result := dropExcludedTorrents(torrents, []string{"cam"})

	assert.Less(t, len(result), len(torrents))
	assert.Equal(t, before, searchNames(torrents))
}
