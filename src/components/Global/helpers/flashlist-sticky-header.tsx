import useIsLightMode from '@/src/hooks/use-is-light-mode'
import LinearGradient from 'react-native-linear-gradient'
import { Text, useTheme, XStack, ZStack } from 'tamagui'

export default function FlashListStickyHeader({ text }: { text: string }): React.JSX.Element {
	const theme = useTheme()

	return (
		<ZStack padding={'$2'} paddingLeft={'$2'} backgroundColor={'$primary'} minHeight={'$2.5'}>
			<XStack flex={1} alignItems='center' paddingLeft={'$2'}>
				<Text marginRight={'$4'} fontSize={'$4'} fontWeight={'bold'} color={'$background'}>
					{text}
				</Text>
			</XStack>

			<LinearGradient
				start={{
					x: 0,
					y: 0,
				}}
				end={{
					x: 1,
					y: 0,
				}}
				locations={[0.1, 0.9]}
				colors={['transparent', theme.background.val]}
				style={{
					position: 'absolute',
					top: 0,
					right: 0,
					bottom: 0,
					left: 0,
					flex: 1,
				}}
			/>
		</ZStack>
	)
}
