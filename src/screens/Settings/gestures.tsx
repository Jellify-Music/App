import React from 'react'
import { YStack, XStack, SizableText, Paragraph, ScrollView } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import ActionChip from '../../components/Settings/components/sections/action-chip'
import { useSwipeSettingsStore } from '../../stores/settings/swipe'

export default function GesturesScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()
	const left = useSwipeSettingsStore((s) => s.left)
	const right = useSwipeSettingsStore((s) => s.right)
	const toggleLeft = useSwipeSettingsStore((s) => s.toggleLeft)
	const toggleRight = useSwipeSettingsStore((s) => s.toggleRight)

	return (
		<YStack flex={1} backgroundColor='$background'>
			<ScrollView
				contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
				showsVerticalScrollIndicator={false}
			>
				<YStack padding='$4' gap='$6'>
					<Paragraph color='$borderColor' size='$3'>
						Single selection triggers on reveal; multiple selections show a menu.
					</Paragraph>

					<YStack gap='$3'>
						<SizableText size='$4' fontWeight='600'>
							Swipe Left
						</SizableText>
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

					<YStack gap='$3'>
						<SizableText size='$4' fontWeight='600'>
							Swipe Right
						</SizableText>
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
				</YStack>
			</ScrollView>
		</YStack>
	)
}
