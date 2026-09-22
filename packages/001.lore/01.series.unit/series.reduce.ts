import clone from 'clone-deep'
import * as Act from './series.action.js'
import { SeriesModel } from './series.model.js'
import * as Buzz from './series.buzzer.js'

export function reducer(
    model: SeriesModel = new SeriesModel(),
    act: Act.Actions,
    state?: any,
) {
    switch (act.type) {
        case Act.UPDATE_SERIES:
            return Buzz.updateSeries(clone(model), act.bale, state)

        case Act.INIT_SERIES:
            return Buzz.initSeries(clone(model), act.bale, state)

        case Act.TEST_SERIES:
            return Buzz.testSeries(clone(model), act.bale, state)

        case Act.CREATE_SERIES:
            return Buzz.createSeries(clone(model), act.bale, state)

        default:
            return model
    }
}
