import * as THREE from 'three'

/** Abgerundetes Rechteck als 2D-Shape (Basis für die extrudierte Heft-Geometrie). */
function roundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const w = width / 2
  const h = height / 2
  const shape = new THREE.Shape()
  shape.moveTo(-w + radius, -h)
  shape.lineTo(w - radius, -h)
  shape.quadraticCurveTo(w, -h, w, -h + radius)
  shape.lineTo(w, h - radius)
  shape.quadraticCurveTo(w, h, w - radius, h)
  shape.lineTo(-w + radius, h)
  shape.quadraticCurveTo(-w, h, -w, h - radius)
  shape.lineTo(-w, -h + radius)
  shape.quadraticCurveTo(-w, -h, -w + radius, -h)
  return shape
}

export function createHandleGeometry(width: number, height: number, depth: number, radius: number): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(roundedRectShape(width, height, radius), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 6,
    curveSegments: 16,
  })
  geometry.translate(0, 0, -depth / 2)
  return geometry
}

/** Klingen-Shape: schmales Ende am Scharnier, spitz zulaufend zur Spitze. Verläuft entlang +Y. */
function bladeShape(length: number, width: number): THREE.Shape {
  const hw = width / 2
  const shape = new THREE.Shape()
  shape.moveTo(-hw * 0.45, 0)
  shape.lineTo(hw * 0.45, 0)
  shape.lineTo(hw * 0.5, length * 0.18)
  shape.lineTo(hw * 0.5, length * 0.8)
  shape.lineTo(0, length)
  shape.lineTo(-hw * 0.5, length * 0.8)
  shape.lineTo(-hw * 0.5, length * 0.18)
  shape.closePath()
  return shape
}

export function createBladeGeometry(length: number, width: number, depth: number): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(bladeShape(length, width), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
    curveSegments: 8,
  })
  geometry.translate(0, 0, -depth / 2)
  return geometry
}

/** Klassische Ease-Out-Back-Kurve — leichtes Überschwingen, wie ein einrastendes Scharnier. */
export function easeOutBack(x: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2
}
