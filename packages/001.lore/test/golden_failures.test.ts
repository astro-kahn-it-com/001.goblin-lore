import { describe, it, expect } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import { compileLoreInstance } from '../src/compiler.js'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('Golden-File Negative Control Gauntlet (Pass 1 & Pass 2)', () => {
  const failureFixturesDir = path.resolve(
    __dirname,
    'fixtures/failures',
  )
  const failureCases = fs
    .readdirSync(failureFixturesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  for (const testCase of failureCases) {
    it(`fails closed on static fixture: ${testCase}`, () => {
      const caseDir = path.join(failureFixturesDir, testCase)
      const expectedErrorFile = path.join(caseDir, 'expected_error.json')

      expect(fs.existsSync(expectedErrorFile)).toBe(true)
      const expected = JSON.parse(fs.readFileSync(expectedErrorFile, 'utf-8'))

      const dummyCompiledRoot = path.join(caseDir, 'compiled')

      // Assert compilation halts closed with the exact expected error message
      expect(() =>
        compileLoreInstance({
          instanceDir: caseDir,
          compiledRootDir: dummyCompiledRoot,
          seriesSlug: testCase,
        }),
      ).toThrow(new RegExp(expected.expected_message_regex))

      // Assert Zero-Emission Invariant / Deletion Principle:
      // A failed compilation pass MUST NEVER write partial state or output directories to disk
      expect(fs.existsSync(dummyCompiledRoot)).toBe(false)
    })
  }
})
