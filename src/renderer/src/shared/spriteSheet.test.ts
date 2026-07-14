import { describe, it, expect } from 'vitest'
import { computeGrid, gridSize, cellRefAt, normalizeCellRef, cellKey } from './spriteSheet'

describe('spriteSheet · computeGrid', () => {
  it('divide una hoja 64x64 en celdas 32x32 (4 celdas)', () => {
    const cells = computeGrid(64, 64, 32, 32)
    expect(cells).toHaveLength(4)
    expect(cells[0]).toEqual({ col: 0, row: 0, x: 0, y: 0, width: 32, height: 32 })
    expect(cells[3]).toEqual({ col: 1, row: 1, x: 32, y: 32, width: 32, height: 32 })
  })

  it('respeta margin y spacing', () => {
    const cells = computeGrid(70, 70, 32, 32, { margin: 2, spacing: 2 })
    // (70-2 margin) → celdas en x=2 y x=36 → 2 columnas
    expect(cells.filter((c) => c.row === 0)).toHaveLength(2)
    expect(cells[0]).toMatchObject({ x: 2, y: 2 })
    expect(cells[1]).toMatchObject({ x: 36, y: 2 })
  })

  it('devuelve [] si la hoja no tiene tamaño', () => {
    expect(computeGrid(0, 0, 32, 32)).toEqual([])
  })
})

describe('spriteSheet · gridSize', () => {
  it('cuenta columnas y filas', () => {
    expect(gridSize(96, 64, 32, 32)).toEqual({ cols: 3, rows: 2 })
  })
})

describe('spriteSheet · cellRefAt', () => {
  it('da la referencia de una celda concreta', () => {
    expect(cellRefAt(7, 96, 64, 32, 32, 2, 1)).toEqual({ sheetId: 7, x: 64, y: 32, width: 32, height: 32 })
  })
  it('null si está fuera de rango', () => {
    expect(cellRefAt(7, 96, 64, 32, 32, 3, 0)).toBeNull()
  })
})

describe('spriteSheet · normalizeCellRef / cellKey', () => {
  it('sanea una referencia válida', () => {
    expect(normalizeCellRef({ sheetId: '5', x: '10', y: '20', width: '32', height: '32' })).toEqual({
      sheetId: 5,
      x: 10,
      y: 20,
      width: 32,
      height: 32
    })
  })
  it('rechaza referencias inválidas', () => {
    expect(normalizeCellRef({ sheetId: 1, x: 0, y: 0, width: 0, height: 10 })).toBeNull()
    expect(normalizeCellRef({})).toBeNull()
  })
  it('cellKey es estable', () => {
    expect(cellKey({ sheetId: 5, x: 10, y: 20, width: 32, height: 32 })).toBe('5:10,20,32,32')
  })
})
