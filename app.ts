import { DiceSimulator, Vector3, Matrix3, Point2D, Point3D, randomDirection } from 'dice_simulator'
import express from 'express'
import expressWs from 'express-ws'
import type WebSocket from 'ws'
const { app } = expressWs(express())
app.use(express.static(__dirname + '/public'))

app.listen(8080, () => {
  console.log('listen')
})

type Message =
  | { type: 'tap'; position: Point2D; clientId?: number }
  | { type: 'hide'; ids: number[]; clientId?: number }
  | { type: 'throw'; ids: number[]; position: Point3D, seed: number; clientId?: number }
  | { type: 'update'; id: number; data: string[] | null }

const connections = new Set<WebSocket>()

const simulator = new DiceSimulator()

function handleTap(position: Point2D) {
  if (!simulator.hasTapTargetCube(position)) return
  simulator.tapPosition(position)
}
function broadcastStateAction(clientId?: number) {
  const json = JSON.stringify({
    type: 'cubes',
    clientId,
    ...simulator.currentState(),
  })
  connections.forEach(ws => ws.send(json))
}

setInterval(() => {
  simulator.update()
}, 16)

const appearance: (string[] | null)[] = [['', '', '', '', '', ''], null, null, null, null, null]

app.ws('/ws', ws => {
  connections.add(ws)
  ws.send(JSON.stringify({
    type: 'init',
    ...simulator.currentState(),
    appearance,
  }))
  ws.on('message', message => {
    setTimeout(() => {
      const data = JSON.parse(message as string) as Message
      if (data.type === 'tap') {
        if (simulator.hasTapTargetCube(data.position)) {
          simulator.tapPosition(data.position)
          broadcastStateAction(data.clientId)
        }
      } else if (data.type === 'hide') {
        simulator.hide(data.ids)
        broadcastStateAction(data.clientId)
      } else if (data.type === 'throw') {
        simulator.throw(data.ids, data.seed)
        simulator.stopped = false
        broadcastStateAction(data.clientId)
      } else if (data.type === 'update') {
        if (appearance[data.id] !== undefined) {
          appearance[data.id] = data.data
          const json = JSON.stringify({
            type: 'appearance',
            appearance
          })
          connections.forEach(ws => ws.send(json))
        }
      }
    }, 200)
  })
  ws.on('close', () => connections.delete(ws))
})
