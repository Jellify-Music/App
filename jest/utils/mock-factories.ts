import { TrackItem } from 'react-native-nitro-player'

let trackCounter = 0

/**
 * Creates a mock TrackItem with sensible defaults.
 * Uses a deterministic counter for default IDs.
 */
export const createMockTrackItem = (
	overrides: Partial<TrackItem> & { id?: string } = {},
): TrackItem => {
	const id = overrides.id ?? `track-${++trackCounter}`
	return {
		id,
		title: `Track ${id}`,
		artist: 'Test Artist',
		album: 'Test Album',
		duration: 180,
		url: `https://example.com/${id}.mp3`,
		sessionId: 'TEST_SESSION_ID',
		extraPayload: {
			sourceType: 'stream',
			sessionId: 'TEST_SESSION_ID',
			item: JSON.stringify({
				Id: id,
				Name: `Track ${id}`,
				Artists: ['Test Artist'],
			}),
		},
		...overrides,
	} as TrackItem
}

/**
 * Creates an array of mock TrackItems with sequential IDs.
 */
export const createMockTracks = (count: number): TrackItem[] =>
	Array.from({ length: count }, (_, i) =>
		createMockTrackItem({ id: `track-${i + 1}`, title: `Track ${i + 1}` }),
	)

/**
 * Creates a mock JellifyServer object.
 */
export const createMockServer = (overrides: Record<string, unknown> = {}) => ({
	url: 'https://jellyfin.example.com',
	name: 'Test Server',
	...overrides,
})

/**
 * Creates a mock JellifyUser object.
 */
export const createMockUser = (overrides: Record<string, unknown> = {}) => ({
	id: 'user-123',
	name: 'testuser',
	accessToken: 'test-access-token-abc123',
	...overrides,
})

/**
 * Creates a mock JellifyLibrary object.
 */
export const createMockLibrary = (overrides: Record<string, unknown> = {}) => ({
	musicLibraryId: 'library-456',
	name: 'Music',
	...overrides,
})
