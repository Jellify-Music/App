/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render } from '@testing-library/react-native'
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { TamaguiProvider, Theme } from 'tamagui'
import config from '../../src/configs/tamagui.config'

jest.mock('../../src/constants/storage', () => {
	const map = new Map()
	return {
		storage: {
			getString: jest.fn((key: string) => map.get(key)),
			set: jest.fn((key: string, value: string) => map.set(key, value)),
			remove: jest.fn((key: string) => map.delete(key)),
			getNumber: jest.fn(() => undefined),
			clearAll: jest.fn(() => map.clear()),
		},
		mmkvStateStorage: {
			getItem: jest.fn((key: string) => map.get(key) ?? null),
			setItem: jest.fn((key: string, value: string) => map.set(key, value)),
			removeItem: jest.fn((key: string) => map.delete(key)),
		},
	}
})

const mockPlaylistTracks = jest.fn()
jest.mock('../../src/api/queries/playlist', () => ({
	usePlaylistTracks: jest.fn(() => mockPlaylistTracks()),
}))

jest.mock('../../src/stores', () => ({
	useApi: jest.fn(() => ({})),
	getApi: jest.fn(() => ({})),
	getUser: jest.fn(() => ({ Id: 'user-1', Name: 'Test User' })),
}))

jest.mock('../../src/stores/device-profile', () => ({
	__esModule: true,
	default: jest.fn(() => ({})),
	useStreamingDeviceProfileStore: {
		getState: jest.fn(() => ({ deviceProfile: {} })),
	},
}))

jest.mock('../../src/stores/settings/app', () => ({
	useReducedHapticsSetting: jest.fn(() => [false, jest.fn()]),
}))

jest.mock('../../src/hooks/downloads', () => ({
	useIsDownloaded: jest.fn(() => false),
	useAreAllDownloaded: jest.fn(() => false),
}))

jest.mock('../../src/hooks/downloads/mutations', () => ({
	__esModule: true,
	default: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
	useDeleteDownloads: jest.fn(() => ({ mutate: jest.fn() })),
}))

jest.mock('../../src/hooks/use-haptic-feedback', () => ({
	triggerHaptic: jest.fn(),
}))

jest.mock('../../src/hooks/player/functions/queue', () => ({
	loadNewQueue: jest.fn(),
}))

jest.mock('../../src/api/mutations/playlists', () => ({
	updatePlaylist: jest.fn(),
}))

jest.mock('../../src/constants/query-client', () => ({
	queryClient: {
		setQueryData: jest.fn(),
		invalidateQueries: jest.fn(),
	},
}))

jest.mock('../../src/screens/navigation', () => ({
	__esModule: true,
	default: { dispatch: jest.fn(), isReady: jest.fn(() => true), navigate: jest.fn() },
}))

jest.mock('react-native-reanimated', () => {
	const { View } = require('react-native')
	return {
		__esModule: true,
		default: {
			View: (props: any) => <View {...props} />,
		},
		Easing: { in: jest.fn((e) => e), out: jest.fn((e) => e), ease: 'ease' },
		FadeIn: { easing: jest.fn(() => undefined) },
		FadeOut: { easing: jest.fn(() => undefined) },
		FadeInDown: { easing: jest.fn(() => undefined) },
		FadeOutDown: { easing: jest.fn(() => undefined) },
		LinearTransition: { springify: jest.fn(() => undefined) },
		SlideInLeft: undefined,
		SlideOutRight: undefined,
	}
})

jest.mock('react-native-sortables', () => {
	const { View } = require('react-native')
	return {
		__esModule: true,
		default: {
			Grid: (props: any) => <View testID='sortable-grid' />,
			Handle: (props: any) => <View {...props} />,
			Touchable: (props: any) => <View {...props} />,
		},
	}
})

jest.mock('@shopify/flash-list', () => {
	const { View, Text } = require('react-native')
	return {
		FlashList: ({
			data,
			renderItem,
			ListHeaderComponent,
			ListEmptyComponent,
			keyExtractor,
		}: any) => (
			<View testID='flash-list'>
				{ListHeaderComponent}
				{data && data.length > 0
					? data.map((item: any, index: number) => (
							<View key={keyExtractor ? keyExtractor(item) : index}>
								{renderItem({ item, index })}
							</View>
						))
					: ListEmptyComponent}
			</View>
		),
	}
})

