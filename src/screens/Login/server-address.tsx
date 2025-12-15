import React, { useEffect, useState } from 'react'
import { isEmpty, isUndefined } from 'lodash'
import { Input, ListItem, Separator, Spinner, XStack, YGroup, YStack } from 'tamagui'
import { SwitchWithLabel } from '../../components/Global/helpers/switch-with-label'
import { H2, Text } from '../../components/Global/helpers/text'
import Button from '../../components/Global/helpers/button'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Toast from 'react-native-toast-message'
import Icon from '../../components/Global/components/icon'
import { IS_MAESTRO_BUILD } from '../../configs/config'
import { sleepify } from '../../utils/sleep'
import LoginStackParamList from './types'
import { useSendMetricsSetting } from '../../stores/settings/app'
import HTTPS, { HTTP } from '../../constants/protocols'
import { JellifyServer } from '@/src/types/JellifyServer'
import { useSignOut } from '../../stores'
import { useConnectToServer } from '../../api/mutations/public-system-info/useConnectToServer'
import { ServerBackend } from '../../api/core/types'

export default function ServerAddress({
	navigation,
}: {
	navigation: NativeStackNavigationProp<LoginStackParamList>
}): React.JSX.Element {
	const [serverAddressContainsProtocol, setServerAddressContainsProtocol] =
		useState<boolean>(false)
	const [serverAddressContainsHttps, setServerAddressContainsHttps] = useState<boolean>(false)

	const [useHttps, setUseHttps] = useState<boolean>(true)
	const [serverAddress, setServerAddress] = useState<string | undefined>(undefined)
	const [detectedBackend, setDetectedBackend] = useState<ServerBackend | null>(null)
	const [isDetecting, setIsDetecting] = useState(false)

	const signOut = useSignOut()

	const [sendMetrics, setSendMetrics] = useSendMetricsSetting()

	useEffect(() => {
		setServerAddressContainsProtocol(
			!isUndefined(serverAddress) &&
				(serverAddress.includes(HTTP) || serverAddress.includes(HTTPS)),
		)
		setServerAddressContainsHttps(!isUndefined(serverAddress) && serverAddress.includes(HTTPS))
	}, [serverAddress])

	useEffect(() => {
		sleepify(1000).then(() => signOut())
	}, [])

	const { mutate: connectToServer, isPending } = useConnectToServer({
		onDetecting: () => setIsDetecting(true),
		onSuccess: (server: JellifyServer, backend: ServerBackend) => {
			setIsDetecting(false)
			setDetectedBackend(backend)
			Toast.show({
				text1: `Connected to ${backend === 'jellyfin' ? 'Jellyfin' : 'Navidrome'}`,
				text2: server.name,
				type: 'success',
			})
			navigation.navigate('ServerAuthentication')
		},
		onError: () => {
			setIsDetecting(false)
			setDetectedBackend(null)
			Toast.show({
				text1: 'Unable to connect',
				text2: ` at ${
					serverAddressContainsProtocol ? '' : useHttps ? HTTPS : HTTP
				}${serverAddress}`,
				type: 'error',
			})
		},
	})

	const getBackendIcon = () => {
		if (!detectedBackend) return 'server'
		return detectedBackend === 'jellyfin' ? 'jellyfish' : 'music-box'
	}

	const getBackendColor = () => {
		if (!detectedBackend) return '$borderColor'
		return '$success'
	}

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<YStack maxHeight={'$19'} flex={1} justifyContent='center'>
				<H2 marginHorizontal={'$10'} textAlign='center'>
					Connect to Server
				</H2>
				{detectedBackend && (
					<Text textAlign='center' color='$success' marginTop='$2'>
						{`${detectedBackend === 'jellyfin' ? 'Jellyfin' : 'Navidrome'} detected`}
					</Text>
				)}
			</YStack>

			<YStack marginHorizontal={'$4'} gap={'$4'}>
				<XStack alignItems='center'>
					{!serverAddressContainsProtocol && (
						<Text
							borderColor={'$borderColor'}
							borderWidth={'$0.5'}
							borderRadius={'$4'}
							padding={'$2'}
							paddingTop={'$2.5'}
							width={'$6'}
							height={'$4'}
							marginRight={'$2'}
							color={useHttps ? '$success' : '$borderColor'}
							textAlign='center'
							verticalAlign={'center'}
						>
							{useHttps ? HTTPS : HTTP}
						</Text>
					)}

					<Input
						onChangeText={setServerAddress}
						autoCapitalize='none'
						autoCorrect={false}
						secureTextEntry={IS_MAESTRO_BUILD} // If Maestro build, don't show the server address as screen Records
						flex={1}
						placeholder='music.example.com'
						testID='server_address_input'
						returnKeyType='go'
						onSubmitEditing={() => {
							if (!isUndefined(serverAddress))
								connectToServer({ serverAddress, useHttps })
						}}
					/>
				</XStack>

				<YGroup
					gap={'$2'}
					borderColor={'$borderColor'}
					borderWidth={'$0.5'}
					borderRadius={'$4'}
				>
					<YGroup.Item>
						<ListItem
							icon={
								<Icon
									name={
										serverAddressContainsHttps || useHttps
											? 'lock-check'
											: 'lock-open'
									}
									color={
										serverAddressContainsHttps || useHttps
											? '$success'
											: '$borderColor'
									}
								/>
							}
							title='HTTPS'
							subTitle='Use HTTPS to connect securely'
							disabled={serverAddressContainsProtocol}
						>
							<SwitchWithLabel
								checked={serverAddressContainsHttps || useHttps}
								onCheckedChange={(checked) => setUseHttps(checked)}
								label={
									serverAddressContainsHttps || useHttps
										? 'Use HTTPS'
										: 'Use HTTP'
								}
								size='$2'
								width={100}
							/>
						</ListItem>
					</YGroup.Item>

					<Separator />

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
				</YGroup>

				{isPending || isDetecting ? (
					<YStack alignItems='center' gap='$2'>
						<Spinner />
						<Text color='$borderColor'>
							{isDetecting ? 'Detecting server type...' : 'Connecting...'}
						</Text>
					</YStack>
				) : (
					<Button
						disabled={isEmpty(serverAddress)}
						onPress={() => {
							if (!isUndefined(serverAddress))
								connectToServer({ serverAddress, useHttps })
						}}
						testID='connect_button'
					>
						Connect
					</Button>
				)}
			</YStack>
		</SafeAreaView>
	)
}
