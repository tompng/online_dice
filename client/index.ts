import { DiceSimulator, Cube, Matrix3, Vector3, SimulatorState } from 'dice_simulator'
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

assignGlobal({ Vector3, Cube })

const simulator = new DiceSimulator()

const ctx = canvas.getContext('2d')!
setInterval(() => {
  simulator.update()
  ctx.clearRect(0, 0, SIZE, SIZE)
  ctx.save()
  ctx.translate(SIZE / 2, SIZE / 2)
  ctx.lineWidth = 0.02
  ctx.scale(SIZE / 16, SIZE / 16)
  simulator.cubes.forEach(c => renderCube(c, ctx))
  ctx.restore()
}, 16)

assignGlobal({ simulator })
document.onclick = () => {
  const cube = simulator.cubes[Math.floor(simulator.cubes.length * Math.random())]
  const data = {
    type: 'tap',
    position: { x: cube.position.x * 1.1, y: cube.position.y * 1.1 }
  }
  ws.send(JSON.stringify(data))
}

const ws = new WebSocket('ws://localhost:8080/ws')
ws.onmessage = e => {
  const data = JSON.parse(e.data as string)
  simulator.replaceState(data)
}
assignGlobal({ ws })
