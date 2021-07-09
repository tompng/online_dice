import { DiceSimulator, Point2D, Point3D } from 'dice_simulator'
import express from 'express'
import expressWs from 'express-ws'
import type WebSocket from 'ws'
const { app } = expressWs(express())
app.use(express.static(__dirname + '/public'))

app.listen(8080, () => {
  console.log('listen')
})

type Message =
  | { type: 'tap'; position: Point2D }
  | { type: 'hide'; id: number }
  | { type: 'throw'; id: number; position: Point3D, seed: number }
  | { type: 'update'; id: number; text: string }

const connections = new Set<WebSocket>()

const simulator = new DiceSimulator()

function handleTap(pos2d: Point2D) {
  simulator.tapPosition(pos2d)
  const json = JSON.stringify({
    ...simulator.currentState(),
    action: { type: 'tap', position: pos2d }
  })
  connections.forEach(ws => {
    ws.send(json)
  })
}

setInterval(() => {
  simulator.update()
}, 16)

app.ws('/ws', (ws, req) => {
  connections.add(ws)
  ws.send(JSON.stringify({
    ...simulator.currentState(),
    action: { type: 'init' }
  }))
  ws.on('message', message => {
    setTimeout(() => {
      const data = JSON.parse(message as string) as Message
      if (data.type === 'tap') {
        handleTap(data.position)
      }
    }, 200)
  })
  ws.on('close', () => connections.delete(ws))
})
