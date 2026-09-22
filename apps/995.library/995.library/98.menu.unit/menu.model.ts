import type Menu from './fce/menu.interface';
import MenuBit from './fce/menu.interface';

export class MenuModel implements Menu {
  lst: string[] = [];

  // Add a dynamic registry for menu options
  menuRoutes = new Map<string, Function>();
  menuRouteDescriptions = new Map<string, string>();

  geoJsonNow: any;
  atlasNow: any;
  sizeNow: any = 0;
  mapShape = 'none';
  mapNomNow = 'none';
  mapDimensions = 'none';

  shapeBit: any;
}
