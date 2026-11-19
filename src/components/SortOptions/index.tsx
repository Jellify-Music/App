import React, { useEffect } from 'react'
import { SizableText, YStack } from 'tamagui'
import { RadioGroup } from 'tamagui'
import { RadioGroupItemWithLabel } from '../Global/utils/radio-group-item-with-label'
import useLibraryStore, { LibraryTab } from '../../stores/library'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { applyHapticFeedback } from '../../utils/haptics'
import { useTranslation } from 'react-i18next'

type SortByLabel =
	'track' | 'album' | 'artist' | 'dateAdded' | 'playCount' | 'releaseDate' | 'runtime'

type SortOrderLabel = 'oldest' | 'newest' | 'lowest' | 'highest' | 'ascending' | 'descending'

const TRACK_SORT_OPTIONS: { value: ItemSortBy; label: SortByLabel }[] = [
	{ value: ItemSortBy.Name, label: 'track' },
	{ value: ItemSortBy.Album, label: 'album' },
	{ value: ItemSortBy.Artist, label: 'artist' },
	{ value: ItemSortBy.DateCreated, label: 'dateAdded' },
	{ value: ItemSortBy.PlayCount, label: 'playCount' },
	{ value: ItemSortBy.PremiereDate, label: 'releaseDate' },
	{ value: ItemSortBy.Runtime, label: 'runtime' },
]

const ALBUM_SORT_OPTIONS: { value: ItemSortBy; label: SortByLabel }[] = [
	{ value: ItemSortBy.SortName, label: 'album' },
	{ value: ItemSortBy.Artist, label: 'artist' },
	{ value: ItemSortBy.DateCreated, label: 'dateAdded' },
	{ value: ItemSortBy.PremiereDate, label: 'releaseDate' },
]

const ARTIST_SORT_OPTIONS: { value: ItemSortBy; label: SortByLabel }[] = [
	{ value: ItemSortBy.SortName, label: 'artist' },
]

function toLibraryTab(tab: string | undefined): LibraryTab {
	const lower = tab?.toLowerCase()
	return lower === 'albums' || lower === 'artists' ? lower : 'tracks'
}

function getSortByOptionsForTab(tab: LibraryTab): { value: ItemSortBy; label: SortByLabel }[] {
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

function getSortOrderLabels(sortBy: ItemSortBy): {
	ascending: SortOrderLabel
	descending: SortOrderLabel
} {
	if (DATE_SORT_BY.includes(sortBy)) {
		return { ascending: 'oldest', descending: 'newest' }
	}
	if (NUMERIC_SORT_BY.includes(sortBy)) {
		return { ascending: 'lowest', descending: 'highest' }
	}
	return { ascending: 'ascending', descending: 'descending' }
}

export default function SortOptions({
	currentTab,
}: {
	currentTab?: 'Tracks' | 'Albums' | 'Artists'
}): React.JSX.Element {
	const { t } = useTranslation()

	const { bottom } = useSafeAreaInsets()

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
		applyHapticFeedback('info')
		setSortBy(tab, value as ItemSortBy)
	}

	const handleSortOrderChange = (value: string) => {
		applyHapticFeedback('info')
		setSortDescending(tab, value === 'descending')
	}

	// When opening the sheet, if stored sort is not in allowed options (e.g. after tab-specific change), persist the fallback
	useEffect(() => {
		if (effectiveSortBy !== currentSortBy) {
			setSortBy(tab, effectiveSortBy)
		}
	}, [tab, effectiveSortBy, currentSortBy, setSortBy])

	return (
		<YStack padding='4' marginBottom={bottom} gap='4'>
			<YStack gap='2'>
				<SizableText fontWeight='6' size={'3'} marginBottom={'2'}>
					{t('sort.sortBy')}
				</SizableText>
				<RadioGroup value={effectiveSortBy} onValueChange={handleSortByChange}>
					<YStack gap='2'>
						{sortByOptions.map((option) => (
							<RadioGroupItemWithLabel
								key={option.value}
								size={'4'}
								value={option.value}
								label={t(`sort.by.${option.label}`)}
							/>
						))}
					</YStack>
				</RadioGroup>
			</YStack>

			<YStack gap='2'>
				<SizableText fontWeight='6' size={'3'} marginBottom={'2'}>
					{t('sort.sortOrder')}
				</SizableText>
				<RadioGroup
					value={sortDescending ? 'descending' : 'ascending'}
					onValueChange={handleSortOrderChange}
					gap='3'
				>
					<YStack gap='2'>
						<RadioGroupItemWithLabel
							size={'4'}
							value='ascending'
							label={t(`sort.order.${sortOrderLabels.ascending}`)}
						/>
						<RadioGroupItemWithLabel
							size={'4'}
							value='descending'
							label={t(`sort.order.${sortOrderLabels.descending}`)}
						/>
					</YStack>
				</RadioGroup>
			</YStack>
		</YStack>
	)
}
