import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { useMutation } from '@tanstack/react-query'
import { JellifyServer } from '../../../types/JellifyServer'
import { Input, ListItem, Separator, Spacer, Spinner, XStack, YGroup, YStack } from 'tamagui'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'
import { H2 } from '../../Global/helpers/text'
import Button from '../../Global/helpers/button'
import { http, https } from '../utils/constants'
import { JellyfinInfo } from '../../../api/info'
import { Jellyfin } from '@jellyfin/sdk/lib/jellyfin'
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../../../components/types'
import Toast from 'react-native-toast-message'
import { useJellifyContext } from '../../../providers'
import { useSettingsContext } from '../../../providers/Settings'
import Icon from '../../Global/components/icon'
import { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models'
import { getIpAddressesForHostname } from 'react-native-dns-lookup'

export default function ServerAddress({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const [useHttps, setUseHttps] = useState<boolean>(true)
	const [serverAddress, setServerAddress] = useState<string | undefined>(undefined)

	const { server, setServer, signOut } = useJellifyContext()

	const { setSendMetrics, sendMetrics } = useSettingsContext()

	useEffect(() => {
		signOut()
	}, [])

	const useServerMutation = useMutation({
		mutationFn: async () => {
			console.debug(`Connecting to ${useHttps ? https : http}${serverAddress}`)

			const jellyfin = new Jellyfin(JellyfinInfo)

			if (!serverAddress) throw new Error('Server address was empty')

			const api = jellyfin.createApi(`${useHttps ? https : http}${serverAddress}`)

			const connectViaHostnamePromise = () =>
				new Promise<PublicSystemInfo>((resolve, reject) => {
					getSystemApi(api)
						.getPublicSystemInfo()
						.then((response) => {
							if (!response.data.Version)
								return reject(
									new Error(
										'Jellyfin instance did not respond to our hostname request',
									),
								)
							return resolve(response.data)
						})
						.catch((error) => {
							console.error('An error occurred getting public system info', error)
							return reject(new Error('Unable to connect to Jellyfin via hostname'))
						})
				})

			const ipAddress = await getIpAddressesForHostname(serverAddress.split(':')[0])

			const ipAddressApi = jellyfin.createApi(
				`${useHttps ? https : http}${ipAddress[0]}:${serverAddress.split(':')[1]}`,
			)
			const connectViaLocalNetworkPromise = () =>
				new Promise<PublicSystemInfo>((resolve, reject) => {
					getSystemApi(ipAddressApi)
						.getPublicSystemInfo()
						.then((response) => {
							if (!response.data.Version)
								return reject(
									new Error(
										'Jellyfin instance did not respond to our IP Address request',
									),
								)
							return resolve(response.data)
						})
						.catch((error) => {
							console.error('An error occurred getting public system info', error)
							return reject(new Error('Unable to connect to Jellyfin via IP Address'))
						})
				})

			return connectViaHostnamePromise().catch(() => connectViaLocalNetworkPromise())
		},
		onSuccess: (publicSystemInfoResponse) => {
			if (!publicSystemInfoResponse.Version)
				throw new Error('Jellyfin instance did not respond')

			console.log(`Connected to Jellyfin ${publicSystemInfoResponse.Version!}`)

			const server: JellifyServer = {
				url: `${useHttps ? https : http}${serverAddress!}`,
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
					useHttps ? https : http
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
				<Input
					onChangeText={setServerAddress}
					autoCapitalize='none'
					autoCorrect={false}
					placeholder='jellyfin.org'
				/>

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
									name={useHttps ? 'lock-check' : 'lock-off'}
									color={useHttps ? '$success' : '$borderColor'}
								/>
							}
							title='HTTPS'
							subTitle='Use HTTPS to connect to Jellyfin'
						>
							<SwitchWithLabel
								checked={useHttps}
								onCheckedChange={(checked) => setUseHttps(checked)}
								label={useHttps ? 'Use HTTPS' : 'Use HTTP'}
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
					>
						Connect
					</Button>
				)}
			</YStack>
		</SafeAreaView>
	)
}
