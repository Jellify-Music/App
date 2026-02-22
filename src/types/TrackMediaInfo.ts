export interface TrackMediaInfo {
	url: string
	artwork?: string
	duration: number
	sessionId: string
	sourceType: 'download' | 'stream'
}