jest.mock('../../src/components/Playlist/components/header', () => {
	const { View, Text } = require('react-native')
	return {
		__esModule: true,
		default: ({ playlist, newName }: any) => (
			<View testID='playlist-header'>
				<Text testID='playlist-name'>{newName ?? playlist.Name}</Text>
			</View>
		),
	}
})

jest.mock('../../src/components/Global/components/Track', () => {
	const { View, Text } = require('react-native')
	return {
		__esModule: true,
		default: ({ track }: any) => (
			<View testID={`track-${track.Id}`}>
				<Text>{track.Name}</Text>
			</View>
		),
	}
})

jest.mock('../../src/components/Global/components/icon', () => ({
	__esModule: true,
	default: () => null,
}))

jest.mock('../../src/components/Global/helpers/text', () => {
	const { Text: RNText } = require('react-native')
	return {
		Text: (props: any) => <RNText {...props} />,
	}
})

jest.mock('../../src/components/Global/components/instant-mix-button', () => ({
	InstantMixButton: () => null,
}))

jest.mock('@react-navigation/native', () => ({
	useNavigation: jest.fn(() => ({
		navigate: jest.fn(),
		setOptions: jest.fn(),
		push: jest.fn(),
		goBack: jest.fn(),
	})),
	StackActions: { push: jest.fn() },
}))

jest.mock('@tanstack/react-query', () => ({
	useMutation: jest.fn(() => ({
		mutate: jest.fn(),
		isPending: false,
	})),
}))

import Playlist from '../../src/components/Playlist'

const mockNavigation = {
	navigate: jest.fn(),
	setOptions: jest.fn(),
	goBack: jest.fn(),
	push: jest.fn(),
} as any

const mockPlaylist = {
	Id: 'playlist-1',
	Name: 'My Playlist',
	Type: BaseItemKind.Playlist,
	RunTimeTicks: 60000000000,
}

function renderPlaylist(playlist = mockPlaylist, canEdit = false) {
	return render(
		<TamaguiProvider config={config} defaultTheme='purple_dark'>
			<Theme name='purple_dark'>
				<Playlist playlist={playlist} navigation={mockNavigation} canEdit={canEdit} />
			</Theme>
		</TamaguiProvider>,
	)
}

describe('Playlist Screen', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('renders header with playlist name', () => {
		mockPlaylistTracks.mockReturnValue({
			data: [
				{ Id: 't1', Name: 'Track One' },
				{ Id: 't2', Name: 'Track Two' },
			],
			isPending: false,
			isSuccess: true,
			refetch: jest.fn(),
			hasNextPage: false,
			fetchNextPage: jest.fn(),
			isFetchingNextPage: false,
		})

		const { getByTestId } = renderPlaylist()
		expect(getByTestId('playlist-header')).toBeTruthy()
		expect(getByTestId('playlist-name').props.children).toBe('My Playlist')
	})

	it('shows track list when tracks are available', () => {
		mockPlaylistTracks.mockReturnValue({
			data: [
				{ Id: 't1', Name: 'Track One' },
				{ Id: 't2', Name: 'Track Two' },
				{ Id: 't3', Name: 'Track Three' },
			],
			isPending: false,
			isSuccess: true,
			refetch: jest.fn(),
			hasNextPage: false,
			fetchNextPage: jest.fn(),
			isFetchingNextPage: false,
		})

		const { getByText } = renderPlaylist()
		expect(getByText('Track One')).toBeTruthy()
		expect(getByText('Track Two')).toBeTruthy()
		expect(getByText('Track Three')).toBeTruthy()
	})

	it('shows empty message when no tracks and not loading', () => {
		mockPlaylistTracks.mockReturnValue({
			data: [],
			isPending: false,
			isSuccess: true,
			refetch: jest.fn(),
			hasNextPage: false,
			fetchNextPage: jest.fn(),
			isFetchingNextPage: false,
		})

		const { getByText } = renderPlaylist()
		expect(getByText('No tracks in this playlist')).toBeTruthy()
	})
})
