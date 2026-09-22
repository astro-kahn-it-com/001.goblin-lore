import type Lore from './fce/lore.interface.js';

export class LoreModel implements Lore {
  idx: string = '001.lore';
  lastStateHash: string | null = null;
  lastEntityCount: number = 0;
}
