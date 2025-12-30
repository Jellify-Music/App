import React from 'react'
import { getToken, Theme, XStack, YStack } from 'tamagui'
import { Text } from '../../helpers/text'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import Icon from '../icon'
import ItemImage from '../image'
import FavoriteIcon from '../favorite-icon'
import DownloadedIcon from '../downloaded-icon'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useSwipeableRowContext } from '../swipeable-row-context'

export interface TrackRowContentProps {
	track: BaseItemDto
	invertedColors?: boolean
	artworkAreaWidth: number
	setArtworkAreaWidth: (width: number) => void
	showArtwork?: boolean
	textColor?: string
	indexNumber: string
	trackName: string
	shouldShowArtists: boolean
	artistsText: string
	runtimeComponent: React.ReactNode
	editing?: boolean
	handleIconPress: () => void
	testID?: string
}

function HideableArtwork({ children }: { children: React.ReactNode }) {
	const { tx } = useSwipeableRowContext()
	// Hide artwork as soon as swiping starts (any non-zero tx)
	const style = useAnimatedStyle(() => ({
		marginRight: 6,
		opacity: withTiming(tx.value === 0 ? 1 : 0),
	}))
	return <Animated.View style={style}>{children}</Animated.View>
}

function SlidingTextArea({
	leftGapWidth,
	hasArtwork,
	children,
}: {
	leftGapWidth: number
	hasArtwork: boolean
	children: React.ReactNode
}) {
	const { tx, rightWidth } = useSwipeableRowContext()
	const style = useAnimatedStyle(() => {
		const t = tx.value
		let offset = 0
		if (t > 0 && hasArtwork) {
			// Swiping right: row content moves right; pull text left up to artwork width to fill the gap
			offset = -Math.min(t, Math.max(0, leftGapWidth))
		} else if (t < 0) {
			// Swiping left: row content moves left; push text right a bit to keep it visible
			const compensate = Math.min(-t, Math.max(0, rightWidth))
			offset = compensate * 0.7
		}
		return {
			transform: [
				{
					translateX: withTiming(offset),
				},
			],
		}
	})
	return (
		<Animated.View
			style={[
				{
					flex: 1,
					flexGrow: 1,
				},
				style,
			]}
		>
			{children}
		</Animated.View>
	)
}

export default function TrackRowContent({
	track,
	invertedColors,
	artworkAreaWidth,
	setArtworkAreaWidth,
	showArtwork,
	textColor,
	indexNumber,
	trackName,
	shouldShowArtists,
	artistsText,
	runtimeComponent,
	editing,
	handleIconPress,
	testID,
}: TrackRowContentProps): React.JSX.Element {
	return (
		<Theme name={invertedColors ? 'inverted_purple' : undefined}>
			<XStack
				alignContent='center'
				alignItems='center'
				flex={1}
				gap={'$1'}
				testID={testID ?? undefined}
				paddingVertical={'$2'}
				paddingHorizontal={'$2'}
				animation={'quick'}
				pressStyle={{ opacity: 0.5 }}
				backgroundColor={'$background'}
			>
				<XStack
					flex={0}
					alignContent='center'
					justifyContent='center'
					onLayout={(e) => setArtworkAreaWidth(e.nativeEvent.layout.width)}
				>
					{showArtwork ? (
						<HideableArtwork>
							<ItemImage item={track} width={'$12'} height={'$12'} />
						</HideableArtwork>
					) : (
						<Text
							key={`${track.Id}-number`}
							width={getToken('$12')}
							color={textColor}
							textAlign='center'
							fontVariant={['tabular-nums']}
						>
							{indexNumber}
						</Text>
					)}
				</XStack>

				<SlidingTextArea leftGapWidth={artworkAreaWidth} hasArtwork={!!showArtwork}>
					<YStack alignItems='flex-start' justifyContent='center'>
						<Text
							key={`${track.Id}-name`}
							bold
							color={textColor}
							lineBreakStrategyIOS='standard'
							numberOfLines={1}
						>
							{trackName}
						</Text>

						{shouldShowArtists && (
							<Text
								key={`${track.Id}-artists`}
								lineBreakStrategyIOS='standard'
								numberOfLines={1}
								color={'$borderColor'}
							>
								{artistsText}
							</Text>
						)}
					</YStack>
				</SlidingTextArea>

				<XStack
					justifyContent='flex-end'
					alignItems='center'
					flex={0}
					flexShrink={1}
					gap='$1'
				>
					<DownloadedIcon item={track} />
					<FavoriteIcon item={track} />
					{runtimeComponent}
					{!editing && <Icon name={'dots-horizontal'} onPress={handleIconPress} />}
				</XStack>
			</XStack>
		</Theme>
	)
}
