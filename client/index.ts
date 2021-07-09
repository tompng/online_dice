import { DiceSimulator, SimulatorState, Matrix3, Vector3 } from 'dice_simulator'
import * as THREE from 'three'

const simulator = new DiceSimulator()
let appearance: (string[] | null)[] = []

const scene = new THREE.Scene()
const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const ambientLight = new THREE.AmbientLight(0x222222)
const light = new THREE.DirectionalLight(0xFFFFFF)
light.position.set(10, 10, 30)
light.castShadow = true
light.shadow.mapSize.width = 1024
light.shadow.mapSize.height = 1024
light.shadow.camera.near = 0.2
light.shadow.camera.far = 40
light.shadow.camera.left = -10
light.shadow.camera.right = +10
light.shadow.camera.bottom = -10
light.shadow.camera.top = +10
scene.add(light, ambientLight)
const plane = new THREE.Mesh(new THREE.PlaneBufferGeometry(), new THREE.MeshPhongMaterial({ color: 'red' }))
plane.receiveShadow = true
scene.add(plane)
plane.scale.x = 2 * simulator.xWall
plane.scale.y = 2 * simulator.yWall
const cubeGeometry = new THREE.BoxBufferGeometry(2, 2, 2)
const cubeMaterial = new THREE.MeshPhongMaterial({ color: 'blue' })
const cubeMeshes = [...new Array(6)].map(() => {
  const mesh = new THREE.Mesh(cubeGeometry, cubeMaterial)
  scene.add(mesh)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
})
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100)
camera.position.z = 20
camera.position.y = -3
camera.lookAt(0, 0, 0)
renderer.shadowMap.enabled = true
renderer.render(scene, camera)

function assignGlobal(data: Record<string, any>) {
  for (const key in data) {
    ;(window as any)[key] = data[key]
  }
}

setInterval(() => {
  simulator.update()
  cubeMeshes.forEach((mesh, i) => {
    const cube = simulator.cubes[i]
    if (cube.hidden) {
      mesh.visible = false
      return
    }
    mesh.visible = true
    const { position, rotation } = cube
    mesh.position.x = position.x
    mesh.position.y = position.y
    mesh.position.z = position.z
    const e = rotation.elements
    const matrix = new THREE.Matrix4()
    matrix.set(
      e[0], e[1], e[2], 0,
      e[3], e[4], e[5], 0,
      e[6], e[7], e[8], 0,
      0, 0, 0, 1
    )
    mesh.rotation.setFromRotationMatrix(matrix)
  })
  renderer.render(scene, camera)
}, 16)

const clientId = Math.random()
let prevActionState: any = null
document.onclick = (e) => {
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera({
    x: (e.pageX - renderer.domElement.offsetLeft) / renderer.domElement.offsetWidth * 2 - 1,
    y: 1 - 2 * (e.pageY - renderer.domElement.offsetTop) / renderer.domElement.offsetHeight
  }, camera)
  const { origin, direction } = raycaster.ray
  const t = -origin.z / direction.z
  const x = origin.x + t * direction.x
  const y = origin.y + t * direction.y

  const position = { x, y }
  if (!simulator.hasTapTargetCube(position)) return
  const anonymous = !simulator.stopped
  if (!anonymous) simulator.tapPosition(position)
  prevActionState = simulator.currentState()
  const data = { type: 'tap', position, clientId: anonymous ? undefined : clientId }
  ws.send(JSON.stringify(data))
}
function compareCubePosition(state1: SimulatorState, state2: SimulatorState) {
  if (state1.cubes.length != state2.cubes.length) return false
  const size = state1.cubes.length
  let diff = 0
  for (let i = 0; i < size; i++) {
    const cube1 = state1.cubes[i]
    const cube2 = state2.cubes[i]
    if (cube1 == null && cube2 == null) continue
    if (cube1 == null || cube2 == null) return false
    ;([[cube1.p, cube2.p], [cube1.v, cube2.v], [cube1.m, cube2.m]] as const).forEach(([a, b]) => {
      diff = Math.max(diff, Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z))
    })
    for (let j = 0; j < 9; j++) {
      diff = Math.max(diff, Math.abs(cube1.r[j] - cube2.r[j]))
    }
  }
  return diff < 1e-6
}
const wsurl = `${location.protocol === 'https' ? 'wss' : 'ws'}://${location.host}/ws`
const ws = new WebSocket(wsurl)
type DiceAction = {
  type: 'init'
  cubes: SimulatorState['cubes']
  appearance: (string[] | null)[]
} | {
  type: 'cubes'
  clientId?: number
  cubes: SimulatorState['cubes']
} | {
  type: 'appearance'
  appearance: (string[] | null)[]
}
ws.onmessage = e => {
  const data = JSON.parse(e.data as string) as SimulatorState & DiceAction
  if (data.type === 'init') {
    simulator.replaceState(data)
    appearance = data.appearance
  } else if (data.type === 'cubes') {
    if (data.clientId !== clientId || !compareCubePosition(data, prevActionState)) {
      simulator.replaceState(data)
    }
  } else if (data.type === 'appearance') {
    appearance = data.appearance
  }
}

assignGlobal({
  Vector3, Matrix3,
  cubeMeshes,
  simulator,
  ws
})
