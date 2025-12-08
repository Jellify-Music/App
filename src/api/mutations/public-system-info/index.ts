import { useMutation } from '@tanstack/react-query'
import { connectToServer } from './utils'
import { JellifyServer } from '@/src/types/JellifyServer'
import serverAddressContainsProtocol from './utils/parsing'
import HTTPS, { HTTP } from '../../../constants/protocols'
import useJellifyStore from '../../../stores'

interface PublicSystemInfoMutation {
	serverAddress: string
	useHttps: boolean
}

interface PublicSystemInfoHook {
	onSuccess?: (server: JellifyServer) => void
	onError?: (error: Error) => void
}

const usePublicSystemInfo = ({ onSuccess, onError }: PublicSystemInfoHook) => {
	const setServer = useJellifyStore((state) => state.setServer)

	return useMutation({
		mutationFn: ({ serverAddress, useHttps }: PublicSystemInfoMutation) =>
			connectToServer(serverAddress!, useHttps),
		onSuccess: ({ publicSystemInfoResponse, connectionType }, { serverAddress, useHttps }) => {
			if (!publicSystemInfoResponse.Version)
				throw new Error(`Jellyfin instance did not respond`)

			const server: JellifyServer = {
				url:
					connectionType === 'hostname'
						? `${serverAddressContainsProtocol(serverAddress) ? '' : useHttps ? HTTPS : HTTP}${serverAddress!}`
						: publicSystemInfoResponse.LocalAddress!,
				address: serverAddress!,
				name: publicSystemInfoResponse.ServerName!,
				version: publicSystemInfoResponse.Version!,
				startUpComplete: publicSystemInfoResponse.StartupWizardCompleted!,
			}

			setServer(server)

			if (onSuccess) onSuccess(server)
		},
		onError: (error: Error) => {
			console.error('An error occurred connecting to the Jellyfin instance', error)

			setServer(undefined)

			if (onError) onError(error)
		},
	})
}

export default usePublicSystemInfo
