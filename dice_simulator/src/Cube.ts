import { Vector3, Matrix3, randomDirection } from './vector'

function vectorMinus(v: Vector3, n: number) {
  const l = v.length()
  if (l <= n) return new Vector3(0, 0, 0)
  return v.scale((l - n) / l)
}

export const Gravity = new Vector3(0, 0, -1)

export class Cube {
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
    this.rotation = Matrix3.fromRotation(randomDirection(), 2 * Math.PI * Math.random())
    this.velocity = randomDirection()
    this.momentum = randomDirection(4)
    this.velocity = new Vector3(0, 0, 0)
  }

  update(dt: number) {
    if (this.isFaceDown() && this.position.z < this.size * 1.1) {
      const vlen = this.velocity.length()
      const mlen = this.velocity.length()
      if (vlen + mlen < 0.001) return false
    }
    this.velocity = Vector3.add(this.velocity, Gravity.scale(dt))
    this.position = Vector3.add(this.position, this.velocity.scale(dt))
    const w = Matrix3.fromRotation(this.momentum, this.momentum.length() * dt)
    this.rotation = w.mult(this.rotation)
    this.hitFloor()
    return true
  }

  static faces = [
    new Vector3(-1, 0, 0), new Vector3(1, 0, 0),
    new Vector3(0, -1, 0), new Vector3(0, 1, 0),
    new Vector3(0, 0, -1), new Vector3(0, 0, 1)
  ]

  isFaceDown() {
    return Cube.faces.some(n => this.rotation.transform(n).z > 0.999)
  }

  hitFloor() {
    const floorZ = 0
    const faceDown = this.isFaceDown()

    Cube.coords.forEach(coord => {
      const rpos = this.rotation.transform(coord).scale(this.size)
      const point = Vector3.add(this.position, rpos)
      if (point.z > floorZ) return
      const h = floorZ - point.z
      this.position.z += h
      if (faceDown) {
        this.velocity = vectorMinus(this.velocity, 0.001)
        this.momentum = vectorMinus(this.momentum, 0.001)
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
        const seed1 = a.position.x + a.position.y + a.position.z
        const seed2 = b.position.x + b.position.y + b.position.z
        a.momentum = Vector3.add(a.momentum, randomDirection(1, seed1 + 2 * seed2))
        b.momentum = Vector3.add(b.momentum, randomDirection(1, seed1 * 2 + seed2))
      }
    }
  }
}
