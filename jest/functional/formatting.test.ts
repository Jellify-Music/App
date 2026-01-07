import { formatBytes } from '../../src/utils/formatting/bytes'
import { getItemName } from '../../src/utils/formatting/item-names'
import { pickFirstGenre } from '../../src/utils/formatting/genres'
import formatArtistNames from '../../src/utils/formatting/artist-names'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'

describe('formatBytes', () => {
	it('should return "0 B" for zero bytes', () => {
		expect(formatBytes(0)).toBe('0 B')
	})

	it('should return "0 B" for negative values', () => {
		expect(formatBytes(-100)).toBe('0 B')
	})

	it('should return "0 B" for NaN', () => {
		expect(formatBytes(NaN)).toBe('0 B')
	})

	it('should return "0 B" for Infinity', () => {
		expect(formatBytes(Infinity)).toBe('0 B')
	})

	it('should format bytes correctly', () => {
		expect(formatBytes(500)).toBe('500 B')
	})

	it('should format KB correctly', () => {
		expect(formatBytes(1024)).toBe('1.0 KB')
		expect(formatBytes(1536)).toBe('1.5 KB')
	})

	it('should format MB correctly', () => {
		expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
		expect(formatBytes(5.5 * 1024 * 1024)).toBe('5.5 MB')
	})

	it('should format GB correctly', () => {
		expect(formatBytes(1024 * 1024 * 1024)).toBe('1.0 GB')
	})

	it('should format TB correctly', () => {
		expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB')
	})

	it('should round values >= 10 to whole numbers', () => {
		expect(formatBytes(15 * 1024 * 1024)).toBe('15 MB')
	})
})

describe('getItemName', () => {
	it('should return Name when present', () => {
		const item: BaseItemDto = { Name: 'Test Track' }
		expect(getItemName(item)).toBe('Test Track')
	})

	it('should fall back to OriginalTitle when Name is missing', () => {
		const item: BaseItemDto = { OriginalTitle: 'Original Title' }
		expect(getItemName(item)).toBe('Original Title')
	})

	it('should return "Unknown Artist" for MusicArtist type', () => {
		const item: BaseItemDto = { Type: BaseItemKind.MusicArtist }
		expect(getItemName(item)).toBe('Unknown Artist')
	})

	it('should return "Unknown Album" for MusicAlbum type', () => {
		const item: BaseItemDto = { Type: BaseItemKind.MusicAlbum }
		expect(getItemName(item)).toBe('Unknown Album')
	})

	it('should return "Unknown Track" for Audio type', () => {
		const item: BaseItemDto = { Type: BaseItemKind.Audio }
		expect(getItemName(item)).toBe('Unknown Track')
	})

	it('should return "Unknown Playlist" for Playlist type', () => {
		const item: BaseItemDto = { Type: BaseItemKind.Playlist }
		expect(getItemName(item)).toBe('Unknown Playlist')
	})

	it('should return "Unknown Item" for unknown types', () => {
		const item: BaseItemDto = {}
		expect(getItemName(item)).toBe('Unknown Item')
	})
})

describe('pickFirstGenre', () => {
	it('should return empty string for undefined', () => {
		expect(pickFirstGenre(undefined)).toBe('')
	})

	it('should return empty string for null', () => {
		expect(pickFirstGenre(null)).toBe('')
	})

	it('should return empty string for empty array', () => {
		expect(pickFirstGenre([])).toBe('')
	})

	it('should return the first genre', () => {
		expect(pickFirstGenre(['Dance', 'Pop', 'Electronic'])).toBe('Dance')
	})

	it('should handle semicolon-separated genres and return first part', () => {
		expect(pickFirstGenre(['Dance;Electronic', 'Pop'])).toBe('Dance')
	})
})

describe('formatArtistNames', () => {
	it('should join artist names with bullet separator', () => {
		expect(formatArtistNames(['Artist 1', 'Artist 2'])).toBe('Artist 1 • Artist 2')
	})

	it('should return single artist name without separator', () => {
		expect(formatArtistNames(['Solo Artist'])).toBe('Solo Artist')
	})

	it('should return empty string for empty array', () => {
		expect(formatArtistNames([])).toBe('')
	})
})
