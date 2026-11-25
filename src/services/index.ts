import registerNitroPlayer from './player'
import registerAutoService from './auto'
import { configureDownloadManager } from './storage'
import registerCast from './cast'

/**
 * Registers all necessary services for the app, including:
 * - Nitro Player
 * - Download Manager (from Nitro Player)
 * - Auto Service (CarPlay on iOS, Android Auto on Android)
 */
export default function registerServices() {
	registerNitroPlayer()
	registerCast()
	configureDownloadManager()
	registerAutoService()
}
