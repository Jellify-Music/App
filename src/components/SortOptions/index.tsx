import React, { useEffect } from 'react'
import { YStack } from 'tamagui'
import { Text } from '../Global/helpers/text'
import { RadioGroup } from 'tamagui'
import { RadioGroupItemWithLabel } from '../Global/helpers/radio-group-item-with-label'
import useLibraryStore, { LibraryTab } from '../../stores/library'
import { triggerHaptic } from '../../hooks/use-haptic-feedback'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'

const TRACK_SORT_OPTIONS: { value: ItemSortBy; label: string }[] = [
	{ value: ItemSortBy.Name, label: 'Track' },
	{ value: ItemSortBy.Album, label: 'Album' },
	{ value: ItemSortBy.Artist, label: 'Artist' },
	{ value: ItemSortBy.DateCreated, label: 'Date Added' },
	{ value: ItemSortBy.PlayCount, label: 'Play Count' },
	{ value: ItemSortBy.PremiereDate, label: 'Release Date' },
	{ value: ItemSortBy.Runtime, label: 'Runtime' },
]

const ALBUM_SORT_OPTIONS: { value: ItemSortBy; label: string }[] = [
	{ value: ItemSortBy.SortName, label: 'Album' },
	{ value: ItemSortBy.Artist, label: 'Artist' },
	{ value: ItemSortBy.DateCreated, label: 'Date Added' },
	{ value: ItemSortBy.PremiereDate, label: 'Release Date' },
]

const ARTIST_SORT_OPTIONS: { value: ItemSortBy; label: string }[] = [
	{ value: ItemSortBy.SortName, label: 'Artist' },
]

function toLibraryTab(tab: string | undefined): LibraryTab {
	const lower = tab?.toLowerCase()
	return lower === 'albums' || lower === 'artists' ? lower : 'tracks'
}

function getSortByOptionsForTab(tab: LibraryTab): { value: ItemSortBy; label: string }[] {
	switch (tab) {
		case 'albums':
			return ALBUM_SORT_OPTIONS
		case 'artists':
			return ARTIST_SORT_OPTIONS
		default:
			return TRACK_SORT_OPTIONS
	}
}

const DATE_SORT_BY: ItemSortBy[] = [ItemSortBy.DateCreated, ItemSortBy.PremiereDate]
const NUMERIC_SORT_BY: ItemSortBy[] = [ItemSortBy.PlayCount, ItemSortBy.Runtime]

function getSortOrderLabels(sortBy: ItemSortBy): { ascending: string; descending: string } {
	if (DATE_SORT_BY.includes(sortBy)) {
		return { ascending: 'Oldest', descending: 'Newest' }
	}
	if (NUMERIC_SORT_BY.includes(sortBy)) {
		return { ascending: 'Lowest', descending: 'Highest' }
	}
	return { ascending: 'Ascending', descending: 'Descending' }
}

export default function SortOptions({
	currentTab,
}: {
	currentTab?: 'Tracks' | 'Albums' | 'Artists'
}): React.JSX.Element {
	const tab = toLibraryTab(currentTab)
	const { getSortBy, getSortDescending, setSortBy, setSortDescending } = useLibraryStore()
	const sortByOptions = getSortByOptionsForTab(tab)
	const currentSortBy = getSortBy(tab)
	const effectiveSortBy = sortByOptions.some((o) => o.value === currentSortBy)
		? currentSortBy
		: sortByOptions[0]!.value
	const sortDescending = getSortDescending(tab)
	const sortOrderLabels = getSortOrderLabels(effectiveSortBy)

	const handleSortByChange = (value: string) => {
		triggerHaptic('impactLight')
		setSortBy(tab, value as ItemSortBy)
	}

	const handleSortOrderChange = (value: string) => {
		triggerHaptic('impactLight')
		setSortDescending(tab, value === 'descending')
	}

	// When opening the sheet, if stored sort is not in allowed options (e.g. after tab-specific change), persist the fallback
	useEffect(() => {
		if (effectiveSortBy !== currentSortBy) {
			setSortBy(tab, effectiveSortBy)
		}
	}, [tab, effectiveSortBy, currentSortBy, setSortBy])

	return (
		<YStack flex={1} padding={'$4'} gap={'$4'}>
			<YStack gap={'$2'}>
				<Text bold fontSize={'$6'} marginBottom={'$2'}>
					Sort By
				</Text>
				<RadioGroup value={effectiveSortBy} onValueChange={handleSortByChange}>
					<YStack gap={'$2'}>
						{sortByOptions.map((option) => (
							<RadioGroupItemWithLabel
								key={option.value}
								size={'$4'}
								value={option.value}
								label={option.label}
							/>
						))}
					</YStack>
				</RadioGroup>
			</YStack>

			<YStack gap={'$2'}>
				<Text bold fontSize={'$6'} marginBottom={'$2'}>
					Sort Order
				</Text>
				<RadioGroup
					value={sortDescending ? 'descending' : 'ascending'}
					onValueChange={handleSortOrderChange}
				>
					<YStack gap={'$2'}>
						<RadioGroupItemWithLabel
							size={'$4'}
							value='ascending'
							label={sortOrderLabels.ascending}
						/>
						<RadioGroupItemWithLabel
							size={'$4'}
							value='descending'
							label={sortOrderLabels.descending}
						/>
					</YStack>
				</RadioGroup>
			</YStack>
		</YStack>
	)
}
