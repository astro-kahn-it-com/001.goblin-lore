import clone from 'clone-deep'
import * as Act from './lore.action.js'
import { LoreModel } from './lore.model.js'
import * as Buzz from './lore.buzzer.js'

export function reducer(
    model: LoreModel = new LoreModel(),
    act: Act.Actions,
    _state?: any,
) {
    switch (act.type) {
        case Act.INIT_LORE:
            return Buzz.initLore(clone(model), act.bale)
        case Act.COMPILE_LORE:
            return Buzz.compileLore(clone(model), act.bale)
        default:
            return model
    }
}
