import LoreUnit from './00.lore.unit/lore.unit.js'
import SeriesUnit from './01.series.unit/series.unit.js'
import MenuUnit from './98.menu.unit/menu.unit.js'

import { LoreModel } from './00.lore.unit/lore.model.js'
import { SeriesModel } from './01.series.unit/series.model.js'
import { MenuModel } from './98.menu.unit/menu.model.js'

import * as reduceFromLore from './00.lore.unit/lore.reduce.js'
import * as reduceFromSeries from './01.series.unit/series.reduce.js'
import * as reduceFromMenu from './98.menu.unit/menu.reduce.js'

export const list: any[] = [LoreUnit, SeriesUnit, MenuUnit]

export const reducer: any = {
    lore: reduceFromLore.reducer,
    series: reduceFromSeries.reducer,
    menu: reduceFromMenu.reducer,
}

export default class UnitData {
    lore = new LoreModel()
    series = new SeriesModel()
    menu = new MenuModel()
}
