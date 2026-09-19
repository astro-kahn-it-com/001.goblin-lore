import type Terminal from './fce/terminal.interface'
import TerminalBit from './fce/terminal.interface'

export class TerminalModel implements Terminal {
    idx = '998.terminal'
    term: any

    rootIDX: any
    rootDAT: any

    blessed: any
    contrib: any
    screen: any

    cols = 12
    rows = 12
}
