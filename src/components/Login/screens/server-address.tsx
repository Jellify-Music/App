import React, { useEffect, useState } from 'react'
import _, { isUndefined } from 'lodash'
import { useMutation } from '@tanstack/react-query'
import { JellifyServer } from '../../../types/JellifyServer'
import { Input, ListItem, Separator, Spinner, XStack, YGroup, YStack } from 'tamagui'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'
import { H2, Text } from '../../Global/helpers/text'
import Button from '../../Global/helpers/button'
import { http, https } from '../utils/constants'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../../types'
import Toast from 'react-native-toast-message'
import { useJellifyContext } from '../../../providers'
import { useSettingsContext } from '../../../providers/Settings'
import Icon from '../../Global/components/icon'
import { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models'
import { connectToServer } from '../../../api/mutations/login'
import { IS_MAESTRO_BUILD } from '../../../configs/config'

export default function ServerAddress({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const [serverAddressContainsProtocol, setServerAddressContainsProtocol] =
		useState<boolean>(false)
	const [serverAddressContainsHttps, setServerAddressContainsHttps] = useState<boolean>(false)

	const [useHttps, setUseHttps] = useState<boolean>(true)
	const [serverAddress, setServerAddress] = useState<string | undefined>(undefined)

	const { server, setServer, signOut } = useJellifyContext()

	const { setSendMetrics, sendMetrics } = useSettingsContext()

	useEffect(() => {
		setServerAddressContainsProtocol(
			!isUndefined(serverAddress) &&
				(serverAddress.includes(http) || serverAddress.includes(https)),
		)
		setServerAddressContainsHttps(!isUndefined(serverAddress) && serverAddress.includes(https))
	}, [serverAddress])

	useEffect(() => {
		signOut()
	}, [])

	const useServerMutation = useMutation({
		mutationFn: () => connectToServer(serverAddress!, useHttps),
		onSuccess: ({
			publicSystemInfoResponse,
			connectionType,
		}: {
			publicSystemInfoResponse: PublicSystemInfo
			connectionType: 'hostname' | 'ipAddress'
		}) => {
			if (!publicSystemInfoResponse.Version)
				throw new Error('Jellyfin instance did not respond')

			console.debug(`Connected to Jellyfin via ${connectionType}`, publicSystemInfoResponse)
			console.log(`Connected to Jellyfin ${publicSystemInfoResponse.Version!}`)

			const server: JellifyServer = {
				url:
					connectionType === 'hostname'
						? `${serverAddressContainsProtocol ? '' : useHttps ? https : http}${serverAddress!}`
						: publicSystemInfoResponse.LocalAddress!,
				address: serverAddress!,
				name: publicSystemInfoResponse.ServerName!,
				version: publicSystemInfoResponse.Version!,
				startUpComplete: publicSystemInfoResponse.StartupWizardCompleted!,
			}

			setServer(server)

			navigation.navigate('ServerAuthentication')
		},
		onError: async (error: Error) => {
			console.error('An error occurred connecting to the Jellyfin instance', error)
			setServer(undefined)

			// Burnt.toast({
			// 	title: 'Unable to connect',
			// 	preset: 'error',
			// 	// message: `Unable to connect to Jellyfin at ${useHttps ? https : http}${serverAddress}`,
			// })
			Toast.show({
				text1: 'Unable to connect',
				text2: `Unable to connect to Jellyfin at ${
					serverAddressContainsProtocol ? '' : useHttps ? https : http
				}${serverAddress}`,
				type: 'error',
			})
		},
	})

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<YStack maxHeight={'$19'} flex={1} justifyContent='center'>
				<H2 marginHorizontal={'$10'} textAlign='center'>
					Connect to Jellyfin
				</H2>
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
							{useHttps ? https : http}
						</Text>
					)}

					<Input
						onChangeText={setServerAddress}
						autoCapitalize='none'
						autoCorrect={false}
						secureTextEntry={IS_MAESTRO_BUILD} // If Maestro build, don't show the server address as screen Records
						flex={1}
						placeholder='jellyfin.org'
						testID='server_address_input'
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
							subTitle='Use HTTPS to connect to Jellyfin'
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

				{useServerMutation.isPending ? (
					<Spinner />
				) : (
					<Button
						disabled={_.isEmpty(serverAddress)}
						onPress={() => {
							useServerMutation.mutate()
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
