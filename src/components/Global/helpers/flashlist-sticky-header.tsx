import { Paragraph, XStack } from 'tamagui'

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
			<Paragraph margin={'$2'} fontSize={'$6'} fontWeight={'$6'} color={'$primary'}>
				{text}
			</Paragraph>
		</XStack>
	)
}
