import Model from './99.core/interface/model.interface'

import LibraryUnit from './00.library.unit/library.unit'
import AgentUnit from './01.agent.unit/agent.unit'
import UnitUnit from './01.unit.unit/unit.unit'
import ActionUnit from './02.action.unit/action.unit'
import OllamaUnit from './02.ollama.unit/ollama.unit'
import DataUnit from './03.data.unit/data.unit'
import ServerUnit from './04.server.unit/server.unit'
import TerminalUnit from './80.terminal.unit/terminal.unit'
import GridUnit from './81.grid.unit/grid.unit'
import ConsoleUnit from './83.console.unit/console.unit'
import InputUnit from './84.input.unit/input.unit'
import ChoiceUnit from './85.choice.unit/choice.unit'
import CollectUnit from './97.collect.unit/collect.unit'
import MenuUnit from './98.menu.unit/menu.unit'
import BusUnit from './99.bus.unit/bus.unit'

import Library from './00.library.unit/fce/library.interface'
import { LibraryModel } from './00.library.unit/library.model'
import Agent from './01.agent.unit/fce/agent.interface'
import { AgentModel } from './01.agent.unit/agent.model'
import Unit from './01.unit.unit/fce/unit.interface'
import { UnitModel } from './01.unit.unit/unit.model'
import Action from './02.action.unit/fce/action.interface'
import { ActionModel } from './02.action.unit/action.model'
import Ollama from './02.ollama.unit/fce/ollama.interface'
import { OllamaModel } from './02.ollama.unit/ollama.model'
import Data from './03.data.unit/fce/data.interface'
import { DataModel } from './03.data.unit/data.model'
import Server from './04.server.unit/fce/server.interface'
import { ServerModel } from './04.server.unit/server.model'
import Terminal from './80.terminal.unit/fce/terminal.interface'
import { TerminalModel } from './80.terminal.unit/terminal.model'
import Grid from './81.grid.unit/fce/grid.interface'
import { GridModel } from './81.grid.unit/grid.model'
import Console from './83.console.unit/fce/console.interface'
import { ConsoleModel } from './83.console.unit/console.model'
import Input from './84.input.unit/fce/input.interface'
import { InputModel } from './84.input.unit/input.model'
import Choice from './85.choice.unit/fce/choice.interface'
import { ChoiceModel } from './85.choice.unit/choice.model'
import Collect from './97.collect.unit/fce/collect.interface'
import { CollectModel } from './97.collect.unit/collect.model'
import Menu from './98.menu.unit/fce/menu.interface'
import { MenuModel } from './98.menu.unit/menu.model'
import Bus from './99.bus.unit/fce/bus.interface'
import { BusModel } from './99.bus.unit/bus.model'

export const list: Array<any> = [
    LibraryUnit,
    AgentUnit,
    UnitUnit,
    ActionUnit,
    OllamaUnit,
    DataUnit,
    ServerUnit,
    TerminalUnit,
    GridUnit,
    ConsoleUnit,
    InputUnit,
    ChoiceUnit,
    CollectUnit,
    MenuUnit,
    BusUnit,
]

import * as reduceFromLibrary from './00.library.unit/library.reduce'
import * as reduceFromAgent from './01.agent.unit/agent.reduce'
import * as reduceFromUnit from './01.unit.unit/unit.reduce'
import * as reduceFromAction from './02.action.unit/action.reduce'
import * as reduceFromOllama from './02.ollama.unit/ollama.reduce'
import * as reduceFromData from './03.data.unit/data.reduce'
import * as reduceFromServer from './04.server.unit/server.reduce'
import * as reduceFromTerminal from './80.terminal.unit/terminal.reduce'
import * as reduceFromGrid from './81.grid.unit/grid.reduce'
import * as reduceFromConsole from './83.console.unit/console.reduce'
import * as reduceFromInput from './84.input.unit/input.reduce'
import * as reduceFromChoice from './85.choice.unit/choice.reduce'
import * as reduceFromCollect from './97.collect.unit/collect.reduce'
import * as reduceFromMenu from './98.menu.unit/menu.reduce'
import * as reduceFromBus from './99.bus.unit/bus.reduce'

export const reducer: any = {
    library: reduceFromLibrary.reducer,
    agent: reduceFromAgent.reducer,
    unit: reduceFromUnit.reducer,
    action: reduceFromAction.reducer,
    ollama: reduceFromOllama.reducer,
    data: reduceFromData.reducer,
    server: reduceFromServer.reducer,
    terminal: reduceFromTerminal.reducer,
    grid: reduceFromGrid.reducer,
    console: reduceFromConsole.reducer,
    input: reduceFromInput.reducer,
    choice: reduceFromChoice.reducer,
    collect: reduceFromCollect.reducer,
    menu: reduceFromMenu.reducer,
    bus: reduceFromBus.reducer,
}

export default class UnitData implements Model {
    library: Library = new LibraryModel()
    agent: Agent = new AgentModel()
    unit: Unit = new UnitModel()
    action: Action = new ActionModel()
    ollama: Ollama = new OllamaModel()
    data: Data = new DataModel()
    server: Server = new ServerModel()
    terminal: Terminal = new TerminalModel()
    grid: Grid = new GridModel()
    console: Console = new ConsoleModel()
    input: Input = new InputModel()
    choice: Choice = new ChoiceModel()
    collect: Collect = new CollectModel()
    menu: Menu = new MenuModel()
    bus: Bus = new BusModel()
}
