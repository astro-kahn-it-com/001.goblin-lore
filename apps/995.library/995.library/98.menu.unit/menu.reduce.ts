import clone from 'clone-deep'
import * as Act from './menu.action'
import { MenuModel } from './menu.model'
import * as Buzz from './menu.buzzer'
import type State from '../99.core/state'

export function reducer(
    model: MenuModel = new MenuModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_MENU:
            return Buzz.updateMenu(clone(model), act.bale, state)

        case Act.INIT_MENU:
            return Buzz.initMenu(clone(model), act.bale, state)

        case Act.OPEN_MENU:
            return Buzz.openMenu(clone(model), act.bale, state)

        case Act.CLOSE_MENU:
            return Buzz.closeMenu(clone(model), act.bale, state)

        case Act.PRINT_MENU:
            return Buzz.printMenu(clone(model), act.bale, state)

        case Act.LIBRARY_MENU:
            return Buzz.libraryMenu(clone(model), act.bale, state)

        case Act.ROUTE_MENU:
            return Buzz.routeMenu(clone(model), act.bale, state)

        default:
            return model
    }
}
