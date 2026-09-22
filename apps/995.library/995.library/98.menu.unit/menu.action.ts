import type { Action } from '../99.core/interface/action.interface';
import type MenuBit from './fce/menu.bit';

export const INIT_MENU = '[Menu action] Init Menu';
export class InitMenu implements Action {
  readonly type = INIT_MENU;
  constructor(public bale: MenuBit) {}
}

export const OPEN_MENU = '[Menu action] Open Menu';
export class OpenMenu implements Action {
  readonly type = OPEN_MENU;
  constructor(public bale: MenuBit) {}
}

export const UPDATE_MENU = '[Menu action] Update Menu';
export class UpdateMenu implements Action {
  readonly type = UPDATE_MENU;
  constructor(public bale: MenuBit) {}
}

export const CLOSE_MENU = '[Menu action] Close Menu';
export class CloseMenu implements Action {
  readonly type = CLOSE_MENU;
  constructor(public bale: MenuBit) {}
}

export const LIBRARY_MENU = '[Menu action] Library Menu';
export class LibraryMenu implements Action {
  readonly type = LIBRARY_MENU;
  constructor(public bale: MenuBit) {}
}

export const PRINT_MENU = '[Render action] Print Menu';
export class PrintMenu implements Action {
  readonly type = PRINT_MENU;
  constructor(public bale: MenuBit) {}
}

export const ROUTE_MENU = '[Route action] Route Menu';
export class RouteMenu implements Action {
  readonly type = ROUTE_MENU;
  constructor(public bale: undefined) {}
}

export type Actions = OpenMenu | InitMenu | UpdateMenu | CloseMenu | PrintMenu | LibraryMenu | RouteMenu;
