import { XStack, YStack, Spacer, useTheme, View } from 'tamagui'
import { Text } from '../../Global/helpers/text'
import React, { useState } from 'react'
import ItemImage from '../../Global/components/image'
import { LayoutChangeEvent } from 'react-native'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import navigationRef from '../../../screens/navigation'
import { useQueueRef, useCurrentTrack } from '../../../stores/player/queue'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../component.config'
import getTrackDto from '../../../utils/mapping/track-extra-payload'

export default function PlayerHeader(): React.JSX.Element {
	const queueRef = useQueueRef()

	const theme = useTheme()

	const playingFrom = !queueRef
		? 'Untitled'
		: typeof queueRef === 'object'
			? (queueRef.Name ?? 'Untitled')
			: queueRef

	return (
		<YStack flex={1} justifyContent='flex-start'>
			<XStack alignContent='flex-start' flexShrink={1} justifyContent='center'>
				<MaterialDesignIcons
					color={theme.color.val}
					name={'chevron-down'}
					size={22}
					onPress={() => navigationRef.goBack()}
					style={{
						marginVertical: 'auto',
						width: 22,
						marginRight: 8,
					}}
				/>

				<YStack alignItems='center' flexGrow={1}>
					<Text>Playing from</Text>
					<TextTicker {...TextTickerConfig}>
						<Text bold numberOfLines={1}>
							{playingFrom}
						</Text>
					</TextTicker>
				</YStack>

				<Spacer marginLeft={8} width={22} />
			</XStack>

			<PlayerArtwork />
		</YStack>
	)
}

function PlayerArtwork(): React.JSX.Element {
	const nowPlaying = useCurrentTrack()

	const item = getTrackDto(nowPlaying)

	const [artworkMaxHeight, setArtworkMaxHeight] = useState(200)
	const [artworkMaxWidth, setArtworkMaxWidth] = useState(200)

	const handleLayout = (event: LayoutChangeEvent) => {
		setArtworkMaxHeight(event.nativeEvent.layout.height)
		setArtworkMaxWidth(event.nativeEvent.layout.height)
	}

	return (
		<YStack
			flex={1}
			alignItems='center'
			justifyContent='center'
			paddingHorizontal={'$2'}
			maxHeight={'60%'}
			marginHorizontal={'$4'}
			marginVertical={'auto'}
			onLayout={handleLayout}
		>
			{nowPlaying && item && (
				<View maxHeight={artworkMaxHeight} maxWidth={artworkMaxWidth}>
					<ItemImage
						item={item}
						testID='player-image-test-id'
						imageOptions={{ maxWidth: 800, maxHeight: 800 }}
					/>
				</View>
			)}
		</YStack>
	)
}
