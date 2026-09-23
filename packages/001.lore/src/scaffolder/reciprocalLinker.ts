import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export function reconcileReciprocalSpatialLinks(
    newLocationId: string,
    adjacentLocationIds: string[],
    locationsDir: string,
): string[] {
    const updatedFiles: string[] = []

    if (!fs.existsSync(locationsDir)) {
        return updatedFiles
    }

    const files = fs
        .readdirSync(locationsDir)
        .filter((f) => f.endsWith('.md') && !f.startsWith('_'))

    for (const file of files) {
        const fullPath = path.join(locationsDir, file)
        const rawContent = fs.readFileSync(fullPath, 'utf-8')

        if (!rawContent.startsWith('---')) continue

        const parsed = matter(rawContent)
        const targetId = parsed.data.id

        if (adjacentLocationIds.includes(targetId)) {
            const existingAdjacencies: string[] =
                parsed.data.adjacent_locations || []

            if (!existingAdjacencies.includes(newLocationId)) {
                existingAdjacencies.push(newLocationId)
                parsed.data.adjacent_locations = existingAdjacencies

                const stringified = matter.stringify(
                    parsed.content,
                    parsed.data,
                )
                const normalized = stringified.startsWith('---')
                    ? stringified
                    : `---\n${stringified}`

                const tmpPath = `${fullPath}.tmp_${Date.now()}`
                fs.writeFileSync(tmpPath, normalized, 'utf-8')
                fs.renameSync(tmpPath, fullPath)

                updatedFiles.push(targetId)
            }
        }
    }

    return updatedFiles
}
