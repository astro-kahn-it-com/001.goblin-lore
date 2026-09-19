/* eslint-disable */
import * as ActMnu from '../menu.action.js'
//import * as ActAgt from '../../00.agent.unit/agent.action.js';
import * as ActOlm from '../../00.agent.unit/agent.action.js'

import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import type State from '../../99.core/state.js'

import * as Grid from '../../val/grid.js'
import * as Align from '../../val/align.js'
import * as Color from '../../val/console-color.js'

import * as SHAPE from '../../val/shape.js'
import * as FOCUS from '../../val/focus.js'

let bit, lst, dex, idx, dat, src, val
let rootSlv

let agent, AGENT, CLICKUP

const UPDATE_GRID = '[Grid action] Update Grid'
const WRITE_CONSOLE = '[Write action] Write Console'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'
const CLOSE_TERMINAL = '[Close action] Close Terminal'
const PRINT_MENU = '[Render action] Print Menu'

export const initMenu = async (cpy: MenuModel, bal: MenuBit, ste: State) => {
    if (bal.slv != null) rootSlv = bal.slv

    bit = await global.LIBRARY.hunt(UPDATE_GRID, {
        x: 4,
        y: 0,
        xSpan: 8,
        ySpan: 12,
    })
    bit = await global.LIBRARY.hunt(WRITE_CONSOLE, {
        idx: 'cns00',
        src: '',
        dat: { net: bit.grdBit.dat, src: 'alligaor0' },
    })

    bit = await global.LIBRARY.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '-----------',
    })
    bit = await global.LIBRARY.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: 'agent MENU',
    })

    bit = await global.LIBRARY.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '-----------',
    })

    await updateMenu(cpy, bal, ste)

    return cpy
}

export const updateMenu = async (cpy: MenuModel, bal: MenuBit, ste: State) => {
    lst = [
        ActOlm.UPDATE_agent.split(']')[1],
        ActOlm.TEST_agent.split(']')[1],
        ActOlm.LIST_agent.split(']')[1],
        ActOlm.CONNECT_agent.split(']')[1],
        ActOlm.DISCONNECT_agent.split(']')[1],
        'GET / (Health Check)',
        'GET /warm (Warm sessions)',
        'GET /oracle (The Oracle)',
        'GET /kimi (Moonshot Kimi)',
        'ROOT MENU',
    ]

    bit = await global.LIBRARY.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })
    bit = await global.LIBRARY.hunt(OPEN_CHOICE, {
        dat: { clr0: Color.BLACK, clr1: Color.YELLOW },
        src: Align.VERTICAL,
        lst,
        net: bit.grdBit.dat,
    })

    src = bit.chcBit.src

    switch (src) {
        case ActOlm.UPDATE_agent.split(']')[1]:
            bit = await ste.hunt(ActOlm.UPDATE_agent, {
                content: 'agent Menu Selected',
            })
            bit = await global.LIBRARY.hunt(PRINT_MENU, bit)
            break

        case ActOlm.TEST_agent.split(']')[1]:
            bit = await ste.hunt(ActOlm.TEST_agent, {
                content: 'agent Menu Selected',
            })
            bit = await global.LIBRARY.hunt(PRINT_MENU, bit)
            break

        case ActOlm.LIST_agent.split(']')[1]:
            bit = await ste.hunt(ActOlm.LIST_agent, {})
            lst = bit.olmBit.lst

            if (lst.length === 0) {
                bit = await global.LIBRARY.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: 'No agent Models Found',
                })
            } else {
                bit = await global.LIBRARY.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: 'Listing agent Models...',
                })
                lst.forEach((a: string) =>
                    global.LIBRARY.hunt(UPDATE_CONSOLE, {
                        idx: 'cns00',
                        src: a,
                    }),
                )
            }

            await new Promise((resolve) => setTimeout(resolve, 3000))
            break

        case ActOlm.CONNECT_agent.split(']')[1]:
            bit = await global.LIBRARY.hunt(UPDATE_GRID, {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: 8,
            })
            bit = await global.LIBRARY.hunt(OPEN_CHOICE, {
                dat: { clr0: Color.BLACK, clr1: Color.YELLOW },
                src: Align.VERTICAL,
                lst: ['LOCAL', 'REMOTE'],
                net: bit.grdBit.dat,
            })

            if (bit.chcBit.src === 'LOCAL') {
                bit = await global.LIBRARY.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: 'Starting Local agent...',
                })

                const { spawn } = await import('child_process')
                const path = await import('path')

                if ((global as any).localagentProcess) {
                    ;(global as any).localagentProcess.kill()
                }

                const workerPath = path.resolve('./apps/worker')
                ;(global as any).localagentProcess = spawn(
                    'npm.cmd',
                    ['run', 'dev'],
                    { cwd: workerPath, shell: true },
                )

                process.on('exit', () => {
                    if ((global as any).localagentProcess)
                        (global as any).localagentProcess.kill()
                })

                await new Promise((resolve) => setTimeout(resolve, 3000))
                bit = await global.LIBRARY.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: 'Connecting to Local agent...',
                })
                bit = await ste.hunt(ActOlm.CONNECT_agent, { src: 'LOCAL' })
            } else if (bit.chcBit.src === 'REMOTE') {
                bit = await global.LIBRARY.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: 'Connecting to Remote agent...',
                })
                bit = await ste.hunt(ActOlm.CONNECT_agent, { src: 'REMOTE' })
            }
            break

        case ActOlm.DISCONNECT_agent.split(']')[1]:
            bit = await global.LIBRARY.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: 'Disconnecting from agent...',
            })
            bit = await ste.hunt(ActOlm.DISCONNECT_agent, {})
            break

        case 'GET / (Health Check)':
            await testRoute('/', ste)
            break

        case 'GET /warm (Warm sessions)':
            await testRoute('/warm', ste)
            break

        case 'GET /oracle (The Oracle)':
            await testAiRoute('/oracle', ste)
            break

        case 'GET /kimi (Moonshot Kimi)':
            await testAiRoute('/kimi', ste)
            break

        case 'ROOT MENU':
            if (rootSlv != null) rootSlv({ mnuBit: { idx: 'root-menu' } })
            return cpy

        default:
            bit = await ste.hunt(CLOSE_TERMINAL, {})
            break
    }

    setTimeout(async () => {
        bit = await ste.hunt(ActMnu.UPDATE_MENU, {})
    }, 333)

    return cpy
}

