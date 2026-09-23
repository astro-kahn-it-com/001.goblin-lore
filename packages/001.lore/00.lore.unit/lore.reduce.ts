import clone from 'clone-deep'
import * as Act from './lore.action.js'
import { LoreModel } from './lore.model.js'
import * as Buzz from './lore.buzzer.js'
import type State from './lore.unit.js'

export function reducer(
    model: LoreModel = new LoreModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_LORE:
            return Buzz.initLore(clone(model), act.bale, state)
        case Act.COMPILE_LORE:
            return Buzz.compileLore(clone(model), act.bale, state)
        case Act.AUDIT_LORE:
            return Buzz.auditLore(clone(model), act.bale, state)
        case Act.SCAFFOLD_ENTITY:
            return Buzz.scaffoldEntity(clone(model), act.bale, state)
        default:
            return model
    }
}
