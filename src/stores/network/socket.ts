import { devtools } from 'zustand/middleware'
import { create } from 'zustand'

type SocketState = 'open' | 'closed'

type SocketStore = {
	socketState: SocketState
	setSocketState: (socketState: SocketState) => void
}

const useSocketStore = create<SocketStore>()(
	devtools((set) => ({
		socketState: 'closed',
		setSocketState: (socketState) => set({ socketState }),
	})),
)

const useSocketState: () => [SocketState, (socketState: SocketState) => void] = () =>
	useSocketStore((state) => [state.socketState, state.setSocketState])

export default useSocketState
