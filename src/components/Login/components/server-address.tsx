import { Button, H3, Input, ListItem, Paragraph, Spinner, YGroup, YStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import LoginStackParamList from '../../../screens/Login/types'
import { useEffect, useState } from 'react'
import { useSignOut } from '../../../stores/auth'
import { useSendMetricsSetting } from '../../../stores/settings/app'
import { isEmpty, isUndefined } from 'lodash'
import usePublicSystemInfo from '../../../api/mutations/public-system-info'
import { IS_MAESTRO_BUILD } from '../../../configs/config'
import HTTPS, { HTTP } from '../../../constants/protocols'
import { JellyfinServer } from '../../../types/JellyfinServer'
import { sleepify } from '../../../utils/sleep'
import Toast from 'react-native-toast-message'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { StyleSheet } from 'react-native'

export default function ServerAddress(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<LoginStackParamList>>()

	const [serverAddressContainsProtocol, setServerAddressContainsProtocol] =
		useState<boolean>(false)

	const [serverAddress, setServerAddress] = useState<string | undefined>(undefined)

	const signOut = useSignOut()

	const [sendMetrics, setSendMetrics] = useSendMetricsSetting()

	useEffect(() => {
		setServerAddressContainsProtocol(
			!isUndefined(serverAddress) &&
				(serverAddress.includes(HTTP) || serverAddress.includes(HTTPS)),
		)
	}, [serverAddress])

	useEffect(() => {
		sleepify(1000).then(() => signOut())
	}, [])

	const { mutate: connectToServer, isPending } = usePublicSystemInfo({
		onSuccess: (server: JellyfinServer) => navigation.navigate('ServerAuthentication'),
		onError: () =>
			Toast.show({
				text1: 'Unable to connect',
				text2: `to ${serverAddress}`,
				type: 'error',
			}),
	})

	return (
		<YStack marginHorizontal={'$4'} gap={'$4'} flex={1} justifyContent='center'>
			<Animated.View
				entering={FadeIn.springify()}
				exiting={FadeOut.springify()}
				style={styles.headerSection}
			>
				<H3 textAlign='center' testID='server_address_title' margin={'$2'}>
					Welcome to Jellify!
				</H3>

				<Paragraph fontSize={'$6'} fontWeight={'$6'} textAlign='center' margin={'$2'}>
					Let&apos;s get connected to Jellyfin
				</Paragraph>
			</Animated.View>

			<Input
				onChangeText={setServerAddress}
				autoCapitalize='none'
				autoCorrect={false}
				secureTextEntry={IS_MAESTRO_BUILD} // If Maestro build, don't show the server address as screen Records
				flexDirection='row'
				flexShrink={1}
				placeholder='demo.jellyfin.org/stable'
				testID='server_address_input'
				returnKeyType='done'
				onSubmitEditing={() => {
					if (!isUndefined(serverAddress)) connectToServer({ serverAddress })
				}}
			/>

			<YGroup gap={'$2'} flexGrow={1}>
				<YGroup.Item>
					<ListItem
						icon={
							<Icon
								name={sendMetrics ? 'bug-check' : 'bug'}
								color={sendMetrics ? '$success' : '$borderColor'}
							/>
						}
						title='Submit Usage and Crash Data'
						subTitle='Send anonymized metrics and crash data'
					>
						<SwitchWithLabel
							checked={sendMetrics}
							onCheckedChange={(checked) => setSendMetrics(checked)}
							label='Send Metrics'
							size='$2'
							width={100}
						/>
					</ListItem>
				</YGroup.Item>
				<Button
					borderWidth={'$1'}
					icon={() =>
						isPending ? (
							<Spinner color='$primary' />
						) : (
							<Icon name='connection' small color='$primary' />
						)
					}
					borderColor={'$primary'}
					disabled={isEmpty(serverAddress) || isPending}
					onPress={() => {
						if (!isUndefined(serverAddress)) connectToServer({ serverAddress })
					}}
					testID='connect_button'
				>
					<Paragraph fontWeight={'$6'} color={'$primary'}>
						Connect
					</Paragraph>
				</Button>
			</YGroup>
		</YStack>
	)
}

const styles = StyleSheet.create({
	headerSection: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
})
