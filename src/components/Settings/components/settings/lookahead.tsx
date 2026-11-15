import { YStack, XStack, SizableText, useTheme } from 'tamagui'
import { usePlayerSettingsStore } from '../../../../stores/settings/player'
import { useSharedValue } from 'react-native-reanimated'
import Slider from '@jellify-music/react-native-reanimated-slider'
import { getTokenValue } from '@tamagui/core'
export default function LookaheadSettings() {
	const lookahead = usePlayerSettingsStore((state) => state.lookahead)
	const setLookahead = usePlayerSettingsStore((state) => state.setLookahead)

	const { primary, neutral } = useTheme()

	const lookaheadSharedValue = useSharedValue(lookahead)

	return (
		<YStack gap='3'>
			<XStack alignItems='center' justifyContent='space-between' width='100%'>
				<YStack flex={1}>
					<SizableText fontSize='3' fontWeight='6'>
						Track Lookahead
					</SizableText>
					<SizableText fontSize='2' color='borderColor'>
						Number of upcoming tracks to prefetch
					</SizableText>
				</YStack>

				<SizableText
					fontSize='4'
					fontWeight='6'
					fontVariant={['tabular-nums']}
					color='primary'
					flexShrink={1}
					borderWidth={'1'}
					borderRadius={'2'}
					borderColor='primary'
					padding='2'
				>
					{lookahead}
				</SizableText>
			</XStack>

			<Slider
				value={lookaheadSharedValue}
				onValueUpdate={setLookahead}
				onValueChange={setLookahead}
				maxValue={10}
				thumbWidth={8}
				color={primary.val}
				backgroundColor={neutral.val}
				thumbShadowColor='black'
				trackHeight={getTokenValue('2')}
				step={1}
			/>
		</YStack>
	)
}
