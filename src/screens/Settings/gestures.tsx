import React from 'react'
import { XStack, SizableText, ScrollView, Separator } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ActionChip, Setting } from '../../components/Settings/components/sections'
import { useSwipeSettingsStore } from '../../stores/settings/gestures'

export default function GesturesScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()
	const left = useSwipeSettingsStore((s) => s.left)
	const right = useSwipeSettingsStore((s) => s.right)
	const toggleLeft = useSwipeSettingsStore((s) => s.toggleLeft)
	const toggleRight = useSwipeSettingsStore((s) => s.toggleRight)

	return (
		<ScrollView
			contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
			showsVerticalScrollIndicator={false}
			testID='settings-screen-gestures'
			gap='2'
		>
			<SizableText color='borderColor' fontSize='2' marginVertical='2' marginHorizontal='4'>
				Single selection triggers on reveal; multiple selections show a menu.
			</SizableText>

			<Separator borderColor='borderColor' />

			<Setting title='Swipe Left' orientation='vertical'>
				<XStack gap='2' flexWrap='wrap'>
					<ActionChip
						testID='swipe-left-chip-favorite'
						active={left.includes('ToggleFavorite')}
						label='Favorite'
						icon='heart'
						onPress={() => toggleLeft('ToggleFavorite')}
					/>
					<ActionChip
						testID='swipe-left-chip-add-to-playlist'
						active={left.includes('AddToPlaylist')}
						label='Add to Playlist'
						icon='plus-circle-outline'
						onPress={() => toggleLeft('AddToPlaylist')}
					/>
					<ActionChip
						testID='swipe-left-chip-add-to-queue'
						active={left.includes('AddToQueue')}
						label='Play Later'
						icon='playlist-play'
						onPress={() => toggleLeft('AddToQueue')}
					/>
					<ActionChip
						testID='swipe-left-chip-play-next'
						active={left.includes('PlayNext')}
						label='Play Next'
						icon='playlist-music'
						onPress={() => toggleLeft('PlayNext')}
					/>
				</XStack>
			</Setting>

			<Separator borderColor='borderColor' />

			<Setting title='Swipe Right' orientation='vertical'>
				<XStack gap='2' flexWrap='wrap'>
					<ActionChip
						testID='swipe-right-chip-favorite'
						active={right.includes('ToggleFavorite')}
						label='Favorite'
						icon='heart'
						onPress={() => toggleRight('ToggleFavorite')}
					/>
					<ActionChip
						testID='swipe-right-chip-add-to-playlist'
						active={right.includes('AddToPlaylist')}
						label='Add to Playlist'
						icon='plus-circle-outline'
						onPress={() => toggleRight('AddToPlaylist')}
					/>
					<ActionChip
						testID='swipe-right-chip-add-to-queue'
						active={right.includes('AddToQueue')}
						label='Play Later'
						icon='playlist-play'
						onPress={() => toggleRight('AddToQueue')}
					/>
					<ActionChip
						testID='swipe-right-chip-play-next'
						active={right.includes('PlayNext')}
						label='Play Next'
						icon='playlist-music'
						onPress={() => toggleRight('PlayNext')}
					/>
				</XStack>
			</Setting>
		</ScrollView>
	)
}
