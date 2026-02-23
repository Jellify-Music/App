import useIsLightMode from '@/src/hooks/use-is-light-mode'
import LinearGradient from 'react-native-linear-gradient'
import { Text, useTheme, XStack, ZStack } from 'tamagui'

export default function FlashListStickyHeader({ text }: { text: string }): React.JSX.Element {
	return (
		<XStack
			flex={1}
			alignItems='center'
			paddingLeft={'$2'}
			borderBottomWidth={'$1'}
			borderColor={'$primary'}
			backgroundColor={'$background'}
		>
			<Text margin={'$2'} fontSize={'$4'} fontWeight={'bold'} color={'$primary'}>
				{text}
			</Text>
		</XStack>
	)
}
