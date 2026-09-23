import type LoreBit from './fce/lore.bit.js'

export interface Action<T = any> {
    type: string
    bale?: T
}

export const INIT_LORE = '[Lore action] Init Lore'
export class InitLore implements Action<LoreBit> {
    readonly type = INIT_LORE
    constructor(public bale: LoreBit) {}
}

export const COMPILE_LORE = '[Lore action] Compile Lore'
export class CompileLore implements Action<LoreBit> {
    readonly type = COMPILE_LORE
    constructor(public bale: LoreBit) {}
}

export const AUDIT_LORE = '[Lore action] Audit Lore'
export class AuditLore implements Action<LoreBit> {
    readonly type = AUDIT_LORE
    constructor(public bale: LoreBit) {}
}

export type Actions = InitLore | CompileLore | AuditLore
