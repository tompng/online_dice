import { Vector3, randomDirection, Matrix3 } from './vector'
import { Cube } from './Cube'

export type Point2D = { x: number; y: number }
export type Point3D = { x: number; y: number; z: number }
type CubeState = {
  p: Point3D
  v: Point3D
  r: Matrix3['elements'],
  m: Point3D
}
export type SimulatorState = {
  frame: number
  cubes: (CubeState | null)[]
}

export class DiceSimulator {
  cubes = [
    new Cube(new Vector3(0, 0, 9)),
    new Cube(new Vector3(2, 0, 6)),
    new Cube(new Vector3(0, -3, 8)),
    new Cube(new Vector3(2, -1, 7)),
    new Cube(new Vector3(-1, 2, 5)),
    new Cube(new Vector3(3, 2, 9)),
  ]
  xWall = 9
  yWall = 6
  frame = 0
  stopped = false

  maxTapTargetDistance = 4
  hasTapTargetCube(pos2d: Point2D) {
    const position = new Vector3(pos2d.x, pos2d.y, 0)
    for (const c of this.cubes) {
      if (c.hidden) continue
      const diff = Vector3.sub(c.position, position)
      const len = diff.length()
      if (len < this.maxTapTargetDistance) return true
    }
    return false
  }
  tapPosition(pos2d: Point2D) {
    this.stopped = false
    const position = new Vector3(pos2d.x, pos2d.y, 0)
    for (const c of this.cubes) {
      if (c.hidden) continue
      const diff = Vector3.sub(c.position, position)
      const len = diff.length()
      if (len >= this.maxTapTargetDistance) continue
      const power = 3 - len * len / 8
      c.velocity = Vector3.add(c.velocity, Vector3.add(new Vector3(0, 0, power), randomDirection(power / 4, pos2d.x + pos2d.y - len)))
      c.momentum = Vector3.add(c.momentum, randomDirection(power, pos2d.x + pos2d.y + len))
    }
  }

  currentState(): SimulatorState {
    return {
      frame: this.frame,
      cubes: this.cubes.map(
        c => (c.hidden ? null : {
          p: c.position,
          v: c.velocity,
          r: c.rotation.elements,
          m: c.momentum,
        })
      )
    }
  }

  replaceState(state: SimulatorState) {
    this.frame = state.frame
    this.stopped = false
    this.cubes = state.cubes.map(c => {
      if (!c) {
        const cube = new Cube(new Vector3(0, 0, 0))
        cube.hidden = true
        return cube
      }
      const { p, v, r, m } = c
      const cube = new Cube(new Vector3(p.x, p.y, p.z))
      cube.velocity = new Vector3(v.x, v.y, v.z)
      cube.momentum = new Vector3(m.x, m.y, m.z)
      cube.rotation = new Matrix3(r)
      return cube
    })
  }

  update() {
    this.frame += 1
    if (this.stopped) return
    this.cubes.forEach(c1 => {
      if (c1.hidden) return
      this.cubes.forEach(c2 => {
        if (c2.hidden) return
        if (c1 !== c2) Cube.hit(c1, c2)
      })
    })
    const movingState = this.cubes.map(c => c.update(0.15, this.xWall, this.yWall))
    this.stopped = movingState.every(m => !m)
  }

  hide(indices: number[]) {
    indices.forEach(i => {
      const c = this.cubes[i]
      if (c) c.hidden = true
    })
  }

  throw(indices: number[], seed: number) {
    indices.forEach(i => {
      const c = this.cubes[i]
      if (!c) return
      c.hidden = false
      c.position = randomDirection(4, seed + i + 1)
      c.position.z = 8 + c.position.z / 2
      c.momentum = randomDirection(4, seed + i + 2)
      c.rotation = Matrix3.fromRotation(randomDirection(1, seed + 3), Math.sin(seed + 4) * 100)
    })
  }
}
