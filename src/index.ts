import { CompressedTexture } from "three"

const canvas = document.createElement('canvas')
const SIZE = 512
canvas.width = canvas.height = SIZE
document.body.appendChild(canvas)
class Vector3 {
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

const Gravity = new Vector3(0, 0, -1)

class Cube {
  position: Vector3
  velocity: Vector3
  rotation: Matrix3
  momentum: Vector3
  size = 1
  static coords = [...new Array(8)].map((_, i) =>
    new Vector3(
      ((i & 1) * 2 - 1),
      (((i >> 1) & 1) * 2 - 1),
      (((i >> 2) & 1) * 2 - 1)
    )
  )
  constructor(position: Vector3) {
    this.position = position
    this.rotation = Matrix3.fromRotation(randomDirection(), 2 * Math.PI * Math.random())
    this.rotation = new Matrix3()//Matrix3.fromRotation(randomDirection(), 2 * Math.PI * Math.random())
    // this.velocity = randomDirection()
    this.momentum = randomDirection()
    this.velocity = new Vector3(0, 0, 0)
    // this.momentum = new Vector3(0, 0.8, 0)
  }

  update(dt: number) {
    this.position = Vector3.wsum(1, this.position, dt , this.velocity)
    this.velocity = Vector3.wsum(1, this.velocity, dt, Gravity)
    const w = Matrix3.fromRotation(this.momentum, this.momentum.length() * dt)
    this.rotation = w.mult(this.rotation)
    this.hitFloor()
  }

  hitFloor() {
    const floorZ = -4
    Cube.coords.forEach(coord => {
      const rpos = this.rotation.transform(coord).scale(this.size)
      const point = Vector3.wsum(1, this.position, 1, rpos)
      if (point.z > floorZ) return
      const h = floorZ - point.z
      const vEnergy = this.velocity.length() ** 2 / 2
      const lossEnergy = -Gravity.z * h
      this.position.z += h
      const vscale = Math.sqrt(Math.max(1 - 2 * lossEnergy / this.velocity.length() ** 2, 0))
      this.velocity = this.velocity.scale(vscale)
      const wLossEnergy = lossEnergy - (vEnergy - this.velocity.length() ** 2 / 2)
      const mscale = Math.sqrt(Math.max(1 - 2 * wLossEnergy / this.momentum.length() ** 2, 0))
      this.momentum = this.momentum.scale(mscale)



      this.velocity = this.velocity.scale(0.98)
      this.momentum = this.momentum.scale(0.98)
      const vel = Vector3.wsum(1, this.velocity, 1, Vector3.cross(this.momentum, rpos))
      if (vel.z > 0) return
      const F = vel.scale(-1)
      F.x=F.y=0
      const vz0 = vel.z
      const vz1 = Vector3.wsum(1, F, 1, Vector3.cross(Vector3.cross(rpos, F), rpos)).z
      const t = -1.8 * vz0 / vz1
      this.velocity = Vector3.wsum(1, this.velocity, t, F)
      this.momentum = Vector3.wsum(1, this.momentum, t, Vector3.cross(rpos, F))
    })
  }



  render(ctx: CanvasRenderingContext2D) {
    ctx.save()
    this.position.y = 0
    Cube.coords.forEach(p => {
      Cube.coords.forEach(q => {
        if (Vector3.distance(p, q) != 2) return
        const [tp, tq] = [p, q].map(
          point => Vector3.wsum(1, this.position, this.size, this.rotation.transform(point))
        )
        const center = this.rotation.transform(Vector3.wsum(0.5, p, 0.5, q))
        const ps = 1 / (1 + 0.1 * tp.y)
        const qs = 1 / (1 + 0.1 * tq.y)
        ctx.globalAlpha = 0.6 - 0.3 * center.y
        ctx.beginPath()
        ctx.moveTo(tp.x * ps, -tp.z * ps)
        ctx.lineTo(tq.x * qs, -tq.z * qs)
        ctx.stroke()
      })
    })
    ctx.restore()
  }
}

function assignGlobal(data: Record<string, any>) {
  for (const key in data) {
    ;(window as any)[key] = data[key]
  }
}

assignGlobal({ Matrix3, Vector3 })

const cube = new Cube(new Vector3(0, 0, 2))
const ctx = canvas.getContext('2d')!
setInterval(() => {
  for(let i=0;i<10;i++)cube.update(0.01)
  ctx.clearRect(0, 0, SIZE, SIZE)
  ctx.save()
  ctx.translate(SIZE / 2, SIZE / 2)
  ctx.lineWidth = 0.004
  ctx.scale(SIZE / 8, SIZE / 8)
  cube.render(ctx)
  ctx.restore()
}, 10)


assignGlobal({ cube })
