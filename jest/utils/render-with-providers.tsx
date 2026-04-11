import React from 'react'
import {
	render,
	renderHook,
	type RenderOptions,
	type RenderHookOptions,
} from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TamaguiProvider, Theme } from 'tamagui'
import config from '../../src/configs/tamagui.config'

export function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
			mutations: {
				retry: false,
			},
		},
	})
}

type ProviderOptions = {
	queryClient?: QueryClient
	theme?: string
}

function createWrapper(options: ProviderOptions = {}) {
	const { queryClient = createTestQueryClient(), theme = 'purple_dark' } = options

	return function Wrapper({ children }: { children: React.ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>
				<TamaguiProvider config={config} defaultTheme={theme}>
					<Theme name={theme as 'purple_dark'}>{children}</Theme>
				</TamaguiProvider>
			</QueryClientProvider>
		)
	}
}

export function renderWithProviders(
	ui: React.ReactElement,
	options: RenderOptions & ProviderOptions = {},
) {
	const { queryClient, theme, ...renderOptions } = options
	const testQueryClient = queryClient ?? createTestQueryClient()

	return {
		...render(ui, {
			wrapper: createWrapper({ queryClient: testQueryClient, theme }),
			...renderOptions,
		}),
		queryClient: testQueryClient,
	}
}

export function renderHookWithProviders<Result, Props>(
	hook: (props: Props) => Result,
	options: RenderHookOptions<Props> & ProviderOptions = {} as RenderHookOptions<Props> &
		ProviderOptions,
) {
	const { queryClient, theme, ...hookOptions } = options
	const testQueryClient = queryClient ?? createTestQueryClient()

	return {
		...renderHook(hook, {
			wrapper: createWrapper({ queryClient: testQueryClient, theme }),
			...hookOptions,
		}),
		queryClient: testQueryClient,
	}
}
