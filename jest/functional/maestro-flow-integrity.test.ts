import * as fs from 'fs'
import * as path from 'path'

/**
 * Guards the Maestro suite against broken flow references.
 *
 * flow-smoke.yaml once referenced maestro/tests/*.yaml files that had been
 * deleted in a refactor, which made the smoke suite fail instantly in CI.
 * Maestro only resolves runFlow targets at runtime, so without this check a
 * dangling reference is invisible until an emulator run.
 */

const MAESTRO_ROOT = path.join(__dirname, '..', '..', 'maestro')

const collectYamlFiles = (dir: string): string[] =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = path.join(dir, entry.name)
		if (entry.isDirectory()) return collectYamlFiles(fullPath)
		return /\.ya?ml$/.test(entry.name) ? [fullPath] : []
	})

/**
 * Extracts flow file references from a Maestro YAML file. Handles both the
 * inline form (`- runFlow: some/flow.yaml`) and the expanded form where the
 * target sits under a `file:` key (`- runFlow:` / `    file: some/flow.yaml`).
 */
const extractFlowRefs = (yamlPath: string): { ref: string; line: number }[] => {
	const refPattern = /^\s*(?:-\s*)?(?:runFlow|file):\s*(['"]?)([^\s'"]+\.ya?ml)\1\s*$/
	return fs
		.readFileSync(yamlPath, 'utf-8')
		.split('\n')
		.map((text, index) => {
			const match = text.match(refPattern)
			return match ? { ref: match[2], line: index + 1 } : undefined
		})
		.filter((entry): entry is { ref: string; line: number } => entry !== undefined)
}

describe('maestro flow integrity', () => {
	const yamlFiles = collectYamlFiles(MAESTRO_ROOT)

	it('finds maestro flow files', () => {
		expect(yamlFiles.length).toBeGreaterThan(0)
	})

	it('every runFlow reference points to a file that exists', () => {
		const brokenRefs = yamlFiles.flatMap((yamlFile) =>
			extractFlowRefs(yamlFile)
				.filter(({ ref }) => !fs.existsSync(path.resolve(path.dirname(yamlFile), ref)))
				.map(
					({ ref, line }) =>
						`${path.relative(MAESTRO_ROOT, yamlFile)}:${line} → ${ref} (missing)`,
				),
		)

		expect(brokenRefs).toEqual([])
	})

	it('the CI entry point flows exist', () => {
		expect(fs.existsSync(path.join(MAESTRO_ROOT, 'flow-full.yaml'))).toBe(true)
		expect(fs.existsSync(path.join(MAESTRO_ROOT, 'flow-smoke.yaml'))).toBe(true)
	})
})
