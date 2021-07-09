import { DiceSimulator, Cube, Matrix3, Vector3 } from 'dice_simulator'
import * as THREE from 'three'

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
plane.scale.x = 10
plane.scale.y = 10
plane.scale.z = 10
const cubeGeometry = new THREE.BoxBufferGeometry(2, 2, 2)
const cubeMaterial = new THREE.MeshPhongMaterial({ color: 'blue' })
const cubeMesh1 = new THREE.Mesh(cubeGeometry, cubeMaterial)
const cubeMesh2 = new THREE.Mesh(cubeGeometry, cubeMaterial)
scene.add(cubeMesh1, cubeMesh2)
cubeMesh1.castShadow = true
cubeMesh2.castShadow = true
cubeMesh1.receiveShadow = true
cubeMesh2.receiveShadow = true
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

const simulator = new DiceSimulator()

setInterval(() => {
  simulator.update()
  ;[cubeMesh1, cubeMesh2].forEach((mesh, i) => {
    const { position, rotation } = simulator.cubes[i]
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

let clientId = Math.random()
document.onclick = () => {
  const anonymous = !simulator.stopped
  const cube = simulator.cubes[Math.floor(simulator.cubes.length * Math.random())]
  const position = { x: cube.position.x * 1.1, y: cube.position.y * 1.1 }
  if (!anonymous) simulator.tapPosition(position)
  const data = { type: 'tap', position, clientId: anonymous ? undefined : clientId }
  ws.send(JSON.stringify(data))
}

const ws = new WebSocket('ws://localhost:8080/ws')
ws.onmessage = e => {
  const data = JSON.parse(e.data as string)
  if (data.action.type === 'init') simulator.replaceState(data)
  else if (data.action.type === 'tap' && data.action.clientId !== clientId) {
    simulator.replaceState(data)
  }
}

assignGlobal({
  Vector3, Matrix3,
  cubeMesh1,
  cubeMesh2,
  simulator,
  ws
})
