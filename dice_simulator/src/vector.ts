export class Vector3 {
  constructor(public x: number, public y: number, public z: number) { }
  clone() {
    return new Vector3(this.x, this.y, this.z)
  }
  scale(a: number) {
    return new Vector3(a * this.x, a * this.y, a * this.z)
  }
  length() {
    return Math.hypot(this.x, this.y, this.z)
  }
  normalize() {
    const r = this.length()
    return new Vector3(this.x / r, this.y / r, this.z / r)
  }
  static dot(va: Vector3, vb: Vector3) {
    return va.x * vb.x + va.y * vb.y + va.z * vb.z
  }
  static cross(va: Vector3, vb: Vector3) {
    return new Vector3(
      va.y * vb.z - va.z * vb.y,
      va.z * vb.x - va.x * vb.z,
      va.x * vb.y - va.y * vb.x
    )
  }
  static distance(va: Vector3, vb: Vector3) {
    return Math.hypot(va.x - vb.x, va.y - vb.y, va.z - vb.z)
  }
  static wsum(a: number, va: Vector3, b: number, vb: Vector3) {
    return new Vector3(
      a * va.x + b * vb.x,
      a * va.y + b * vb.y,
      a * va.z + b * vb.z
    )
  }
  static add(va: Vector3, vb: Vector3) {
    return this.wsum(1, va, 1, vb)
  }
  static sub(va: Vector3, vb: Vector3) {
    return this.wsum(1, va, -1, vb)
  }
}

type Matrix3Element = [number, number, number, number, number, number, number, number, number]

export class Matrix3 {
  elements: Matrix3Element
  constructor(data?: Matrix3Element) {
    this.elements = data ?? [1, 0, 0, 0, 1, 0, 0, 0, 1]
  }
  clone() {
    return new Matrix3([...this.elements])
  }
  transform(v: Vector3) {
    const e = this.elements
    return new Vector3(
      v.x * e[0] + v.y * e[1] + v.z * e[2],
      v.x * e[3] + v.y * e[4] + v.z * e[5],
      v.x * e[6] + v.y * e[7] + v.z * e[8]
    )
  }
  mult(m: Matrix3) {
    const out = new Matrix3()
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        let sum = 0
        for (let k = 0; k < 3; k++) {
          sum += this.elements[3 * i + k] * m.elements[3 * k + j]
        }
        out.elements[3 * i + j] = sum
      }
    }
    return out
  }
  add(m: Matrix3) {
    const out = new Matrix3()
    for (let i = 0; i < 9; i++) {
      out.elements[i] = this.elements[i] + m.elements[i]
    }
    return out
  }
  static fromRotation(axis: Vector3, theta?: number) {
    const r = Math.hypot(axis.x, axis.y, axis.z)
    const th = theta ?? r
    if (th === 0) return new Matrix3()
    const cos = Math.cos(th)
    const sin = Math.sin(th)
    const nx = axis.x / r
    const ny = axis.y / r
    const nz = axis.z / r
    const cc = 1 - cos
    const xy = nx * ny * cc
    const yz = ny * nz * cc
    const zx = nz * nx * cc
    return new Matrix3([
      nx * nx * cc + cos, xy - nz * sin, zx + ny * sin,
      xy + nz * sin, ny * ny * cc + cos, yz - nx * sin,
      zx - ny * sin, yz + nx * sin, nz * nz * cc + cos
    ])
  }
}

export function randomDirection(l = 1) {
  const z = 2 * Math.random() - 1
  const r = Math.sqrt(1 - z * z)
  const th = 2 * Math.PI * Math.random()
  return new Vector3(l * r * Math.cos(th), l * r * Math.sin(th), l * z)
}
