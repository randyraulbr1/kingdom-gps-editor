import { describe, it, expect } from 'vitest'
import { buildPreviewHtml, getPreset, SNIPPET_PRESETS } from './playground'

describe('playground de códigos', () => {
  it('hay presets de inventario, barras y amigos', () => {
    const ids = SNIPPET_PRESETS.map((s) => s.id)
    expect(ids).toContain('inventory')
    expect(ids).toContain('bars')
    expect(ids).toContain('friends')
  })

  it('getPreset devuelve el snippet por id', () => {
    expect(getPreset('bars')?.name).toBe('Barras de vida, hambre y XP')
    expect(getPreset('inexistente')).toBeUndefined()
  })

  it('buildPreviewHtml inserta html, css y js en un documento completo', () => {
    const doc = buildPreviewHtml({ html: '<div id="x">hola</div>', css: '#x{color:red}', js: 'console.log(1)' })
    expect(doc).toContain('<!doctype html>')
    expect(doc).toContain('<div id="x">hola</div>')
    expect(doc).toContain('#x{color:red}')
    expect(doc).toContain('console.log(1)')
  })

  it('el js va envuelto en try/catch para no romper la vista previa', () => {
    const doc = buildPreviewHtml({ html: '', css: '', js: 'throw new Error("x")' })
    expect(doc).toContain('try {')
    expect(doc).toContain('catch')
  })
})
