import { Patron } from '../../../types/patron'
import { XStack, SizableText } from 'tamagui'

export default function SupporterList({ patrons }: { patrons: Patron[] | undefined }) {
	if (!patrons?.length) return null
	return (
		<XStack flexWrap='wrap' gap='2' marginTop='2'>
			{patrons.map((patron, index) => (
				<SizableText
					key={index}
					flexShrink={1}
					fontSize='2'
					numberOfLines={1}
					lineBreakStrategyIOS='standard'
				>
					{patron.fullName}
				</SizableText>
			))}
		</XStack>
	)
}
