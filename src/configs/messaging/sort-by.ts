import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client'

export const SORTBY_TEXT: Record<
	Extract<
		ItemSortBy,
		'SortName' | 'DateLastContentAdded' | 'DatePlayed' | 'PlayCount' | 'Random'
	>,
	string
> = {
	DateLastContentAdded: 'Recently Added',
	DatePlayed: 'Last Played',
	SortName: 'Name',
	PlayCount: 'Play Count',
	Random: "I'm feeling lucky",
}
