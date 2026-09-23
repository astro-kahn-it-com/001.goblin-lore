import type { ChoiceModel } from '../choice.model'
import type ChoiceBit from '../fce/choice.bit'
import type State from '../../99.core/state'
import type NetBit from '../../81.grid.unit/fce/net.bit'
import * as Align from '../../val/align'
import * as Color from '../../val/console-color'

export const initChoice = (cpy: ChoiceModel, bal: ChoiceBit, ste: State) => {
    debugger
    return cpy
}

export const updateChoice = (cpy: ChoiceModel, bal: ChoiceBit, ste: State) => {
    return cpy
}

export const openChoice = (cpy: ChoiceModel, bal: ChoiceBit, ste: State) => {
    const blessed = ste.value.terminal.blessed
    const screen = ste.value.terminal.screen

    const dat: any = { idx: 'choice-bit', clr0: Color.GREEN, clr1: Color.CYAN }
    for (const key in bal.dat) {
        dat[key] = bal.dat[key]
    }

    const net: NetBit = bal.net

    const form = blessed.form({
        parent: screen,
        keys: true,
        left: net.left,
        top: net.top,
        width: net.width,
        height: net.height,
        bg: dat.clr0,
        content: '',
    })

    if (bal.lst == null) bal.lst = []

    const output = []

    bal.lst.forEach((a, b) => {
        const btn = blessed.button({
            parent: form,
            mouse: true,
            keys: true,
            shrink: true,
            padding: {
                left: 2,
                right: 1,
            },
            left: 0,
            top: b,
            height: 1,
            width: '100%',
            name: a,
            content: a,
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

        btn.on('press', function () {
            form.submit()
        })

        btn.on('focus', function () {
            if (dat.cb) {
                dat.cb(a)
            }
        })

        output.push(btn)
    })

    screen.key('left', () => form.focusPrevious())
    screen.key('right', () => form.focusNext())

    if (output.length > 0) output[0].focus()

    screen.render()

    form.on('submit', async function (data) {
        //form.setContent('Submitted.');

        let selected = form._selected

        if (selected == null) {
            //use the first one
            output

            selected = output[0]
            selected.content

            //var bit = await ste.hunt( ActChc.OPEN_CHOICE, bal)
            //if (bal.slv != null) bal.slv({ chcBit: { idx: "open-choice", dat:bit } });
            //return
        }

        const src = selected.content
        const val = selected.index - 1

        screen.render()
        if (bal.slv != null)
            bal.slv({ chcBit: { idx: 'open-choice', src, val } })
    })

    return cpy
}

export const keyChoice = (cpy: ChoiceModel, bal: ChoiceBit, ste: State) => {
    const blessed = ste.value.terminal.blessed
    const screen = ste.value.terminal.screen

    const net: NetBit = bal.net

    const menubar = blessed.listbar({
        parent: screen,
        keys: true,
        left: net.left,
        top: net.top,
        width: net.width,
        height: net.height,
        style: { item: { fg: 'yellow' }, selected: { fg: 'yellow' } },
        commands: {
            'Login': {
                keys: ['l', 'L'],
                callback: () => {
                    debugger
                },
            },
            'Toggle Autotrading': {
                keys: ['a', 'A'],
                callback: () => {
                    debugger
                },
            },
            'Make a Trade': {
                keys: ['t', 'T'],
                callback: () => {
                    debugger
                },
            },
            'Help': {
                keys: ['h', 'H'],
                callback: () => {
                    debugger
                },
            },
            'Logout': {
                keys: ['o', 'O'],
                callback: () => {
                    debugger
                },
            },
            'Exit': {
                keys: ['C-c', 'escape'],
                callback: () => process.exit(0),
            },
        },
    })

    screen.render()

    if (bal.slv != null) bal.slv({ scnBit: { idx: 'key-choice' } })

    return cpy
}

export const towerChoice = (cpy: ChoiceModel, bal: ChoiceBit, ste: State) => {
    return cpy
}
