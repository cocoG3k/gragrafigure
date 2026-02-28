import { useEffect, useMemo, useRef } from 'react'
import type { ChangeEvent, PointerEvent } from 'react'
import { useEditorStore } from './store/editorStore'
import { buildPath } from './geometry/buildPath'
import { computeArrowOffsets } from './geometry/arrowMarkers'
import { computeObjectShapes } from './geometry/cycleDetection'
import { computePolygonCentroid } from './geometry/centroid'
import type { ArrowType, Vertex } from './types'

function App() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const vertices = useEditorStore((state) => state.vertices)
  const lines = useEditorStore((state) => state.lines)
  const objects = useEditorStore((state) => state.objects)
  const activeLineId = useEditorStore((state) => state.activeLineId)
  const createVertex = useEditorStore((state) => state.createVertex)
  const createLine = useEditorStore((state) => state.createLine)
  const addVertexToLine = useEditorStore((state) => state.addVertexToLine)
  const moveVertex = useEditorStore((state) => state.moveVertex)
  const mergeVertices = useEditorStore((state) => state.mergeVertices)
  const setConnectionType = useEditorStore((state) => state.setConnectionType)
  const setActiveLine = useEditorStore((state) => state.setActiveLine)
  const setDragging = useEditorStore((state) => state.setDragging)
  const draggingVertexId = useEditorStore((state) => state.draggingVertexId)
  const snapTargetId = useEditorStore((state) => state.snapTargetId)
  const setSnapTarget = useEditorStore((state) => state.setSnapTarget)
  const setArrowType = useEditorStore((state) => state.setArrowType)
  const updateObjects = useEditorStore((state) => state.updateObjects)

  const SNAP_THRESHOLD = 16

  const renderLines = useMemo(() => {
    return Object.values(lines).map((line) => {
      const path = buildPath(line, vertices)
      const offsets = computeArrowOffsets(line, lines)
      return { line, path, offsets }
    })
  }, [lines, vertices])

  useEffect(() => {
    const nextObjects = computeObjectShapes(vertices, lines)
    updateObjects({ objects: nextObjects })
  }, [lines, updateObjects, vertices])

  const getSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const handleCanvasPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    const { x, y } = getSvgPoint(event.clientX, event.clientY)
    const vertexId = createVertex({ x, y, connectionType: 'smooth' })

    if (!activeLineId) {
      const lineId = createLine({
        vertexIds: [vertexId],
        strokeColor: '#0b1020',
        strokeWidth: 3,
      })
      setActiveLine(lineId)
    } else {
      addVertexToLine({ lineId: activeLineId, vertexId, index: -1 })
    }
  }

  const handleVertexPointerDown = (
    event: PointerEvent<SVGCircleElement>,
    vertex: Vertex,
  ) => {
    event.stopPropagation()
    if (event.shiftKey) {
      setConnectionType({
        vertexId: vertex.id,
        connectionType: vertex.connectionType === 'sharp' ? 'smooth' : 'sharp',
      })
      return
    }
    svgRef.current?.setPointerCapture(event.pointerId)
    setDragging(vertex.id)
  }

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!draggingVertexId) return
    const { x, y } = getSvgPoint(event.clientX, event.clientY)
    moveVertex({ vertexId: draggingVertexId, x, y })

    const target = Object.values(vertices).find((vertex) => {
      if (vertex.id === draggingVertexId) return false
      const dx = vertex.x - x
      const dy = vertex.y - y
      return Math.hypot(dx, dy) <= SNAP_THRESHOLD
    })
    setSnapTarget(target ? target.id : null)
  }

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    if (!draggingVertexId) return
    svgRef.current?.releasePointerCapture(event.pointerId)
    setDragging(null)
    if (snapTargetId) {
      mergeVertices({ keptId: snapTargetId, removedId: draggingVertexId })
    }
    setSnapTarget(null)
  }

  const activeLine = activeLineId ? lines[activeLineId] : null
  const activeLineVertices = activeLine
    ? activeLine.vertexIds.map((id) => vertices[id]).filter(Boolean)
    : []

  const handleArrowChange = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!activeLineId) return
    setArrowType({ lineId: activeLineId, arrowType: event.target.value as ArrowType })
  }

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Topology Graph Editor</h1>
          <p>
            Click to add vertices. Drag vertices to move. Each click adds points to the
            current line.
          </p>
        </div>
        <div className="app__stats">
          <div>
            <span>Vertices</span>
            <strong>{Object.keys(vertices).length}</strong>
          </div>
          <div>
            <span>Lines</span>
            <strong>{Object.keys(lines).length}</strong>
          </div>
        </div>
      </header>
      <main className="app__main">
        <svg
          ref={svgRef}
          className="editor"
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <defs>
            {renderLines.map(({ line, offsets }) => {
              const baseRefX = 9
              const startRefX = Math.max(0, baseRefX + offsets.startOffset)
              const endRefX = Math.max(0, baseRefX + offsets.endOffset)
              return (
                <g key={`marker-${line.id}`}>
                  <marker
                    id={`arrowhead-${line.id}-start`}
                    markerWidth="10"
                    markerHeight="7"
                    refX={startRefX}
                    refY="3.5"
                    orient="auto"
                    markerUnits="strokeWidth"
                    overflow="visible"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill={line.strokeColor} />
                  </marker>
                  <marker
                    id={`arrowhead-${line.id}-end`}
                    markerWidth="10"
                    markerHeight="7"
                    refX={endRefX}
                    refY="3.5"
                    orient="auto"
                    markerUnits="strokeWidth"
                    overflow="visible"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill={line.strokeColor} />
                  </marker>
                </g>
              )
            })}
            <linearGradient id="gridGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f5f7ff" />
              <stop offset="100%" stopColor="#fef1e8" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridGradient)" />
          <g className="grid">
            {Array.from({ length: 24 }).map((_, index) => (
              <line key={`h-${index}`} x1={0} y1={index * 40} x2="100%" y2={index * 40} />
            ))}
            {Array.from({ length: 24 }).map((_, index) => (
              <line key={`v-${index}`} x1={index * 40} y1={0} x2={index * 40} y2="100%" />
            ))}
          </g>
          {Object.values(objects).map((object) => {
            const points = object.vertexIds
              .map((id) => vertices[id])
              .filter(Boolean)
              .map((vertex) => ({ x: vertex.x, y: vertex.y }))
            if (points.length < 3) return null
            const centroid = computePolygonCentroid(points)
            const path = `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')} Z`
            return (
              <g key={object.id}>
                <path d={path} fill={object.fillColor} opacity={0.45} stroke="#eab308" />
                {object.text && (
                  <text x={centroid.x} y={centroid.y} textAnchor="middle">
                    {object.text}
                  </text>
                )}
              </g>
            )
          })}
          {renderLines.map(({ line, path }) => {
            const markerStart =
              line.arrowType === 'backward' || line.arrowType === 'both'
                ? `url(#arrowhead-${line.id}-start)`
                : undefined
            const markerEnd =
              line.arrowType === 'forward' || line.arrowType === 'both'
                ? `url(#arrowhead-${line.id}-end)`
                : undefined
            return (
              <path
                key={line.id}
                d={path}
                fill="none"
                stroke={line.strokeColor}
                strokeWidth={line.strokeWidth}
                strokeDasharray={line.strokeDasharray}
                strokeLinecap="round"
                strokeLinejoin="round"
                markerStart={markerStart}
                markerEnd={markerEnd}
              />
            )
          })}
          {Object.values(objects).map((object) => {
            const points = object.vertexIds
              .map((id) => vertices[id])
              .filter(Boolean)
              .map((vertex) => ({ x: vertex.x, y: vertex.y }))
            if (points.length < 3) return null
            const centroid = computePolygonCentroid(points)
            const path = `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')} Z`
            return (
              <g key={object.id}>
                <path d={path} fill={object.fillColor} opacity={0.45} stroke="#eab308" />
                {object.text && (
                  <text x={centroid.x} y={centroid.y} textAnchor="middle">
                    {object.text}
                  </text>
                )}
              </g>
            )
          })}
          {Object.values(vertices).map((vertex) => (
            <circle
              key={vertex.id}
              className="vertex"
              cx={vertex.x}
              cy={vertex.y}
              r={6}
              onPointerDown={(event) => handleVertexPointerDown(event, vertex)}
            />
          ))}
          {snapTargetId && vertices[snapTargetId] && (
            <circle
              className="vertex vertex--ghost"
              cx={vertices[snapTargetId].x}
              cy={vertices[snapTargetId].y}
              r={12}
            />
          )}
          {activeLineVertices.length > 1 && (
            <polyline
              points={activeLineVertices.map((v) => `${v.x},${v.y}`).join(' ')}
              fill="none"
              stroke="#c06a4a"
              strokeWidth={1.5}
              strokeDasharray="4 6"
              opacity={0.8}
            />
          )}
        </svg>
        <aside className="app__panel">
          <h2>Line Builder</h2>
          <p>
            Active line continues until you refresh. Snapping merges nearby vertices.
          </p>
          <div className="app__panel-section">
            <span>Shift + click vertex</span>
            <strong>Toggle sharp/smooth</strong>
          </div>
          {activeLine ? (
            <div className="app__panel-section">
              <span>Active line</span>
              <strong>{activeLine.vertexIds.length} vertices</strong>
            </div>
          ) : (
            <div className="app__panel-section">
              <span>No active line</span>
              <strong>Click canvas to start</strong>
            </div>
          )}
          {activeLine && (
            <div className="app__panel-section">
              <span>Arrow direction</span>
              <select
                className="app__select"
                value={activeLine.arrowType}
                onChange={handleArrowChange}
              >
                <option value="none">None</option>
                <option value="forward">Forward</option>
                <option value="backward">Backward</option>
                <option value="both">Both</option>
              </select>
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}

export default App
