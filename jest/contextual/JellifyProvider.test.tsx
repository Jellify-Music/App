import { render, screen, waitFor } from '@testing-library/react-native'
import { JellifyProvider, useJellifyContext } from '../../src/providers'
import { Text, View } from 'react-native'
import { MMKVStorageKeys } from '../../src/enums/mmkv-storage-keys'
import { storage } from '../../src/constants/storage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

const JellifyConsumer = () => {
	const { server, user, library } = useJellifyContext()

	return (
		<View>
			<Text testID='api-base-path'>{server?.url}</Text>
			<Text testID='user-name'>{user?.name}</Text>
			<Text testID='library-name'>{library?.musicLibraryName}</Text>
		</View>
	)
}

test(`${JellifyProvider.name} renders correctly`, async () => {
	storage.set(
		MMKVStorageKeys.Server,
		JSON.stringify({
			url: 'http://localhost:8096',
		}),
	)

	storage.set(
		MMKVStorageKeys.User,
		JSON.stringify({
			name: 'Violet Caulfield',
		}),
	)

	storage.set(
		MMKVStorageKeys.Library,
		JSON.stringify({
			musicLibraryName: 'Music Library',
		}),
	)

	render(
		<QueryClientProvider client={queryClient}>
			<JellifyProvider>
				<JellifyConsumer />
			</JellifyProvider>
			,
		</QueryClientProvider>,
	)

	const apiBasePath = screen.getByTestId('api-base-path')
	const userName = screen.getByTestId('user-name')
	const libraryName = screen.getByTestId('library-name')

	await waitFor(() => {
		expect(apiBasePath.props.children).toBe('http://localhost:8096')
		expect(userName.props.children).toBe('Violet Caulfield')
		expect(libraryName.props.children).toBe('Music Library')
	})
})
