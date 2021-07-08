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
  static add(va: Vector3, vb: Vector3) {
    return this.wsum(1, va, 1, vb)
  }
  static sub(va: Vector3, vb: Vector3) {
    return this.wsum(1, va, -1, vb)
  }
}

function vectorMinus(v: Vector3, n: number) {
  const l = v.length()
  if (l <= n) return new Vector3(0, 0, 0)
  return v.scale((l - n) / l)
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

function randomDirection(l = 1) {
  const z = 2 * Math.random() - 1
  const r = Math.sqrt(1 - z * z)
  const th = 2 * Math.PI * Math.random()
  return new Vector3(l * r * Math.cos(th), l * r * Math.sin(th), l * z)
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
    this.momentum = randomDirection(4)
    this.velocity = new Vector3(0, 0, 0)
    // this.momentum = new Vector3(0, 0.8, 0)
  }

  update(dt: number) {
    this.velocity = Vector3.add(this.velocity, Gravity.scale(dt))
    this.position = Vector3.add(this.position, this.velocity.scale(dt))
    const w = Matrix3.fromRotation(this.momentum, this.momentum.length() * dt)
    this.rotation = w.mult(this.rotation)
    this.hitFloor()
  }

  static faces = [
    new Vector3(-1, 0, 0), new Vector3(1, 0, 0),
    new Vector3(0, -1, 0), new Vector3(0, 1, 0),
    new Vector3(0, 0, -1), new Vector3(0, 0, 1)
  ]
  hitFloor() {
    const floorZ = -4
    const faceDown = Cube.faces.some(n => this.rotation.transform(n).z > 0.999)

    Cube.coords.forEach(coord => {
      const rpos = this.rotation.transform(coord).scale(this.size)
      const point = Vector3.add(this.position, rpos)
      if (point.z > floorZ) return
      const h = floorZ - point.z
      this.position.z += h
      if (faceDown) {
        this.velocity = vectorMinus(this.velocity, 0.002)
        this.momentum = vectorMinus(this.momentum, 0.002)
        const vEnergy = this.velocity.length() ** 2 / 2
        const lossEnergy = -Gravity.z * h
        const vscale = Math.sqrt(Math.max(1 - 2 * lossEnergy / this.velocity.length() ** 2, 0))
        if (vscale < 1) this.velocity = this.velocity.scale(vscale)
        const wLossEnergy = lossEnergy - (vEnergy - this.velocity.length() ** 2 / 2)
        const mscale = Math.sqrt(Math.max(1 - 2 * wLossEnergy / this.momentum.length() ** 2, 0))
        if (mscale < 1) this.momentum = this.momentum.scale(mscale)
      }
      const vel = Vector3.add(this.velocity, Vector3.cross(this.momentum, rpos))
      if (vel.z > 0) return
      const rxy = Math.hypot(vel.x, vel.y) || 1
      const friction = 0.5
      const Fz = new Vector3(0, 0, -vel.z)
      const Fxy = new Vector3(friction * vel.z * vel.x / rxy, friction * vel.z * vel.y / rxy, 0)
      const v0 = vel
      const v1 = Vector3.add(Fz, Vector3.cross(Vector3.cross(rpos, Fz), rpos))
      // velocity = v0 + v1 * t
      // position = v0.z * t + v1.z * t * t / 2
      const t = - 1.5 * v0.z / v1.z
      if (isNaN(t) || t <= 0) return
      const a = Vector3.add(this.velocity, Fz.scale(t))
      const af = Fxy.scale(t)
      const b = Vector3.add(this.momentum, Vector3.cross(rpos, Fz).scale(t))
      const bf = Vector3.cross(rpos, Fxy).scale(t)
      const _f = - (Vector3.dot(a, af) + Vector3.dot(b, bf)) / (Vector3.dot(af, af) + Vector3.dot(bf, bf))
      const f = _f < 0 ? 0 : _f < 1 ? _f : 1
      const F = Vector3.add(Fz, Fxy.scale(f))
      this.velocity = Vector3.add(this.velocity, F.scale(t))
      this.momentum = Vector3.add(this.momentum, Vector3.cross(rpos, F).scale(t))
    })
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.save()
    this.position.y = 0
    Cube.coords.forEach(p => {
      Cube.coords.forEach(q => {
        if (Vector3.distance(p, q) != 2) return
        const [tp, tq] = [p, q].map(
          point => Vector3.add(this.position, this.rotation.transform(point).scale(this.size))
        )
        const center = this.rotation.transform(Vector3.add(p, q).scale(0.5))
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

  static hitTest(cube1: Cube, cube2: Cube) {
    for (const [a, b] of [[cube1, cube2], [cube2, cube1]]) {
      const faces = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)].map(f => a.rotation.transform(f))
      const coords = Cube.coords.map(c => Vector3.add(b.rotation.transform(c).scale(b.size), Vector3.sub(b.position, a.position)))
      for (const f of faces) {
        if (coords.every(c => a.size < Vector3.dot(f, c)) || coords.every(c => Vector3.dot(f, c) < -a.size)) return false
      }
    }
    return true
  }
  static hit(a: Cube, b: Cube) {
    const diff = Vector3.sub(a.position, b.position)
    if (this.hitTest(a, b)) {
      const dir = diff.normalize()
      const dot = Vector3.dot(Vector3.sub(a.velocity, b.velocity), dir)
      if (dot < 0) {
        a.velocity = Vector3.add(a.velocity, dir.scale(-dot))
        b.velocity = Vector3.add(b.velocity, dir.scale(dot))
        a.momentum = Vector3.add(a.momentum, randomDirection())
        b.momentum = Vector3.add(b.momentum, randomDirection())
      }
    }
  }
}

function assignGlobal(data: Record<string, any>) {
  for (const key in data) {
    ;(window as any)[key] = data[key]
  }
}

assignGlobal({ Matrix3, Vector3, Cube })

const cube = new Cube(new Vector3(0, 0, 6))
const cube2 = new Cube(new Vector3(0, 0, 2))
const ctx = canvas.getContext('2d')!
setInterval(() => {
  Cube.hit(cube, cube2)
  ctx.clearRect(0, 0, SIZE, SIZE)
  ;[cube, cube2].forEach(c => {
    c.update(0.1)
    ctx.save()
    ctx.translate(SIZE / 2, SIZE / 2)
    ctx.lineWidth = 0.02
    ctx.scale(SIZE / 16, SIZE / 16)
    c.render(ctx)
    ctx.restore()
  })
}, 10)

assignGlobal({ cube })
document.onclick = () => {
  cube.position = new Vector3(0, 0, 6)
  cube.momentum = randomDirection(4)
  cube2.position = new Vector3(0, 0, 2)
  cube2.momentum = randomDirection(4)
  cube.velocity = new Vector3(0, 0, 0)
  cube2.velocity = new Vector3(0, 0, 0)
}
