import { MaterialTopTabBarProps, MaterialTopTabBar } from '@react-navigation/material-top-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Square, YStack } from 'tamagui'
import StatusBar from '../Global/helpers/status-bar'

export default function SettingsTabBar(props: MaterialTopTabBarProps): React.JSX.Element {
	const { top } = useSafeAreaInsets()

	return (
		<YStack>
			<Square height={top} backgroundColor={'$primary'} />
			<StatusBar invertColors />
			<MaterialTopTabBar {...props} />
		</YStack>
	)
}
