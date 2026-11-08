import {mapColor} from '../engine/analysis'
import type {ValueMap} from '../engine/analysis'
import {NET_Y, SINGLES_LEFT, SINGLES_RIGHT} from '../engine/court'
import {MAP_RED} from '../engine/rules'

export function renderHeatmap(canvas: HTMLCanvasElement, map: ValueMap, bestValue: number): void {
  canvas.width = map.columns
  canvas.height = map.rows
  const context = canvas.getContext('2d')!
  if (bestValue === 0) {
    context.fillStyle = MAP_RED
    context.fillRect(0, 0, map.columns, map.rows)
  } else {
    map.values.forEach((value, index) => {
      context.fillStyle = mapColor(value / bestValue)
      context.fillRect(index % map.columns, Math.floor(index / map.columns), 1, 1)
    })
  }
}

export function placeOverHalfOfB(canvas: HTMLCanvasElement, svg: SVGSVGElement): void {
  const viewBox = svg.viewBox.baseVal
  canvas.style.left = `${(100 * (SINGLES_LEFT - viewBox.x)) / viewBox.width}%`
  canvas.style.top = `${(100 * -viewBox.y) / viewBox.height}%`
  canvas.style.width = `${(100 * (SINGLES_RIGHT - SINGLES_LEFT)) / viewBox.width}%`
  canvas.style.height = `${(100 * NET_Y) / viewBox.height}%`
}
