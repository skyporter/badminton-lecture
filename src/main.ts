import './ui/styles.css'
import {generateSituation} from './engine/generator'
import {renderCourt, renderPlayers, renderShotB} from './ui/courtView'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const situation = generateSituation(Date.now())
const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
const shotLayer = document.createElementNS(SVG_NAMESPACE, 'g')
const playerLayer = document.createElementNS(SVG_NAMESPACE, 'g')

renderCourt(svg)
svg.append(shotLayer, playerLayer)
renderShotB(shotLayer, situation)
renderPlayers(playerLayer, situation, 'question')
document.querySelector('#app')!.append(svg)
