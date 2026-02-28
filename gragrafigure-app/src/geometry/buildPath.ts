import type { Line, Vertex } from '../types'
import type { Point } from './types'

const reflectPoint = (origin: Point, target: Point): Point => ({
  x: 2 * origin.x - target.x,
  y: 2 * origin.y - target.y,
})

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

const catmullRomToBezier = (p0: Point, p1: Point, p2: Point, p3: Point) => {
  const alpha = 0.5
  const d01 = Math.pow(distance(p0, p1), alpha)
  const d12 = Math.pow(distance(p1, p2), alpha)
  const d23 = Math.pow(distance(p2, p3), alpha)

  const b1 = d01 === 0 ? 0 : d12 === 0 ? 0 : (d12 / (d01 + d12))
  const b2 = d23 === 0 ? 0 : d12 === 0 ? 0 : (d12 / (d12 + d23))

  const c1 = {
    x: p2.x + (p1.x - p3.x) * b2,
    y: p2.y + (p1.y - p3.y) * b2,
  }
  const c0 = {
    x: p1.x + (p2.x - p0.x) * b1,
    y: p1.y + (p2.y - p0.y) * b1,
  }

  const ctrl1 = {
    x: p1.x + (c0.x - p1.x) / 3,
    y: p1.y + (c0.y - p1.y) / 3,
  }
  const ctrl2 = {
    x: p2.x - (p2.x - c1.x) / 3,
    y: p2.y - (p2.y - c1.y) / 3,
  }

  return { ctrl1, ctrl2 }
}

const buildSegmentPath = (points: Point[]) => {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
  }

  const path: string[] = []
  for (let i = 0; i < points.length - 1; i += 1) {
    const p1 = points[i]
    const p2 = points[i + 1]
    const p0 = i === 0 ? reflectPoint(p1, p2) : points[i - 1]
    const p3 = i + 2 < points.length ? points[i + 2] : reflectPoint(p2, p1)
    const { ctrl1, ctrl2 } = catmullRomToBezier(p0, p1, p2, p3)

    if (i === 0) {
      path.push(`M ${p1.x} ${p1.y}`)
    }
    path.push(
      `C ${ctrl1.x} ${ctrl1.y} ${ctrl2.x} ${ctrl2.y} ${p2.x} ${p2.y}`,
    )
  }
  return path.join(' ')
}

export const buildPath = (line: Line, vertices: Record<string, Vertex>) => {
  const resolved = line.vertexIds
    .map((id) => vertices[id])
    .filter(Boolean)

  if (resolved.length < 2) return ''

  const segments: Point[][] = []
  let current: Point[] = []

  resolved.forEach((vertex, index) => {
    current.push({ x: vertex.x, y: vertex.y })
    if (vertex.connectionType === 'sharp' && index !== resolved.length - 1) {
      segments.push(current)
      current = [{ x: vertex.x, y: vertex.y }]
    }
  })

  if (current.length) {
    segments.push(current)
  }

  return segments.map((segment) => buildSegmentPath(segment)).join(' ')
}

export const buildArrowTangents = (
  line: Line,
  vertices: Record<string, Vertex>,
): { start: Point | null; end: Point | null } => {
  const resolved = line.vertexIds
    .map((id) => vertices[id])
    .filter(Boolean)

  if (resolved.length < 2) {
    return { start: null, end: null }
  }

  const start = {
    x: resolved[1].x - resolved[0].x,
    y: resolved[1].y - resolved[0].y,
  }
  const end = {
    x: resolved[resolved.length - 1].x - resolved[resolved.length - 2].x,
    y: resolved[resolved.length - 1].y - resolved[resolved.length - 2].y,
  }
  return { start, end }
}
