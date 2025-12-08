import {
	registerSwipeableRow,
	unregisterSwipeableRow,
	notifySwipeableRowOpened,
	notifySwipeableRowClosed,
	closeAllSwipeableRows,
} from '../../src/components/Global/components/swipeable-row-registry'

/**
 * Expectation-driven tests for the swipeable row registry behavior.
 * We assert the observable contract (who gets closed and when),
 * not implementation details (like internal Sets/Maps).
 */

describe('swipeable-row-registry', () => {
	beforeEach(() => {
		// Ensure clean slate between tests
		closeAllSwipeableRows()
	})

	it('should noop when closing all with no registered rows', () => {
		expect(() => closeAllSwipeableRows()).not.toThrow()
	})

	it('should close previously open row when a new row opens', () => {
		const closeA = jest.fn()
		const closeB = jest.fn()

		registerSwipeableRow('A', closeA)
		registerSwipeableRow('B', closeB)

		// Open A first
		notifySwipeableRowOpened('A')
		expect(closeA).not.toHaveBeenCalled()
		expect(closeB).not.toHaveBeenCalled()

		// Open B should close A
		notifySwipeableRowOpened('B')
		expect(closeA).toHaveBeenCalledTimes(1)
		expect(closeB).not.toHaveBeenCalled()
	})

	it('opening the same row again should not close itself', () => {
		const closeA = jest.fn()
		registerSwipeableRow('A', closeA)

		notifySwipeableRowOpened('A')
		notifySwipeableRowOpened('A')

		// A should not be asked to close itself
		expect(closeA).not.toHaveBeenCalled()
	})

	it('closing a specific row removes it from the open set', () => {
		const closeA = jest.fn()
		registerSwipeableRow('A', closeA)

		notifySwipeableRowOpened('A')
		notifySwipeableRowClosed('A')

		// Closing all should not try to close A now
		closeAllSwipeableRows()
		expect(closeA).not.toHaveBeenCalled()
	})

	it('unregistering a row prevents further callbacks', () => {
		const closeA = jest.fn()
		registerSwipeableRow('A', closeA)
		notifySwipeableRowOpened('A')

		unregisterSwipeableRow('A')

		// Closing all should not call closeA (unregistered)
		closeAllSwipeableRows()
		expect(closeA).not.toHaveBeenCalled()
	})

	it('closeAllSwipeableRows closes all currently open rows once', () => {
		const closeA = jest.fn()
		const closeB = jest.fn()

		registerSwipeableRow('A', closeA)
		registerSwipeableRow('B', closeB)

		notifySwipeableRowOpened('A')
		notifySwipeableRowOpened('B') // this will close A and set B open
		closeA.mockClear()

		closeAllSwipeableRows()

		expect(closeA).not.toHaveBeenCalled()
		expect(closeB).toHaveBeenCalledTimes(1)

		// A or B should not be closed again after a second call (no open rows)
		closeB.mockClear()
		closeAllSwipeableRows()
		expect(closeB).not.toHaveBeenCalled()
	})
})
