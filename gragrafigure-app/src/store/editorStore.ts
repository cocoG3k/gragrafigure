import { create } from 'zustand'
import type { ArrowType, ConnectionType, Line, ObjectShape, Vertex } from '../types'

type EditorState = {
  vertices: Record<string, Vertex>
  lines: Record<string, Line>
  objects: Record<string, ObjectShape>
  activeLineId: string | null
  draggingVertexId: string | null
  snapTargetId: string | null
  createVertex: (payload: { x: number; y: number; connectionType: ConnectionType }) => string
  createLine: (payload: {
    vertexIds: string[]
    strokeColor: string
    strokeWidth: number
  }) => string
  addVertexToLine: (payload: { lineId: string; vertexId: string; index: number }) => void
  moveVertex: (payload: { vertexId: string; x: number; y: number }) => void
  mergeVertices: (payload: { keptId: string; removedId: string }) => void
  setArrowType: (payload: { lineId: string; arrowType: ArrowType }) => void
  updateObjects: (payload: { objects: Record<string, ObjectShape> }) => void
  setConnectionType: (payload: { vertexId: string; connectionType: ConnectionType }) => void
  removeVertex: (payload: { vertexId: string }) => void
  removeLine: (payload: { lineId: string }) => void
  setActiveLine: (lineId: string | null) => void
  setDragging: (vertexId: string | null) => void
  setSnapTarget: (vertexId: string | null) => void
}

const createId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`

export const useEditorStore = create<EditorState>((set) => ({
  vertices: {},
  lines: {},
  objects: {},
  activeLineId: null,
  draggingVertexId: null,
  snapTargetId: null,
  createVertex: ({ x, y, connectionType }) => {
    const id = createId('v')
    set((state) => ({
      vertices: {
        ...state.vertices,
        [id]: { id, x, y, connectionType },
      },
    }))
    return id
  },
  createLine: ({ vertexIds, strokeColor, strokeWidth }) => {
    const id = createId('l')
    const line: Line = {
      id,
      type: 'line',
      vertexIds: [...vertexIds],
      strokeColor,
      strokeWidth,
      arrowType: 'none',
    }
    set((state) => ({
      lines: {
        ...state.lines,
        [id]: line,
      },
    }))
    return id
  },
  addVertexToLine: ({ lineId, vertexId, index }) => {
    set((state) => {
      const line = state.lines[lineId]
      if (!line) return state
      const nextIds = [...line.vertexIds]
      if (index < 0 || index >= nextIds.length) {
        nextIds.push(vertexId)
      } else {
        nextIds.splice(index, 0, vertexId)
      }
      return {
        lines: {
          ...state.lines,
          [lineId]: {
            ...line,
            vertexIds: nextIds,
          },
        },
      }
    })
  },
  moveVertex: ({ vertexId, x, y }) => {
    set((state) => {
      const vertex = state.vertices[vertexId]
      if (!vertex) return state
      return {
        vertices: {
          ...state.vertices,
          [vertexId]: { ...vertex, x, y },
        },
      }
    })
  },
  mergeVertices: ({ keptId, removedId }) => {
    if (keptId === removedId) return
    set((state) => {
      const kept = state.vertices[keptId]
      const removed = state.vertices[removedId]
      if (!kept || !removed) return state
      const mergedConnectionType =
        kept.connectionType === 'sharp' || removed.connectionType === 'sharp'
          ? 'sharp'
          : 'smooth'
      const nextVertices = { ...state.vertices }
      delete nextVertices[removedId]
      nextVertices[keptId] = {
        ...kept,
        connectionType: mergedConnectionType,
      }

      const nextLines = Object.fromEntries(
        Object.entries(state.lines).reduce<Array<[string, Line]>>(
          (acc, [id, line]) => {
            const replaced = line.vertexIds.map((vertexId) =>
              vertexId === removedId ? keptId : vertexId,
            )
            const deduped: string[] = []
            const seen = new Set<string>()
            for (const vertexId of replaced) {
              if (seen.has(vertexId)) continue
              seen.add(vertexId)
              if (deduped[deduped.length - 1] !== vertexId) {
                deduped.push(vertexId)
              }
            }
            if (deduped.length < 2) return acc
            acc.push([
              id,
              {
                ...line,
                vertexIds: deduped,
              },
            ])
            return acc
          },
          [],
        ),
      )
      const activeLineId =
        state.activeLineId && nextLines[state.activeLineId]
          ? state.activeLineId
          : null
      return {
        vertices: nextVertices,
        lines: nextLines,
        activeLineId,
        snapTargetId: null,
      }
    })
  },
  setArrowType: ({ lineId, arrowType }) => {
    set((state) => {
      const line = state.lines[lineId]
      if (!line) return state
      return {
        lines: {
          ...state.lines,
          [lineId]: {
            ...line,
            arrowType,
          },
        },
      }
    })
  },
  updateObjects: ({ objects }) => {
    set(() => ({ objects }))
  },
  setConnectionType: ({ vertexId, connectionType }) => {
    set((state) => {
      const vertex = state.vertices[vertexId]
      if (!vertex) return state
      return {
        vertices: {
          ...state.vertices,
          [vertexId]: { ...vertex, connectionType },
        },
      }
    })
  },
  removeVertex: ({ vertexId }) => {
    set((state) => {
      const { [vertexId]: removed, ...restVertices } = state.vertices
      if (!removed) return state
      const nextLines = Object.fromEntries(
        Object.entries(state.lines).reduce<Array<[string, Line]>>(
          (acc, [id, line]) => {
            const nextLine: Line = {
              ...line,
              vertexIds: line.vertexIds.filter((id) => id !== vertexId),
            }
            if (nextLine.vertexIds.length >= 2) {
              acc.push([id, nextLine])
            }
            return acc
          },
          [],
        ),
      )
      return {
        vertices: restVertices,
        lines: nextLines,
      }
    })
  },
  removeLine: ({ lineId }) => {
    set((state) => {
      const { [lineId]: removed, ...restLines } = state.lines
      if (!removed) return state
      return {
        lines: restLines,
        activeLineId: state.activeLineId === lineId ? null : state.activeLineId,
      }
    })
  },
  setActiveLine: (lineId) => {
    set(() => ({ activeLineId: lineId }))
  },
  setDragging: (vertexId) => {
    set(() => ({ draggingVertexId: vertexId }))
  },
  setSnapTarget: (vertexId) => {
    set(() => ({ snapTargetId: vertexId }))
  },
}))
