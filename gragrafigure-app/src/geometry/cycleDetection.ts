import type { Line, ObjectShape, Vertex } from '../types'

type Edge = { a: string; b: string }

const buildEdges = (lines: Record<string, Line>): Edge[] => {
  const edges: Edge[] = []
  const seen = new Set<string>()
  Object.values(lines).forEach((line) => {
    for (let i = 0; i < line.vertexIds.length - 1; i += 1) {
      const a = line.vertexIds[i]
      const b = line.vertexIds[i + 1]
      const key = a < b ? `${a}|${b}` : `${b}|${a}`
      if (seen.has(key)) continue
      seen.add(key)
      edges.push({ a, b })
    }
  })
  return edges
}

const buildAdjacency = (edges: Edge[]) => {
  const adjacency = new Map<string, Set<string>>()
  edges.forEach(({ a, b }) => {
    if (!adjacency.has(a)) adjacency.set(a, new Set())
    if (!adjacency.has(b)) adjacency.set(b, new Set())
    adjacency.get(a)!.add(b)
    adjacency.get(b)!.add(a)
  })
  return adjacency
}

const shortestPath = (
  adjacency: Map<string, Set<string>>,
  start: string,
  goal: string,
  blocked: Edge,
) => {
  const queue: string[] = [start]
  const prev = new Map<string, string | null>()
  prev.set(start, null)

  while (queue.length) {
    const current = queue.shift()!
    if (current === goal) break
    const neighbors = adjacency.get(current)
    if (!neighbors) continue
    neighbors.forEach((neighbor) => {
      if (
        (current === blocked.a && neighbor === blocked.b) ||
        (current === blocked.b && neighbor === blocked.a)
      ) {
        return
      }
      if (!prev.has(neighbor)) {
        prev.set(neighbor, current)
        queue.push(neighbor)
      }
    })
  }

  if (!prev.has(goal)) return null
  const path: string[] = []
  let current: string | null = goal
  while (current) {
    path.unshift(current)
    current = prev.get(current) ?? null
  }
  return path
}

const normalizeCycle = (cycle: string[]) => {
  if (cycle.length === 0) return ''
  const rotate = (arr: string[], startIndex: number) =>
    arr.slice(startIndex).concat(arr.slice(0, startIndex))
  const minRotation = (arr: string[]) => {
    let best = rotate(arr, 0)
    for (let i = 1; i < arr.length; i += 1) {
      const candidate = rotate(arr, i)
      if (candidate.join('|') < best.join('|')) {
        best = candidate
      }
    }
    return best
  }

  const forward = minRotation(cycle)
  const backward = minRotation([...cycle].reverse())
  const forwardKey = forward.join('|')
  const backwardKey = backward.join('|')
  return forwardKey < backwardKey ? forwardKey : backwardKey
}

const hashKey = (value: string) => {
  let hash = 5381
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i)
  }
  return Math.abs(hash).toString(36)
}

export const computeObjectShapes = (
  vertices: Record<string, Vertex>,
  lines: Record<string, Line>,
): Record<string, ObjectShape> => {
  const edges = buildEdges(lines)
  const adjacency = buildAdjacency(edges)
  const cycleMap = new Map<string, string[]>()

  edges.forEach((edge) => {
    const path = shortestPath(adjacency, edge.a, edge.b, edge)
    if (!path || path.length < 2) return
    const cycle = [...path]
    if (cycle.length < 3) return
    if (cycle.some((id) => !vertices[id])) return
    const key = normalizeCycle(cycle)
    if (!key) return
    if (!cycleMap.has(key)) {
      cycleMap.set(key, cycle)
    }
  })

  const objects: Record<string, ObjectShape> = {}
  cycleMap.forEach((cycle, key) => {
    const id = `o_${hashKey(key)}`
    objects[id] = {
      id,
      type: 'object',
      vertexIds: cycle,
      fillColor: '#fde68a',
      text: '',
    }
  })

  return objects
}
