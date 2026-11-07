import { useAppSettingsStore } from '../../src/stores/settings/app'

describe('app settings persist migration', () => {
	const migrate = useAppSettingsStore.persist.getOptions().migrate!

	it("renames the 'purple' color preset to 'haze'", async () => {
		const migrated = await migrate({ colorPreset: 'purple', theme: 'dark' }, 0)

		expect(migrated).toMatchObject({ colorPreset: 'haze', theme: 'dark' })
	})

	it('leaves other color presets untouched', async () => {
		const migrated = await migrate({ colorPreset: 'ocean' }, 0)

		expect(migrated).toMatchObject({ colorPreset: 'ocean' })
	})
})
