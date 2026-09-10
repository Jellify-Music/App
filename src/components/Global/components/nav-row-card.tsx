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
			backgroundColor='$background'
			paddingHorizontal='$3'
			marginVertical='$1.5'
			{...ICON_PRESS_STYLES}
			onPress={onPress}
			borderColor={'$borderColor'}
			borderBottomWidth={'$1'}
		>
			<XStack
				paddingHorizontal='$3'
				paddingVertical='$3'
				alignItems='center'
				justifyContent='space-between'
				gap={'$2'}
			>
				<Icon name={icon} color={iconColor} />

				<XStack alignItems='center' justifyContent='space-between' flexGrow={1}>
					<SizableText size='$5' fontWeight='$6'>
						{title}
					</SizableText>
					{description && (
						<SizableText size='$5' color='$borderColor' fontWeight={'$4'}>
							{description}
						</SizableText>
					)}
				</XStack>

				<Icon name='chevron-right' color='$borderColor' small />
			</XStack>
		</Card>
	)
}
