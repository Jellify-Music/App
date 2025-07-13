import { HeaderButton, HeaderButtonProps } from 'react-navigation-header-buttons'
import Icon, { IconProps } from './icon'
import { Icon as VectorIcon } from 'react-native-vector-icons/Icon'
import { useTheme } from 'tamagui'

interface HeaderIconProps extends IconProps {
	name: string
}

export default function HeaderIcon(props: HeaderIconProps): React.JSX.Element {
	const theme = useTheme()

	return (
		<HeaderButton
			IconComponent={VectorIcon}
			title={props.name}
			renderButton={(buttonProps) => {
				// Try to resolve the color from theme, fallback to props.color if not found
				const colorKey = buttonProps.color as keyof typeof theme
				const colorValue = theme[colorKey]?.val ?? buttonProps.color
				return <Icon name={buttonProps.title} color={colorValue} small />
			}}
		/>
	)
}
