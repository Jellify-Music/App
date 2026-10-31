import { writeFileSync } from 'fs'

/**
 * Collects what went into a release: the PRs merged since the previous tag, the issues they
 * close, and who contributed.
 *
 * Usage: bun scripts/collect-release-changes.js <previous-tag> <new-tag> <head-sha>
 *
 * Writes release-changes.json (read by generate-release-notes.js) and release-changes.md
 * (appended to the GitHub release body).
 */

const [, , previousTag, newTag, head] = process.argv
const token = process.env.GITHUB_TOKEN
const repository = process.env.GITHUB_REPOSITORY

if (!previousTag || !newTag || !head) {
	console.error('❌ Usage: collect-release-changes.js <previous-tag> <new-tag> <head-sha>')
	process.exit(1)
}

if (!token || !repository) {
	console.error('❌ GITHUB_TOKEN and GITHUB_REPOSITORY must be set')
	process.exit(1)
}

const [owner, name] = repository.split('/')

async function github(path, init = {}) {
	const res = await fetch(`https://api.github.com${path}`, {
		...init,
		headers: {
			Accept: 'application/vnd.github+json',
			Authorization: `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28',
			...init.headers,
		},
	})

	if (!res.ok) throw new Error(`GitHub ${path} returned ${res.status}: ${await res.text()}`)

	return res.json()
}

const isBot = (user) => !user || user.type === 'Bot' || user.login.endsWith('[bot]')

// Version bumps and merge commits say nothing about the release
const isNoise = (subject) => subject.startsWith('[skip actions]') || subject.startsWith('Merge ')

async function listCommits() {
	const commits = []

	for (let page = 1; ; page++) {
		const comparison = await github(
			`/repos/${repository}/compare/${previousTag}...${head}?per_page=100&page=${page}`,
		)
		commits.push(...comparison.commits)

		if (comparison.commits.length === 0 || commits.length >= comparison.total_commits) break
	}

	return commits
}

async function listClosingIssues(pullNumbers) {
	const issues = new Map()

	// GraphQL is the only API that exposes the issues a PR closes. Batch the PRs to keep it to a few calls.
	for (let i = 0; i < pullNumbers.length; i += 50) {
		const batch = pullNumbers.slice(i, i + 50)
		const fields = batch
			.map(
				(number) =>
					`pr${number}: pullRequest(number: ${number}) { closingIssuesReferences(first: 25) { nodes { number title url } } }`,
			)
			.join('\n')

		const { data, errors } = await github('/graphql', {
			method: 'POST',
			body: JSON.stringify({
				query: `query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { ${fields} } }`,
				variables: { owner, name },
			}),
		})

		if (errors) throw new Error(`GraphQL errors: ${JSON.stringify(errors)}`)

		for (const pull of Object.values(data.repository)) {
			for (const issue of pull?.closingIssuesReferences.nodes ?? [])
				issues.set(issue.number, issue)
		}
	}

	return [...issues.values()].sort((a, b) => a.number - b.number)
}

async function main() {
	const commits = await listCommits()

	const pulls = new Map()
	const looseCommits = []
	const contributors = new Set()

	for (const commit of commits) {
		const subject = commit.commit.message.split('\n')[0]
		if (isNoise(subject)) continue

		if (!isBot(commit.author)) contributors.add(commit.author.login)

		const associated = await github(`/repos/${repository}/commits/${commit.sha}/pulls`)
		const merged = associated.filter((pull) => pull.merged_at)

		if (merged.length === 0) looseCommits.push(subject)

		for (const pull of merged) {
			if (!isBot(pull.user)) contributors.add(pull.user.login)

			pulls.set(pull.number, {
				number: pull.number,
				title: pull.title,
				url: pull.html_url,
				author: pull.user.login,
			})
		}
	}

	const pullRequests = [...pulls.values()].sort((a, b) => a.number - b.number)
	const issues = await listClosingIssues(pullRequests.map((pull) => pull.number))

	const changes = {
		previousTag,
		pullRequests,
		issues,
		looseCommits,
		contributors: [...contributors].sort((a, b) => a.localeCompare(b)),
	}

	writeFileSync('release-changes.json', JSON.stringify(changes, null, 2), 'utf8')
	writeFileSync('release-changes.md', renderMarkdown(changes), 'utf8')

	console.log(
		`✅ ${pullRequests.length} PRs, ${issues.length} issues and ${changes.contributors.length} contributors since ${previousTag}`,
	)
}

function renderMarkdown({ pullRequests, issues, contributors }) {
	const sections = []

	if (issues.length > 0) {
		sections.push(
			[
				'## Issues addressed',
				...issues.map((issue) => `- ${issue.title} (#${issue.number})`),
			].join('\n'),
		)
	}

	if (pullRequests.length > 0) {
		sections.push(
			[
				'## Pull requests',
				...pullRequests.map(
					(pull) => `- ${pull.title} (#${pull.number}) by @${pull.author}`,
				),
			].join('\n'),
		)
	}

	if (contributors.length > 0) {
		const names = contributors.map((login) => `@${login}`)
		const list =
			names.length === 1
				? names[0]
				: `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

		sections.push(`## Contributors\n\nThank you to ${list} for contributing to this release!`)
	}

	sections.push(
		`**Full changelog:** https://github.com/${repository}/compare/${previousTag}...${newTag}`,
	)

	return sections.join('\n\n') + '\n'
}

main().catch((error) => {
	console.error('❌', error)
	process.exit(1)
})
