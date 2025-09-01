import { devtools } from 'zustand/middleware'
import { create } from 'zustand'

type SocketState = 'open' | 'closed'

type SocketStore = {
	socketState: SocketState | undefined
	setSocketState: (socketState: SocketState) => void
}

const useSocketStore = create<SocketStore>()(
	devtools((set) => ({
		socketState: undefined,
		setSocketState: (socketState) => set({ socketState }),
	})),
)

const useSocketState: () => [SocketState | undefined, (socketState: SocketState) => void] = () =>
	useSocketStore((state) => [state.socketState, state.setSocketState])

export default useSocketState
