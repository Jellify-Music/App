import React from 'react'
import { usePlayerContext } from '../../../providers/Player'
import { getToken, useTheme, View, YStack, ZStack } from 'tamagui'
import { useColorScheme } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useSettingsContext } from '../../../providers/Settings'
import { getPrimaryBlurhashFromDto } from '../../../utils/blurhash'
import { Blurhash } from 'react-native-blurhash'

export default function BlurredBackground({
	width,
	height,
}: {
	width: number
	height: number
}): React.JSX.Element {
	const { nowPlaying } = usePlayerContext()

	const { theme: themeSetting } = useSettingsContext()

	const theme = useTheme()

	const isDarkMode =
		themeSetting === 'dark' || (themeSetting === 'system' && useColorScheme() === 'dark')

	const blurhash = getPrimaryBlurhashFromDto(nowPlaying!.item)

	return (
		<ZStack flex={1} width={width} height={height}>
			{blurhash && (
				<Blurhash
					blurhash={blurhash}
					style={{
						flex: 1,
						width: width,
						height: height,
					}}
				/>
			)}

			{isDarkMode ? (
				<YStack width={width} height={height} position='absolute' flex={1}>
					<LinearGradient
						colors={[getToken('$black'), getToken('$black25')]}
						style={{
							width,
							height,
							flex: 1,
						}}
					/>

					<LinearGradient
						colors={[
							getToken('$black25'),
							getToken('$black75'),
							getToken('$black'),
							getToken('$black'),
						]}
						style={{
							width,
							height,
							flex: 3,
						}}
					/>
				</YStack>
			) : (
				<View
					flex={1}
					position='absolute'
					top={0}
					left={0}
					right={0}
					bottom={0}
					backgroundColor={theme.background.val}
					width={width}
					height={height}
					opacity={0.5}
				/>
			)}
		</ZStack>
	)
}
