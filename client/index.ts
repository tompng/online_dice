import { Cube, Vector3, Matrix3, randomDirection } from 'dice_simulator'
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

const cubes = [
  new Cube(new Vector3(0, 0, 9)),
  new Cube(new Vector3(0, 0, 6))
]
const ctx = canvas.getContext('2d')!
setInterval(() => {
  Cube.hit(cubes[0], cubes[1])
  ctx.clearRect(0, 0, SIZE, SIZE)
  cubes.forEach(c => {
    c.update(0.1)
    ctx.save()
    ctx.translate(SIZE / 2, SIZE / 2)
    ctx.lineWidth = 0.02
    ctx.scale(SIZE / 16, SIZE / 16)
    renderCube(c, ctx)
    ctx.restore()
  })
}, 10)

assignGlobal({ cubes })
document.onclick = () => {
  const cube = cubes[Math.floor(cubes.length * Math.random())]
  const data = {
    type: 'tap',
    position: { x: cube.position.x * 1.1, y: cube.position.y * 1.1 }
  }
  ws.send(JSON.stringify(data))
}

const ws = new WebSocket('ws://localhost:8080/ws')
ws.onmessage = e => {
  const data = JSON.parse(e.data as string)
  cubes.forEach((c, i) => {
    const { p, v, r, m } = data[i]
    c.position = new Vector3(p.x, p.y, p.z)
    c.velocity = new Vector3(v.x, v.y, v.z)
    c.rotation = new Matrix3(r)
    c.momentum = new Vector3(m.x, m.y, m.z)
  })
}
assignGlobal({ ws })
