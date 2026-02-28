type Point = { x: number; y: number }

export const computePolygonCentroid = (points: Point[]) => {
  if (points.length === 0) return { x: 0, y: 0 }
  if (points.length < 3) {
    const sum = points.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 },
    )
    return { x: sum.x / points.length, y: sum.y / points.length }
  }

  let area = 0
  let cx = 0
  let cy = 0

  for (let i = 0; i < points.length; i += 1) {
    const p0 = points[i]
    const p1 = points[(i + 1) % points.length]
    const cross = p0.x * p1.y - p1.x * p0.y
    area += cross
    cx += (p0.x + p1.x) * cross
    cy += (p0.y + p1.y) * cross
  }

  if (area === 0) {
    return {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
    }
  }

  area *= 0.5
  return {
    x: cx / (6 * area),
    y: cy / (6 * area),
  }
}
