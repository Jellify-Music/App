import React from 'react'
import { usePlayerContext } from '../../../providers/Player'
import { BlurView } from 'blur-react-native'
import ItemImage from '../../Global/components/image'
import { getToken, useTheme, View, YStack, ZStack } from 'tamagui'
import { useColorScheme } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

export default function BlurredBackground({
	width,
	height,
}: {
	width: number
	height: number
}): React.JSX.Element {
	const { nowPlaying } = usePlayerContext()
	const theme = useTheme()
	const isDarkMode = useColorScheme() === 'dark'

	return (
		<ZStack
			flex={1}
			width={width}
			height={height}
			position='absolute'
			top={0}
			left={0}
			bottom={0}
			right={0}
		>
			<BlurView
				style={{
					width,
					height,
				}}
				blurAmount={100}
				blurType={isDarkMode ? 'dark' : 'light'}
			>
				<ItemImage item={nowPlaying!.item} width={width} height={height} />
			</BlurView>

			{isDarkMode ? (
				<YStack width={width} height={height} position='absolute' flex={1}>
					<LinearGradient
						colors={[getToken('$black75'), getToken('$black10')]}
						style={{
							width,
							height,
							flex: 1,
						}}
					/>

					<LinearGradient
						colors={[getToken('$black10'), getToken('$black75'), getToken('$black')]}
						style={{
							width,
							height,
							flex: 2,
						}}
					/>
				</YStack>
			) : (
				<View
					flex={1}
					position='absolute'
					top={0}
					left={0}
					bottom={0}
					right={0}
					backgroundColor={theme.background.val}
					opacity={0.5}
				/>
			)}
		</ZStack>
	)
}
