import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'

export interface FiltersProps {
	currentTab?: 'Tracks' | 'Albums' | 'Artists' | 'Playlists'
}
