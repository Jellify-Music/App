import React from 'react'
import { XStack, YStack, SizableText, Paragraph } from 'tamagui'

import SettingsSection from '../settings-section'
import ActionChip from './action-chip'
import { useSwipeSettingsStore } from '../../../../stores/settings/swipe'

export default function GesturesSection(): React.JSX.Element {
	const left = useSwipeSettingsStore((s) => s.left)
	const right = useSwipeSettingsStore((s) => s.right)
	const toggleLeft = useSwipeSettingsStore((s) => s.toggleLeft)
	const toggleRight = useSwipeSettingsStore((s) => s.toggleRight)

	return (
		<SettingsSection title='Gestures' icon='gesture-swipe' iconColor='$success'>
			<Paragraph color='$borderColor' size='$2'>
				Single selection triggers on reveal; multiple selections show a menu.
			</Paragraph>

			<YStack gap='$2'>
				<SizableText size='$3'>Swipe Left</SizableText>
				<XStack gap='$2' flexWrap='wrap'>
					<ActionChip
						active={left.includes('ToggleFavorite')}
						label='Favorite'
						icon='heart'
						onPress={() => toggleLeft('ToggleFavorite')}
					/>
					<ActionChip
						active={left.includes('AddToPlaylist')}
						label='Add to Playlist'
						icon='playlist-plus'
						onPress={() => toggleLeft('AddToPlaylist')}
					/>
					<ActionChip
						active={left.includes('AddToQueue')}
						label='Add to Queue'
						icon='playlist-play'
						onPress={() => toggleLeft('AddToQueue')}
					/>
					<ActionChip
						active={left.includes('PlayNext')}
						label='Play Next'
						icon='playlist-music'
						onPress={() => toggleLeft('PlayNext')}
					/>
				</XStack>
			</YStack>

			<YStack gap='$2'>
				<SizableText size='$3'>Swipe Right</SizableText>
				<XStack gap='$2' flexWrap='wrap'>
					<ActionChip
						active={right.includes('ToggleFavorite')}
						label='Favorite'
						icon='heart'
						onPress={() => toggleRight('ToggleFavorite')}
					/>
					<ActionChip
						active={right.includes('AddToPlaylist')}
						label='Add to Playlist'
						icon='playlist-plus'
						onPress={() => toggleRight('AddToPlaylist')}
					/>
					<ActionChip
						active={right.includes('AddToQueue')}
						label='Add to Queue'
						icon='playlist-play'
						onPress={() => toggleRight('AddToQueue')}
					/>
					<ActionChip
						active={right.includes('PlayNext')}
						label='Play Next'
						icon='playlist-music'
						onPress={() => toggleRight('PlayNext')}
					/>
				</XStack>
			</YStack>
		</SettingsSection>
	)
}
