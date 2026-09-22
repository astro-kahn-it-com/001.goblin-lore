import type { Action } from '../../../apps/995.library/995.library/99.core/interface/action.interface.js';
import type LoreBit from './fce/lore.bit.js';

export const INIT_LORE = '[Lore action] Init Lore';
export class InitLore implements Action {
  readonly type = INIT_LORE;
  constructor(public bale: LoreBit) {}
}

export const COMPILE_LORE = '[Lore action] Compile Lore';
export class CompileLore implements Action {
  readonly type = COMPILE_LORE;
  constructor(public bale: LoreBit) {}
}

export type Actions = InitLore | CompileLore;
