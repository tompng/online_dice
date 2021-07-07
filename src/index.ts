const canvas = document.createElement('canvas')
const SIZE = 512
canvas.width = canvas.height = SIZE
document.body.appendChild(canvas)
class Vector3 {
  constructor(public x: number, public y: number, public z: number) { }
  clone() {
    return new Vector3(this.x, this.y, this.z)
  }
  mult(a: number) {
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
}

type Matrix3Element = [number, number, number, number, number, number, number, number, number]
class Matrix3 {
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

function randomDirection() {
  const z = 2 * Math.random() - 1
  const r = Math.sqrt(1 - z * z)
  const th = 2 * Math.PI * Math.random()
  return new Vector3(r * Math.cos(th), r * Math.sin(th), z)
}

class Cube {
  position: Vector3
  velocity: Vector3
  rotation: Matrix3
  momentum: Vector3
  size = 1
  constructor(position: Vector3) {
    this.position = position
    this.rotation = Matrix3.fromRotation(randomDirection(), 2 * Math.PI * Math.random())
    // this.velocity = randomDirection()
    // this.momentum = randomDirection()
    this.velocity = new Vector3(0, 0, 0)
    this.momentum = new Vector3(1, 0, 0)
  }

  update(dt: number) {
    this.position = Vector3.wsum(1, this.position, dt , this.velocity)
    const w = Matrix3.fromRotation(this.momentum, this.momentum.length() * dt)
    this.rotation = w.mult(this.rotation)
  }



  render(ctx: CanvasRenderingContext2D) {
    const coords = [...new Array(8)].map((_, i) =>
      new Vector3(
        ((i & 1) * 2 - 1),
        (((i >> 1) & 1) * 2 - 1),
        (((i >> 2) & 1) * 2 - 1)
      )
    )
    ctx.beginPath()
    coords.forEach(p => {
      coords.forEach(q => {
        if (Vector3.distance(p, q) != 2) return
        const [tp, tq] = [p, q].map(
          point => Vector3.wsum(1, this.position, this.size, this.rotation.transform(point))
        )
        const ps = 1 / (1 + 0.1 * tp.y)
        const qs = 1 / (1 + 0.1 * tq.y)
        ctx.moveTo(tp.x * ps, tp.z * ps)
        ctx.lineTo(tq.x * qs, tq.z * qs)
      })
    })
    ctx.stroke()
  }
}

function assignGlobal(data: Record<string, any>) {
  for (const key in data) {
    ;(window as any)[key] = data[key]
  }
}

assignGlobal({ Matrix3, Vector3 })

const cube = new Cube(new Vector3(0, 0, 0))
const ctx = canvas.getContext('2d')!
setInterval(() => {
  cube.update(0.1)
  ctx.clearRect(0, 0, SIZE, SIZE)
  ctx.save()
  ctx.translate(SIZE / 2, SIZE / 2)
  ctx.lineWidth = 0.001
  ctx.scale(SIZE / 4, SIZE / 4)
  cube.render(ctx)
  ctx.restore()
}, 100)


assignGlobal({ cube })
