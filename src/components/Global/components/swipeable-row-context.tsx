import React, { createContext, useContext } from 'react'
import { SharedValue } from 'react-native-reanimated'

type SwipeableRowContextValue = {
	tx: SharedValue<number>
	menuOpenSV: SharedValue<boolean>
	leftWidth: number
	rightWidth: number
}

// Provide benign defaults so consuming hooks don't crash outside provider
const defaultShared: SharedValue<number> = { value: 0 } as SharedValue<number>
const defaultBool: SharedValue<boolean> = { value: false } as SharedValue<boolean>

const SwipeableRowContext = createContext<SwipeableRowContextValue>({
	tx: defaultShared,
	menuOpenSV: defaultBool,
	leftWidth: 0,
	rightWidth: 0,
})

export function SwipeableRowProvider({
	children,
	value,
}: {
	children: React.ReactNode
	value: SwipeableRowContextValue
}) {
	return <SwipeableRowContext.Provider value={value}>{children}</SwipeableRowContext.Provider>
}

export function useSwipeableRowContext(): SwipeableRowContextValue {
	return useContext(SwipeableRowContext)
}
