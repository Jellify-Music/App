import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import React, { useEffect } from 'react'
import { XStack, YStack } from 'tamagui'
import Icon from '../Global/components/icon'
import { Text } from '../Global/helpers/text'
import useHapticFeedback from '../../hooks/use-haptic-feedback'
import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { MaterialTopTabBar } from '@react-navigation/material-top-tabs'
import useTrackSelectionStore from '../../stores/selection/tracks'
import { useArtistContext } from '../../providers/Artist'

interface ArtistTabBarProps extends MaterialTopTabBarProps {
	isFavorites: boolean
	setIsFavorites: (isFavorites: boolean) => void
	sortBy: ItemSortBy
	setSortBy: (sortBy: ItemSortBy) => void
	sortOrder: SortOrder
	setSortOrder: (sortOrder: SortOrder) => void
}

export default function ArtistTabBar({
	isFavorites,
	setIsFavorites,
	sortBy,
	setSortBy,
	sortOrder,
	setSortOrder,
	...props
}: ArtistTabBarProps) {
	const trigger = useHapticFeedback()
	const { artist } = useArtistContext()
	const selectionKey = `artist-${artist.Id}`
	const { isSelecting, activeContext, beginSelection, endSelection, clearSelection } =
		useTrackSelectionStore()
	const isSelectionActive = isSelecting && activeContext === selectionKey
	const isOnTracksTab = props.state.routes[props.state.index].name === 'Tracks'

	useEffect(() => {
		if (!isOnTracksTab && isSelectionActive) {
			endSelection()
			clearSelection()
		}
	}, [isOnTracksTab, isSelectionActive, endSelection, clearSelection])

	return (
		<YStack>
			<MaterialTopTabBar {...props} />

			{isOnTracksTab && (
				<XStack
					borderColor={'$borderColor'}
					alignContent={'flex-start'}
					justifyContent='flex-start'
					paddingHorizontal={'$1'}
					paddingVertical={'$2'}
					gap={'$2'}
					maxWidth={'80%'}
				>
					<XStack
						onPress={() => {
							trigger('impactLight')
							setIsFavorites(!isFavorites)
						}}
						alignItems={'center'}
						justifyContent={'center'}
					>
						<Icon
							name={isFavorites ? 'heart' : 'heart-outline'}
							color={isFavorites ? '$primary' : '$borderColor'}
						/>

						<Text color={isFavorites ? '$primary' : '$borderColor'}>
							{isFavorites ? 'Favorites' : 'All'}
						</Text>
					</XStack>

					<XStack
						onPress={() => {
							trigger('impactLight')
							if (sortBy === ItemSortBy.DateCreated) {
								setSortBy(ItemSortBy.SortName)
								setSortOrder(SortOrder.Ascending)
							} else {
								setSortBy(ItemSortBy.DateCreated)
								setSortOrder(SortOrder.Descending)
							}
						}}
						alignItems={'center'}
						justifyContent={'center'}
					>
						<Icon
							name={
								sortBy === ItemSortBy.DateCreated
									? 'calendar'
									: 'sort-alphabetical-ascending'
							}
							color={'$borderColor'}
						/>{' '}
						<Text color={'$borderColor'}>
							{sortBy === ItemSortBy.DateCreated ? 'Date Added' : 'A-Z'}
						</Text>
					</XStack>

					<XStack
						onPress={() => {
							trigger('impactLight')
							if (isSelectionActive) {
								endSelection()
								clearSelection()
							} else {
								beginSelection(selectionKey)
							}
						}}
						alignItems={'center'}
						justifyContent={'center'}
					>
						<Icon
							name={isSelectionActive ? 'close-circle-outline' : 'checkbox-outline'}
							color={isSelectionActive ? '$primary' : '$borderColor'}
						/>
						<Text color={isSelectionActive ? '$primary' : '$borderColor'}>
							{isSelectionActive ? 'Cancel' : 'Select'}
						</Text>
					</XStack>
				</XStack>
			)}
		</YStack>
	)
}
