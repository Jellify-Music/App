import { ICON_PRESS_STYLES } from '../../../configs/styling/elements'
import { LibraryStackParamList } from '@/src/screens/Library/types'
import { SettingsStackParamList } from '@/src/screens/Settings/types'
import { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons'
import { Card, SizableText, ThemeTokens, XStack } from 'tamagui'
import Icon from './icon'

export type NavRowCardProps<T extends SettingsStackParamList | LibraryStackParamList> = Omit<
	RowCardProps,
	'onPress'
> & {
	route: keyof T
}

interface RowCardProps {
	title: string
	icon: MaterialDesignIconsIconName
	onPress?: () => void
	iconColor?: ThemeTokens
	description?: string
	testID?: string
}

export default function NavRowCard({
	title,
	icon,
	onPress,
	iconColor = '$borderColor',
	description,
	testID,
}: RowCardProps): React.JSX.Element {
	return (
		<Card
			testID={testID}
			borderWidth={1}
			borderColor='$borderColor'
			backgroundColor='$background'
			marginHorizontal='$3'
			marginVertical='$1.5'
			padding='$0'
			{...ICON_PRESS_STYLES}
			onPress={onPress}
		>
			<XStack
				paddingHorizontal='$3'
				paddingVertical='$3'
				alignItems='center'
				justifyContent='space-between'
			>
				<XStack alignItems='center' gap='$3' flex={1}>
					<Icon name={icon} color={iconColor} />
					<SizableText size='$5' fontWeight='600'>
						{title}
					</SizableText>
					{description && (
						<SizableText size='$3' color='$borderColor'>
							{description}
						</SizableText>
					)}
				</XStack>
				<Icon name='chevron-right' color='$borderColor' small />
			</XStack>
		</Card>
	)
}
