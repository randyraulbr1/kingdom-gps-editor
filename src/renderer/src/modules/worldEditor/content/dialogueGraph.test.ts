import { describe, it, expect } from 'vitest'
import {
  buildLinearGraphFromLines,
  normalizeDialogueGraph,
  validateDialogueGraph,
  advanceDialogue,
  getStartNode,
  type DialogueGraph
} from './dialogueGraph'

describe('grafo de diálogo — migración desde líneas', () => {
  it('convierte líneas en un grafo lineal encadenado', () => {
    const graph = buildLinearGraphFromLines([
      { id: 'a', text: 'Hola' },
      { id: 'b', text: '¿Buscas trabajo?' }
    ])
    expect(graph.startNodeId).toBe('a')
    expect(graph.nodes).toHaveLength(2)
    expect(graph.nodes[0].options[0].nextNodeId).toBe('b')
    expect(graph.nodes[1].options[0].nextNodeId).toBeNull()
    expect(graph.nodes[1].options[0].effect).toBe('end')
  })

  it('normalizeDialogueGraph usa líneas antiguas si no hay grafo', () => {
    const graph = normalizeDialogueGraph(undefined, [{ text: 'Bienvenido' }])
    expect(graph.nodes).toHaveLength(1)
    expect(getStartNode(graph)?.text).toBe('Bienvenido')
  })

  it('normalizeDialogueGraph prefiere el grafo existente sobre las líneas', () => {
    const raw = { startNodeId: 'n1', nodes: [{ id: 'n1', text: 'Nodo', options: [] }] }
    const graph = normalizeDialogueGraph(raw, [{ text: 'ignorada' }])
    expect(graph.nodes).toHaveLength(1)
    expect(graph.nodes[0].text).toBe('Nodo')
  })

  it('corrige startNodeId inválido apuntando al primer nodo', () => {
    const raw = { startNodeId: 'inexistente', nodes: [{ id: 'n1', text: 'x', options: [] }] }
    expect(normalizeDialogueGraph(raw).startNodeId).toBe('n1')
  })
})

describe('grafo de diálogo — validación', () => {
  it('sin errores en un grafo lineal correcto', () => {
    const graph = buildLinearGraphFromLines([{ text: 'a' }, { text: 'b' }])
    expect(validateDialogueGraph(graph)).toHaveLength(0)
  })

  it('detecta enlace roto (opción a nodo borrado)', () => {
    const graph: DialogueGraph = {
      startNodeId: 'n1',
      nodes: [{ id: 'n1', text: 'Hola', options: [{ id: 'o1', label: 'Ir', nextNodeId: 'borrado', effect: 'none' }] }]
    }
    const errors = validateDialogueGraph(graph)
    expect(errors.some((e) => e.code === 'broken_link')).toBe(true)
  })

  it('detecta texto vacío y falta de nodo inicial', () => {
    const graph: DialogueGraph = { startNodeId: 'x', nodes: [{ id: 'n1', text: '  ', options: [] }] }
    const codes = validateDialogueGraph(graph).map((e) => e.code)
    expect(codes).toContain('empty_text')
    expect(codes).toContain('no_start')
  })
})

describe('grafo de diálogo — recorrido', () => {
  it('avanza al nodo destino y devuelve el efecto', () => {
    const graph: DialogueGraph = {
      startNodeId: 'n1',
      nodes: [
        { id: 'n1', text: 'Hola', options: [{ id: 'o1', label: 'Misión', nextNodeId: 'n2', effect: 'start_quest' }] },
        { id: 'n2', text: 'Suerte', options: [{ id: 'o2', label: 'Cerrar', nextNodeId: null, effect: 'end' }] }
      ]
    }
    const step = advanceDialogue(graph, 'o1')
    expect(step?.nextNode?.id).toBe('n2')
    expect(step?.effect).toBe('start_quest')
    const end = advanceDialogue(graph, 'o2')
    expect(end?.nextNode).toBeNull()
    expect(end?.effect).toBe('end')
  })

  it('devuelve null para una opción inexistente', () => {
    const graph = buildLinearGraphFromLines([{ text: 'a' }])
    expect(advanceDialogue(graph, 'no-existe')).toBeNull()
  })
})
