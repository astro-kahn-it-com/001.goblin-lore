
import * as ActLor from '../../00.lore.unit/lore.action.js';
import type { MenuModel } from '../menu.model.js';
import type MenuBit from '../fce/menu.bit.js';

let rootSlv: any;

export const initMenu = async (cpy: MenuModel, bal: MenuBit, ste: any) => {
  if (bal.slv) rootSlv = bal.slv;

  // @ts-ignore
  if (global.LIBRARY) {
    // @ts-ignore
    await global.LIBRARY.hunt('[Grid action] Update Grid', { x: 4, y: 0, xSpan: 8, ySpan: 12 });
    // @ts-ignore
    await global.LIBRARY.hunt('[Console action] Update Console', { idx: 'cns00', src: '-----------' });
    // @ts-ignore
    await global.LIBRARY.hunt('[Console action] Update Console', { idx: 'cns00', src: 'LORE SYSTEM MENU' });
    // @ts-ignore
    await global.LIBRARY.hunt('[Console action] Update Console', { idx: 'cns00', src: '-----------' });
  }

  await updateMenu(cpy, bal, ste);
  return cpy;
};

export const updateMenu = async (cpy: MenuModel, bal: MenuBit, ste: any) => {
  const lst = ['COMPILE LORE INSTANCE', 'ROOT MENU'];

  // @ts-ignore
  const bit = await global.LIBRARY.hunt('[Grid action] Update Grid', { x: 0, y: 4, xSpan: 4, ySpan: 8 });
  // @ts-ignore
  const choice = await global.LIBRARY.hunt('[Open action] Open Choice', {
    dat: { clr0: 'black', clr1: 'yellow' },
    src: 'vertical',
    lst,
    net: bit.grdBit.dat,
  });

  const src = choice.chcBit.src;
  switch (src) {
    case 'COMPILE LORE INSTANCE':
      await ste.hunt(ActLor.COMPILE_LORE, {});
      break;
    case 'ROOT MENU':
      if (rootSlv) rootSlv({ mnuBit: { idx: 'root-menu' } });
      return cpy;
    default:
      break;
  }

  setTimeout(async () => {
    await updateMenu(cpy, bal, ste);
  }, 333);

  return cpy;
};
