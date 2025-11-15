type CloseHandler = () => void

const closeHandlers = new Map<string, CloseHandler>()
const openRows = new Set<string>()

export const registerSwipeableRow = (id: string, close: CloseHandler) => {
	closeHandlers.set(id, close)
}

export const unregisterSwipeableRow = (id: string) => {
	closeHandlers.delete(id)
	openRows.delete(id)
}

export const notifySwipeableRowOpened = (id: string) => {
	openRows.forEach((openId) => {
		if (openId !== id) {
			const close = closeHandlers.get(openId)
			close?.()
		}
	})

	openRows.clear()
	openRows.add(id)
}

export const notifySwipeableRowClosed = (id: string) => {
	openRows.delete(id)
}

export const closeAllSwipeableRows = () => {
	openRows.forEach((id) => {
		const close = closeHandlers.get(id)
		close?.()
	})

	openRows.clear()
}
