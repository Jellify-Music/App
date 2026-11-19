import { XStack, SizableText } from 'tamagui'

interface AlbumSectionHeaderProps {
	discNumber: string
}

export default function AlbumSectionHeader({
	discNumber,
}: AlbumSectionHeaderProps): React.JSX.Element {
	return (
		<XStack
			width='100%'
			justifyContent={'space-between'}
			alignItems='center'
			backgroundColor='background'
			paddingHorizontal='2'
		>
			<SizableText padding={'2'} fontWeight='6'>{`Disc ${discNumber}`}</SizableText>
		</XStack>
	)
}
