import 'react-native'
import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { Event } from 'react-native-track-player'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Button, Text } from 'react-native'

import { QueueProvider, useQueueContext } from '../src/providers/Player/queue'
import { eventHandler } from './setup-rntp'
import JellifyTrack from '../src/types/JellifyTrack'

const queryClient = new QueryClient()

const QueueConsumer = () => {
	const { currentIndex, useSkip, usePrevious, playQueue, setPlayQueue } = useQueueContext()

	const tracklist: JellifyTrack[] = [
		{
			url: 'https://example.com/1',
			item: {
				Id: '1',
			},
		},
		{
			url: 'https://example.com/2',
			item: {
				Id: '2',
			},
		},
		{
			url: 'https://example.com/3',
			item: {
				Id: '3',
			},
		},
	]
	return (
		<>
			<Text testID='current-index'>{currentIndex}</Text>

			<Button title='skip' testID='use-skip' onPress={() => useSkip.mutate(undefined)} />

			<Button title='previous' testID='use-previous' onPress={() => usePrevious.mutate()} />

			<Button
				title='load new queue'
				testID='use-load-new-queue'
				onPress={() => setPlayQueue(tracklist)}
			/>
		</>
	)
}

test(`${QueueProvider.name} renders and functions correctly`, async () => {
	const queueProvider = render(
		<QueryClientProvider client={queryClient}>
			<QueueProvider>
				<QueueConsumer />
			</QueueProvider>
		</QueryClientProvider>,
	)

	const currentIndex = screen.getByTestId('current-index')

	expect(currentIndex.props.children).toBe(-1)

	fireEvent.press(screen.getByTestId('use-load-new-queue'))

	act(() => {
		eventHandler({
			type: Event.PlaybackActiveTrackChanged,
			index: 2,
			track: {
				item: {
					Id: '3',
				},
			},
		})
	})

	await waitFor(() => {
		const updatedIndex = screen.getByTestId('current-index')
		expect(updatedIndex.props.children).toBe(2)
	})

	act(() => {
		eventHandler({
			type: Event.PlaybackActiveTrackChanged,
			index: 0,
			track: {
				item: {
					Id: '1',
				},
			},
		})
	})

	await waitFor(() => {
		const updatedIndex = screen.getByTestId('current-index')
		expect(updatedIndex.props.children).toBe(0)
	})
})
