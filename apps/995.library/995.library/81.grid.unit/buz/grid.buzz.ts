export const initGrid = (cpy: GridModel, bal: GridBit, ste: State) => {
  debugger;
  return cpy;
};

export const updateGrid = (cpy: GridModel, bal: GridBit, ste: State) => {
  const termMod: TerminalModel = ste.value.terminal;

  const margin = 0;
  const cols = termMod.cols;
  const rows = termMod.rows;

  const colNow = bal.x;
  const rowNow = bal.y;

  const colSpan = bal.xSpan;
  const rowSpan = bal.ySpan;

  const spacing = 0;

  const cellWidth = (100 - margin * 2) / cols;
  const cellHeight = (100 - margin * 2) / rows;

  let top: any = rowNow * cellHeight + margin;
  let left: any = colNow * cellWidth + margin;

  top = top + '%';
  left = left + '%';

  const width = cellWidth * colSpan - spacing + '%';
  const height = cellHeight * rowSpan - spacing + '%';

  const bit: NetBit = { left, top, width, height };

  if (bal.slv != null) bal.slv({ grdBit: { idx: 'update-grid', dat: bit } });

  return cpy;
};

import type { GridModel } from '../grid.model';
import type GridBit from '../fce/grid.bit';
import type State from '../../99.core/state';
import type { TerminalModel } from '../../80.terminal.unit/terminal.model';
import type NetBit from '../fce/net.bit';
