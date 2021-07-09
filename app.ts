import { Cube, Vector3, Matrix3, randomDirection } from 'dice_simulator'
import express from 'express'
import expressWs from 'express-ws'
import type WebSocket from 'ws'
const { app } = expressWs(express())
app.use(express.static(__dirname + '/public'))



app.listen(8080, () => {
  console.log('listen')
})

console.log(Cube)

const cubes = [
  new Cube(new Vector3(0, 0, 9)),
  new Cube(new Vector3(0, 0, 6))
]

type Point2D = { x: number; y: number }

type Message =
  | { type: 'tap'; position: Point2D }
  | { type: 'hide'; id: number }
  | { type: 'throw'; id: number; position: Vector3, seed: number }
  | { type: 'update'; id: number; text: string }

const connections = new Set<WebSocket>()

function tapPosition(pos2d: Point2D) {
  const position = new Vector3(pos2d.x, pos2d.y, 0)
  cubes.forEach(c => {
    const diff = Vector3.sub(c.position, position)
    const len = diff.length()
    const dir = new Vector3(diff.x / 4, diff.y / 4, diff.z).normalize()
    const power = 4 * Math.exp(-len * len / 4)
    c.velocity = Vector3.add(c.velocity, dir.scale(power))
    c.momentum = Vector3.add(c.momentum, randomDirection().scale(power))
  })
  const json = JSON.stringify(currentData())
  connections.forEach(ws => {
    ws.send(json)
  })
}

function currentData() {
  return cubes.map(
    c => ({
      p: c.position,
      v: c.velocity,
      r: c.rotation.elements,
      m: c.momentum
    })
  )
}

setInterval(() => {
  Cube.hit(cubes[0], cubes[1])
  cubes.forEach(c => {
    c.update(0.1)
  })
}, 16)

app.ws('/ws', (ws, req) => {
  connections.add(ws)
  ws.send(JSON.stringify(currentData()))
  ws.on('message', message => {
    setTimeout(() => {
      const data = JSON.parse(message as string) as Message
      if (data.type === 'tap') {
        tapPosition(data.position)
      }
    }, 200)
  })
  ws.on('close', () => connections.delete(ws))
})
