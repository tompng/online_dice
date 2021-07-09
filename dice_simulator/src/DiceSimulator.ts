import { Vector3, randomDirection, Matrix3 } from './vector'
import { Cube } from './Cube'

export type Point2D = { x: number; y: number }
export type Point3D = { x: number; y: number; z: number }
export type SimulatorState = {
  frame: number
  cubes: {
    p: Point3D
    v: Point3D
    r: Matrix3['elements'],
    m: Point3D
  }[]
}

export class DiceSimulator {
  cubes = [
    new Cube(new Vector3(0, 0, 9)),
    new Cube(new Vector3(0, 0, 6))
  ]
  frame = 0

  tapPosition(pos2d: Point2D) {
    const position = new Vector3(pos2d.x, pos2d.y, 0)
    this.cubes.forEach(c => {
      const diff = Vector3.sub(c.position, position)
      const len = diff.length()
      const dir = new Vector3(diff.x / 4, diff.y / 4, diff.z).normalize()
      const power = 4 * Math.exp(-len * len / 4)
      c.velocity = Vector3.add(c.velocity, dir.scale(power))
      c.momentum = Vector3.add(c.momentum, randomDirection().scale(power))
    })
  }

  currentState(): SimulatorState {
    return {
      frame: this.frame,
      cubes: this.cubes.map(
        c => ({
          p: c.position,
          v: c.velocity,
          r: c.rotation.elements,
          m: c.momentum
        })
      )
    }
  }

  replaceState(state: SimulatorState) {
    this.frame = state.frame
    this.cubes = state.cubes.map(({ p, v, r, m }) => {
      const cube = new Cube(new Vector3(p.x, p.y, p.z))
      cube.velocity = new Vector3(v.x, v.y, v.z)
      cube.momentum = new Vector3(m.x, m.y, m.z)
      cube.rotation = new Matrix3(r)
      return cube
    })
  }

  update() {
    this.frame += 1
    this.cubes.forEach(c1 => {
      this.cubes.forEach(c2 => {
        if (c1 !== c2) Cube.hit(c1, c2)
      })
    })
    this.cubes.forEach(c => {
      c.update(0.1)
    })
  }
}
