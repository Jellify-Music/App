import useIsLightMode from '../../../hooks/use-is-light-mode'
import { useIsFocused } from '@react-navigation/native'
import { StatusBar as RNStatusBar, StatusBarStyle } from 'react-native'

interface StatusBarProps {
	invertColors?: boolean | undefined
}

export default function StatusBar({ invertColors }: StatusBarProps): React.JSX.Element | null {
	const isFocused = useIsFocused()

	const isLightMode = useIsLightMode()

	const barStyle: StatusBarStyle =
		isLightMode || (invertColors && !isLightMode) ? 'dark-content' : 'light-content'

	return isFocused ? <RNStatusBar barStyle={barStyle} /> : null
}
