export type ConnectionType = 'sharp' | 'smooth'

export type ArrowType = 'none' | 'forward' | 'backward' | 'both'

export interface Vertex {
  id: string
  x: number
  y: number
  connectionType: ConnectionType
}

export interface Line {
  id: string
  type: 'line'
  vertexIds: string[]
  strokeColor: string
  strokeWidth: number
  strokeDasharray?: string
  arrowType: ArrowType
}

export interface ObjectShape {
  id: string
  type: 'object'
  vertexIds: string[]
  fillColor: string
  text: string
}
