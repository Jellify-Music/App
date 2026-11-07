import { YStack, XStack, SizableText } from 'tamagui'
import Icon from '../../../../Global/components/icon'
import { AppIconConfig } from '../../../../../types/Artwork/icon'
import AppIconPreview from './preview'
import { ICON_PRESS_STYLES } from '../../../../../configs/styling/elements'

interface AppIconCardProps {
	appIcon: AppIconConfig
	isSelected: boolean
	onPress: () => void
}

export default function AppIconCard({ appIcon, isSelected, onPress }: AppIconCardProps) {
	return (
		<YStack
			onPress={onPress}
			{...ICON_PRESS_STYLES}
			borderWidth={1}
			borderColor={`${isSelected ? 'primary' : 'borderColor'}`}
			backgroundColor={`${isSelected ? 'background25' : 'background'}`}
			borderRadius='4'
			padding='2-5'
			alignItems='center'
			gap='2'
			flex={1}
			testID={`app-icon-${appIcon.value}`}
		>
			<AppIconPreview appIcon={appIcon} size={44} />
			<XStack alignItems='center' gap='1'>
				<SizableText fontSize='2' fontWeight='6'>
					{appIcon.label}
				</SizableText>
				{isSelected && <Icon size='5' name='check-circle-outline' color='primary' />}
			</XStack>
		</YStack>
	)
}
