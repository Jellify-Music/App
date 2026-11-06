/**
 * Represents the type of a playlist, either a user-created playlist or a "public" playlist,
 * which represents a playlist file on the server (.m3u, .m3u8, etc.) and is accessible to all users
 */
export type PlaylistType = 'User' | 'Public'

export const PlaylistTypes: Record<string, PlaylistType> = {
	User: 'User',
	Public: 'Public',
}
