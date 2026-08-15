import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { createContext, ReactNode, use } from 'react'

interface InstantMixContext {
	item: BaseItemDto
}

const InstantMixContext = createContext<InstantMixContext>({
	item: {},
})

interface InstantMixProviderProps {
	item: BaseItemDto
	children: ReactNode
}

export const InstantMixProvider = ({ item, children }: InstantMixProviderProps) => {
	const value: InstantMixContext = {
		item,
	}

	return <InstantMixContext value={value}>{children}</InstantMixContext>
}

export const useInstantMixContext = () => use(InstantMixContext)
