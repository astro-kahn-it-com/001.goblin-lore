import { Action } from '../99.core/interface/action.interface'
import SeriesBit from './fce/series.bit'

// Series actions

export const INIT_SERIES = '[Series action] Init Series'
export class InitSeries implements Action {
    readonly type = INIT_SERIES
    constructor(public bale: SeriesBit) {}
}

export const UPDATE_SERIES = '[Series action] Update Series'
export class UpdateSeries implements Action {
    readonly type = UPDATE_SERIES
    constructor(public bale: SeriesBit) {}
}

export type Actions = InitSeries | UpdateSeries
