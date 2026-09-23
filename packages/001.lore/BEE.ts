import LoreUnit from './00.lore.unit/lore.unit.js'
import SeriesUnit from './01.series.unit/series.unit.js'
import MenuUnit from './98.menu.unit/menu.unit.js'

import { LoreModel } from './00.lore.unit/lore.model.js'
import { SeriesModel } from './01.series.unit/series.model.js'
import { MenuModel } from './98.menu.unit/menu.model.js'

import { reducer as loreReducer } from './00.lore.unit/lore.reduce.js'
import { reducer as seriesReducer } from './01.series.unit/series.reduce.js'
import { reducer as menuReducer } from './98.menu.unit/menu.reduce.js'

export const list: Array<any> = [LoreUnit, SeriesUnit, MenuUnit]

export const models: any = {
    lore: new LoreModel(),
    series: new SeriesModel(),
    menu: new MenuModel(),
}

export const reducers: any = {
    lore: loreReducer,
    series: seriesReducer,
    menu: menuReducer,
}
