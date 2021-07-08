import { Vector3, Matrix3, randomDirection } from './vector'
import { Cube } from './Cube'
const canvas = document.createElement('canvas')
const SIZE = 512
canvas.width = canvas.height = SIZE
document.body.appendChild(canvas)

function renderCube(cube: Cube, ctx: CanvasRenderingContext2D) {
  const { position, rotation, size } = cube
  ctx.save()
  Cube.coords.forEach(p => {
    Cube.coords.forEach(q => {
      if (Vector3.distance(p, q) != 2) return
      const [tp, tq] = [p, q].map(
        point => Vector3.add(position, rotation.transform(point).scale(size))
      )
      const center = rotation.transform(Vector3.add(p, q).scale(0.5))
      const ps = 1 / (1 + 0.02 * tp.y)
      const qs = 1 / (1 + 0.02 * tq.y)
      ctx.globalAlpha = 0.6 - 0.3 * center.y
      ctx.beginPath()
      const tz = -6
      ctx.moveTo(tp.x * ps, -(tp.z + tz) * ps)
      ctx.lineTo(tq.x * qs, -(tq.z + tz)* qs)
      ctx.stroke()
    })
  })
  ctx.restore()
}


function assignGlobal(data: Record<string, any>) {
  for (const key in data) {
    ;(window as any)[key] = data[key]
  }
}

assignGlobal({ Matrix3, Vector3, Cube })

const cube = new Cube(new Vector3(0, 0, 9))
const cube2 = new Cube(new Vector3(0, 0, 6))
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
    renderCube(c, ctx)
    ctx.restore()
  })
}, 10)

assignGlobal({ cube })
document.onclick = () => {
  cube.position = new Vector3(0, 0, 9)
  cube.momentum = randomDirection(4)
  cube2.position = new Vector3(0, 0, 6)
  cube2.momentum = randomDirection(4)
  cube.velocity = new Vector3(0, 0, 0)
  cube2.velocity = new Vector3(0, 0, 0)
}