const patch = (ste, type, bale) => ste.dispatch({ type, bale })

const testRoute = async (route: string, ste: State) => {
    const baseUrl =
        (global as any).agentBaseUrl ||
        'https://worker-agent.berad4000.workers.dev'
    const url = `${baseUrl}${route}`

    await global.LIBRARY.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `Fetching: ${url}`,
    })
    try {
        const res = await fetch(url)
        const text = await res.text()
        await global.LIBRARY.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `Response:\n${text}`,
        })
    } catch (err: any) {
        await global.LIBRARY.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `Error:\n${err.message}`,
        })
    }
    await new Promise((resolve) => setTimeout(resolve, 3000))
}

const testAiRoute = async (route: string, ste: State) => {
    const prompts = [
        'Roll a d20',
        'Roll 3 d6',
        'Flip a coin',
        'Tell me a short joke',
    ]

    const gridBit = await global.LIBRARY.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })
    const choiceBit = await global.LIBRARY.hunt(OPEN_CHOICE, {
        dat: { clr0: Color.BLACK, clr1: Color.YELLOW },
        src: Align.VERTICAL,
        lst: prompts,
        net: gridBit.grdBit.dat,
    })

    const prompt = choiceBit.chcBit.src
    const baseUrl =
        (global as any).agentBaseUrl ||
        'https://worker-agent.berad4000.workers.dev'
    const url = `${baseUrl}${route}?prompt=${encodeURIComponent(prompt)}`

    await global.LIBRARY.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `Fetching: ${url}`,
    })
    try {
        const res = await fetch(url)
        const text = await res.text()
        await global.LIBRARY.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `Response:\n${text}`,
        })
    } catch (err: any) {
        await global.LIBRARY.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `Error:\n${err.message}`,
        })
    }
    await new Promise((resolve) => setTimeout(resolve, 5000))
}
