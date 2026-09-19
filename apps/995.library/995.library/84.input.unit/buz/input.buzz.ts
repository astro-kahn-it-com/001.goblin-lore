import type { InputModel } from '../input.model'
import type InputBit from '../fce/input.bit'
import type State from '../../99.core/state'

import type NetBit from '../../81.grid.unit/fce/net.bit'
import * as Align from '../../val/align'
import * as Color from '../../val/console-color'

export const initInput = (cpy: InputModel, bal: InputBit, ste: State) => {
    debugger
    return cpy
}

export const updateInput = (cpy: InputModel, bal: InputBit, ste: State) => {
    return cpy
}

export const openInput = (cpy: InputModel, bal: InputBit, ste: State) => {
    const blessed = ste.value.terminal.blessed
    const screen = ste.value.terminal.screen

    const dat = { idx: 'input-bit', clr0: Color.GREEN, clr1: Color.CYAN }
    for (const key in bal.dat) {
        dat[key] = bal.dat[key]
    }

    const net: NetBit = bal.net

    if (bal.txt == null) bal.txt = 'input below'

    const title = blessed.textbox({
        parent: screen,
        name: 'input',
        keys: true,
        left: net.left,
        top: 1,
        width: net.width,
        height: 2,
        content: 'rename',
        border: { type: 'line' },
        label: bal.txt,
        style: {
            // bg: dat.clr1,
        },
    })

    const input = blessed.textbox({
        parent: screen,
        name: 'input',
        input: true,
        keys: true,
        left: net.left,
        top: net.top,
        width: net.width,
        height: net.height,
        inputOnFocus: true,

        style: {
            bg: dat.clr1,
            focus: {
                bg: 'red',
            },
            hover: {
                bg: 'red',
            },
        },
    })

    input.focus()

    input.on('submit', (src) => {
        if (bal.slv != null) bal.slv({ putBit: { idx: 'open-input', src } })
    })

    return cpy
}
