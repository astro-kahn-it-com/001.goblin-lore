export interface Action<T = unknown> {
    type: string
    bale?: T
}
import type LoreBit from './fce/lore.bit.js'

export const INIT_LORE = '[Lore action] Init Lore'
export class InitLore implements Action {
    readonly type = INIT_LORE
    constructor(public bale: LoreBit) {}
}

export const COMPILE_LORE = '[Lore action] Compile Lore'
export class CompileLore implements Action {
    readonly type = COMPILE_LORE
    constructor(public bale: LoreBit) {}
}

export type Actions = InitLore | CompileLore
