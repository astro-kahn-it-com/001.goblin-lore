export interface Action<T = unknown> {
    type: string
    bale?: T
}
import type SeriesBit from './fce/series.bit.js'

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

export const TEST_SERIES = '[Series action] Test Series'
export class TestSeries implements Action {
    readonly type = TEST_SERIES
    constructor(public bale: SeriesBit) {}
}

export const CREATE_SERIES = '[Series action] Create Series'
export class CreateSeries implements Action {
    readonly type = CREATE_SERIES
    constructor(public bale: SeriesBit) {}
}

export type Actions = InitSeries | UpdateSeries | TestSeries | CreateSeries
