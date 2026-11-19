import { useServerConnectionStatus, useNetworkStatusBannerStyle } from '../../hooks/network'
import { SizableText, YStack } from 'tamagui'
import Animated from 'react-native-reanimated'
import { NetworkStatuses } from '../../enums/network-status'

const InternetConnectionWatcher = () => {
	const [networkStatus, statusDisplayText] = useServerConnectionStatus()

	const animatedStyle = useNetworkStatusBannerStyle(networkStatus)

	return (
		<Animated.View style={[{ overflow: 'hidden' }, animatedStyle]}>
			<YStack
				height='1-5'
				justifyContent='center'
				alignContent='center'
				backgroundColor={`${networkStatus === NetworkStatuses.ONLINE ? 'success' : 'warning'}`}
			>
				<SizableText fontSize='2' fontWeight='6' textAlign='center' color='background'>
					{statusDisplayText}
				</SizableText>
			</YStack>
		</Animated.View>
	)
}

export default InternetConnectionWatcher
