import * as fs from 'fs'
import * as path from 'path'

// Fails if any runFlow/file: reference under maestro/ points at a missing file. flow-smoke.yaml
// once referenced deleted tests/*.yaml and broke CI, and Maestro only resolves these at runtime.

const MAESTRO_ROOT = path.join(__dirname, '..', '..', 'maestro')

const collectYamlFiles = (dir: string): string[] =>
	fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = path.join(dir, entry.name)
		if (entry.isDirectory()) return collectYamlFiles(fullPath)
		return /\.ya?ml$/.test(entry.name) ? [fullPath] : []
	})

// Pulls flow refs from a YAML file — both `- runFlow: x.yaml` and the expanded `file: x.yaml` form
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
