import { YStack, SizableText, SizeTokens, Spacer } from 'tamagui'
import { CardSizeToken } from './types'

interface ItemCardCaptionProps {
	captionAlign: 'center' | 'left' | 'right'
	caption?: string | null | undefined
	subCaption?: string | null | undefined
	width: CardSizeToken
}

export default function ItemCardCaption({
	captionAlign = 'center',
	caption,
	subCaption,
	width,
}: ItemCardCaptionProps): React.JSX.Element | null {
	if (!caption) return null

	return (
		<YStack width={width} height={'100$'} backgroundColor={'background'}>
			<SizableText
				fontWeight={'6'}
				lineBreakStrategyIOS='standard'
				numberOfLines={1}
				fontSize={'2'}
				textAlign={captionAlign}
			>
				{caption}
			</SizableText>

			{subCaption ? (
				<SizableText
					fontSize={'2'}
					lineBreakStrategyIOS='standard'
					numberOfLines={1}
					textAlign={captionAlign}
				>
					{subCaption}
				</SizableText>
			) : (
				<Spacer />
			)}
		</YStack>
	)
}
