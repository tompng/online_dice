import { Cube, Vector3, Matrix3, randomDirection } from 'dice_simulator'
import express from 'express'
const app = express()
app.use(express.static(__dirname + '/public'))

app.listen(8080, () => {
  console.log('listen')
})

console.log(Cube)