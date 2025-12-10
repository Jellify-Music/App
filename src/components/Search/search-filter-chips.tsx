import React from 'react'
import { ScrollView } from 'react-native'
import { SizableText, XStack } from 'tamagui'
import Button from '../Global/helpers/button'
import Icon from '../Global/components/icon'
import useSearchStore, { SearchFilterType } from '../../stores/search'
import useHapticFeedback from '../../hooks/use-haptic-feedback'

const FILTER_OPTIONS: { type: SearchFilterType; icon: string }[] = [
	{ type: 'All', icon: 'magnify' },
	{ type: 'Artists', icon: 'account-music' },
	{ type: 'Albums', icon: 'album' },
	{ type: 'Tracks', icon: 'music-note' },
	{ type: 'Playlists', icon: 'playlist-music' },
]

function FilterChip({
	active,
	label,
	icon,
	onPress,
}: {
	active: boolean
	label: string
	icon: string
	onPress: () => void
}) {
	return (
		<Button
			pressStyle={{
				backgroundColor: '$neutral',
			}}
			onPress={onPress}
			backgroundColor={active ? '$primary' : 'transparent'}
			borderColor={active ? '$primary' : '$borderColor'}
			borderWidth={'$0.5'}
			color={active ? '$background' : '$color'}
			paddingHorizontal={'$3'}
			size={'$2'}
			borderRadius={'$10'}
			icon={<Icon name={icon} color={active ? '$background' : '$color'} small />}
		>
			<SizableText color={active ? '$background' : '$color'} size={'$2'}>
				{label}
			</SizableText>
		</Button>
	)
}

function ToggleChip({
	active,
	label,
	icon,
	onPress,
	activeColor = '$primary',
}: {
	active: boolean
	label: string
	icon: string
	onPress: () => void
	activeColor?: string
}) {
	return (
		<Button
			pressStyle={{
				backgroundColor: '$neutral',
			}}
			onPress={onPress}
			backgroundColor={active ? activeColor : 'transparent'}
			borderColor={active ? activeColor : '$borderColor'}
			borderWidth={'$0.5'}
			color={active ? '$background' : '$color'}
			paddingHorizontal={'$3'}
			size={'$2'}
			borderRadius={'$10'}
			icon={<Icon name={icon} color={active ? '$background' : '$borderColor'} small />}
		>
			<SizableText color={active ? '$background' : '$borderColor'} size={'$2'}>
				{label}
			</SizableText>
		</Button>
	)
}

export default function SearchFilterChips(): React.JSX.Element {
	const trigger = useHapticFeedback()

	const selectedFilter = useSearchStore((state) => state.selectedFilter)
	const setSelectedFilter = useSearchStore((state) => state.setSelectedFilter)
	const isFavorites = useSearchStore((state) => state.isFavorites)
	const setIsFavorites = useSearchStore((state) => state.setIsFavorites)
	const isDownloaded = useSearchStore((state) => state.isDownloaded)
	const setIsDownloaded = useSearchStore((state) => state.setIsDownloaded)

	const handleFilterPress = (filter: SearchFilterType) => {
		trigger('impactLight')
		setSelectedFilter(filter)
	}

	const handleFavoritesPress = () => {
		trigger('impactLight')
		setIsFavorites(isFavorites ? undefined : true)
	}

	const handleDownloadedPress = () => {
		trigger('impactLight')
		setIsDownloaded(!isDownloaded)
	}

	return (
		<XStack gap={'$2'} paddingVertical={'$2'}>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={{ gap: 8, paddingHorizontal: 8 }}
			>
				{FILTER_OPTIONS.map((option) => (
					<FilterChip
						key={option.type}
						active={selectedFilter === option.type}
						label={option.type}
						icon={option.icon}
						onPress={() => handleFilterPress(option.type)}
					/>
				))}

				{/* Separator */}
				<XStack width={1} backgroundColor={'$borderColor'} marginHorizontal={'$1'} />

				{/* Favorites toggle - available for all types except All */}
				{selectedFilter !== 'Playlists' && (
					<ToggleChip
						active={isFavorites === true}
						label={isFavorites ? 'Favorites' : 'All'}
						icon={isFavorites ? 'heart' : 'heart-outline'}
						onPress={handleFavoritesPress}
						activeColor='$primary'
					/>
				)}

				{/* Downloaded toggle - only for Tracks */}
				{selectedFilter === 'Tracks' && (
					<ToggleChip
						active={isDownloaded}
						label={isDownloaded ? 'Downloaded' : 'All'}
						icon={isDownloaded ? 'download' : 'download-outline'}
						onPress={handleDownloadedPress}
						activeColor='$success'
					/>
				)}
			</ScrollView>
		</XStack>
	)
}
