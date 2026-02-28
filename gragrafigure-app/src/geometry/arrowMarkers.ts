import type { Line } from '../types'

export type ArrowOffsets = {
  startOffset: number
  endOffset: number
}

const getVertexDegree = (vertexId: string, lines: Record<string, Line>) => {
  let degree = 0
  Object.values(lines).forEach((line) => {
    if (line.vertexIds.includes(vertexId)) {
      degree += 1
    }
  })
  return degree
}

const getLineIndexAtVertex = (vertexId: string, lineId: string, lines: Record<string, Line>) => {
  const related = Object.values(lines)
    .filter((line) => line.vertexIds.includes(vertexId))
    .map((line) => line.id)
    .sort()
  return related.indexOf(lineId)
}

export const computeArrowOffsets = (line: Line, lines: Record<string, Line>): ArrowOffsets => {
  if (line.vertexIds.length < 2) {
    return { startOffset: 0, endOffset: 0 }
  }

  const startId = line.vertexIds[0]
  const endId = line.vertexIds[line.vertexIds.length - 1]
  const startDegree = getVertexDegree(startId, lines)
  const endDegree = getVertexDegree(endId, lines)

  const baseOffset = line.strokeWidth * 1.0
  const computeOffset = (vertexId: string, degree: number) => {
    if (degree <= 1) return 0
    const index = getLineIndexAtVertex(vertexId, line.id, lines)
    const mid = (degree - 1) / 2
    return (index - mid) * baseOffset
  }

  return {
    startOffset: computeOffset(startId, startDegree),
    endOffset: computeOffset(endId, endDegree),
  }
}

export const buildArrowTransform = (tangent: { x: number; y: number } | null, offset: number) => {
  if (!tangent) return undefined
  const angle = Math.atan2(tangent.y, tangent.x)
  const degrees = (angle * 180) / Math.PI
  return `rotate(${degrees}) translate(${offset} 0)`
}
