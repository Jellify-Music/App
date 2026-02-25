export default function buildYearsParam(yearMin?: number, yearMax?: number): string[] | undefined {
	if (yearMin == null && yearMax == null) return undefined
	const min = yearMin ?? 0
	const max = yearMax ?? new Date().getFullYear()
	if (min > max) return undefined
	const years: string[] = []
	for (let y = min; y <= max; y++) years.push(String(y))
	return years.length > 0 ? years : undefined
}
