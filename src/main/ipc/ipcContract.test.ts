import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '../../..')

function extract(filePath: string, pattern: RegExp): string[] {
  const content = readFileSync(filePath, 'utf-8')
  return [...content.matchAll(pattern)].map((match) => match[1])
}

/**
 * Static consistency check between the preload's `window.api` surface and
 * the channels registered in main/ipc/handlers - catches a renamed/typo'd
 * channel on either side without needing to boot a real Electron process.
 */
describe('IPC contract', () => {
  it('every channel invoked from the preload has exactly one matching main handler', () => {
    const preloadPath = path.join(ROOT, 'src/preload/index.ts')
    const invoked = new Set(extract(preloadPath, /ipcRenderer\.invoke\(\s*'([^']+)'/g))

    const handlersDir = path.join(ROOT, 'src/main/ipc/handlers')
    const registered = new Set<string>()
    for (const file of readdirSync(handlersDir)) {
      const filePath = path.join(handlersDir, file)
      for (const channel of extract(filePath, /ipcMain\.handle\(\s*'([^']+)'/g)) {
        registered.add(channel)
      }
    }

    expect(invoked.size).toBeGreaterThan(0)
    expect([...invoked].sort()).toEqual([...registered].sort())
  })
})
