/* eslint-disable @typescript-eslint/no-explicit-any */
jest.mock('../../../src/constants/storage', () => {
	const map = new Map()
	return {
		storage: {
			getString: jest.fn((key: string) => map.get(key)),
			set: jest.fn((key: string, value: string) => map.set(key, value)),
			remove: jest.fn((key: string) => map.delete(key)),
			getNumber: jest.fn(() => undefined),
			clearAll: jest.fn(() => map.clear()),
		},
		mmkvStateStorage: {
			getItem: jest.fn((key: string) => map.get(key) ?? null),
			setItem: jest.fn((key: string, value: string) => map.set(key, value)),
			removeItem: jest.fn((key: string) => map.delete(key)),
		},
	}
})

import useLibraryStore from '../../../src/stores/library'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'

const initialState = useLibraryStore.getState()

beforeEach(() => {
	useLibraryStore.setState(initialState, true)
})

describe('library store', () => {
	describe('defaults', () => {
		it('has correct default sortBy per tab', () => {
			const state = useLibraryStore.getState()
			expect(state.sortBy).toEqual({
				tracks: ItemSortBy.Name,
				albums: ItemSortBy.Name,
				artists: ItemSortBy.SortName,
			})
		})

		it('has correct default sortDescending per tab', () => {
			const state = useLibraryStore.getState()
			expect(state.sortDescending).toEqual({
				tracks: false,
				albums: false,
				artists: false,
			})
		})

		it('has correct default filters', () => {
			const state = useLibraryStore.getState()
			expect(state.filters.tracks).toEqual({
				isFavorites: undefined,
				isDownloaded: false,
				isUnplayed: undefined,
				genreIds: undefined,
				yearMin: undefined,
				yearMax: undefined,
			})
			expect(state.filters.albums).toEqual({
				isFavorites: undefined,
				yearMin: undefined,
				yearMax: undefined,
			})
			expect(state.filters.artists).toEqual({
				isFavorites: undefined,
			})
		})
	})

	describe('setSortBy', () => {
		it('updates only the specified tab', () => {
			useLibraryStore.getState().setSortBy('albums', ItemSortBy.DateCreated)
			const state = useLibraryStore.getState()
			expect(state.sortBy.albums).toBe(ItemSortBy.DateCreated)
			expect(state.sortBy.tracks).toBe(ItemSortBy.Name)
			expect(state.sortBy.artists).toBe(ItemSortBy.SortName)
		})

		it('migrates from bare string to full object', () => {
			useLibraryStore.setState({ sortBy: 'Name' as unknown as typeof initialState.sortBy })
			useLibraryStore.getState().setSortBy('albums', ItemSortBy.DateCreated)
			const state = useLibraryStore.getState()
			expect(state.sortBy).toEqual({
				tracks: ItemSortBy.Name,
				albums: ItemSortBy.DateCreated,
				artists: ItemSortBy.SortName,
			})
		})
	})

	describe('setSortDescending', () => {
		it('updates only the specified tab', () => {
			useLibraryStore.getState().setSortDescending('artists', true)
			const state = useLibraryStore.getState()
			expect(state.sortDescending.artists).toBe(true)
			expect(state.sortDescending.tracks).toBe(false)
			expect(state.sortDescending.albums).toBe(false)
		})
	})

	describe('getSortBy', () => {
		it('returns the sort value for a given tab', () => {
			useLibraryStore.getState().setSortBy('tracks', ItemSortBy.DatePlayed)
			expect(useLibraryStore.getState().getSortBy('tracks')).toBe(ItemSortBy.DatePlayed)
			expect(useLibraryStore.getState().getSortBy('albums')).toBe(ItemSortBy.Name)
		})

		it('returns the raw string when sortBy is a legacy bare string', () => {
			useLibraryStore.setState({
				sortBy: 'CommunityRating' as unknown as typeof initialState.sortBy,
			})
			expect(useLibraryStore.getState().getSortBy('tracks')).toBe('CommunityRating')
		})
	})

	describe('setTracksFilters', () => {
		it('merges with existing track filters', () => {
			useLibraryStore.getState().setTracksFilters({ isFavorites: true })
			const filters = useLibraryStore.getState().filters.tracks
			expect(filters.isFavorites).toBe(true)
			expect(filters.isDownloaded).toBe(false)
		})
	})

	describe('setAlbumsFilters', () => {
		it('merges with existing album filters', () => {
			useLibraryStore.getState().setAlbumsFilters({ isFavorites: true, yearMin: 2000 })
			const filters = useLibraryStore.getState().filters.albums
			expect(filters.isFavorites).toBe(true)
			expect(filters.yearMin).toBe(2000)
		})
	})

	describe('setArtistsFilters', () => {
		it('merges with existing artist filters', () => {
			useLibraryStore.getState().setArtistsFilters({ isFavorites: true })
			expect(useLibraryStore.getState().filters.artists.isFavorites).toBe(true)
		})
	})

	describe('getFiltersForTab', () => {
		it('maps capitalised tab name to the correct filter object', () => {
			useLibraryStore.getState().setTracksFilters({ isFavorites: true })
			const filters = useLibraryStore.getState().getFiltersForTab('Tracks')
			expect(filters.isFavorites).toBe(true)
		})

		it('returns albums filters for Albums tab', () => {
			useLibraryStore.getState().setAlbumsFilters({ yearMax: 2024 })
			const filters = useLibraryStore.getState().getFiltersForTab('Albums')
			expect(filters.yearMax).toBe(2024)
		})

		it('returns artists filters for Artists tab', () => {
			const filters = useLibraryStore.getState().getFiltersForTab('Artists')
			expect(filters).toEqual({ isFavorites: undefined })
		})
	})

	describe('legacy migration', () => {
		it('setSortDescending handles legacy bare boolean format', () => {
			useLibraryStore.setState({ sortDescending: true as any })
			useLibraryStore.getState().setSortDescending('albums', true)
			const state = useLibraryStore.getState()
			expect(state.sortDescending).toEqual({
				tracks: false,
				albums: true,
				artists: false,
			})
		})

		it('getSortDescending returns boolean when state is legacy bare boolean', () => {
			useLibraryStore.setState({ sortDescending: false as any })
			expect(useLibraryStore.getState().getSortDescending('tracks')).toBe(false)
		})

		it('getSortBy handles legacy bare string format', () => {
			useLibraryStore.setState({ sortBy: 'Name' as any })
			expect(useLibraryStore.getState().getSortBy('tracks')).toBe('Name' as ItemSortBy)
		})
	})
})
