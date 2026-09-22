import clone from 'clone-deep'
import * as Act from './series.action'
import { SeriesModel } from './series.model'
import * as Buzz from './series.buzzer'
import State from '../99.core/state'

export function reducer(
    model: SeriesModel = new SeriesModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_SERIES:
            return Buzz.updateSeries(clone(model), act.bale, state)

        case Act.INIT_SERIES:
            return Buzz.initSeries(clone(model), act.bale, state)

        default:
            return model
    }
}
