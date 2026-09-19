import type { LibraryModel } from '../library.model'
import type LibraryBit from '../fce/library.bit'
import type State from '../../99.core/state'

import * as ActMnu from '../../98.menu.unit/menu.action'
import * as ActBus from '../../99.bus.unit/bus.action'
import * as ActCns from '../../83.console.unit/console.action'

import * as ActLib from '../library.action'

let bit, val, idx, dex, lst, dat

const exec = require('child_process').exec

export const initLibrary = async (
    cpy: LibraryModel,
    bal: LibraryBit,
    ste: State,
) => {
    global.SOWER = null
    global.TIME = null

    global.SOLID = null
    global.PIXEL = null

    if (bal.dat != null)
        bit = await ste.hunt(ActBus.INIT_BUS, {
            idx: cpy.idx,
            lst: [ActLib],
            dat: bal.dat,
            src: bal.src,
        })

    //setInterval( async ()=>{

    //   ste.bus("[Open action] Open Pixel", {})

    //}, 4444 )

    //if (bal.val == 1) patch(ste, ActMnu.INIT_MENU, bal);
    bit = await ste.hunt(ActMnu.INIT_MENU, bal)
    if (bal.slv != null) bal.slv({ intBit: { idx: 'init-mythos' } })

    return cpy
}

export const listLibrary = (cpy: LibraryModel, bal: LibraryBit, ste: State) => {
    const fs = require('fs')
    const path = require('path')

    const resultList = []
    const parentDir = process.cwd()
    const IGNORE = new Set([
        'node_modules',
        '.git',
        'dist',
        'page',
        '$RECYCLE.BIN',
        'Config.Msi',
        'vision',
    ])

    function hasDirectUnits(dir: string) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true })
            for (const entry of entries) {
                if (
                    entry.isDirectory() &&
                    /^\d{2}\..+\.unit$/.test(entry.name)
                ) {
                    return true
                }
            }
        } catch (e) {
            // Ignore read errors
        }
        return false
    }

    function findPivots(dir, results, depth = 0) {
        if (depth > 3) return // Limit depth to prevent freezes
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true })
            for (const entry of entries) {
                if (!entry.isDirectory()) continue
                if (IGNORE.has(entry.name)) continue

                const targetPath = path.join(dir, entry.name)

                if (/^\d{3}\./.test(entry.name)) {
                    if (hasDirectUnits(targetPath)) {
                        const relativePath = path.relative(
                            parentDir,
                            targetPath,
                        )
                        results.push(`[${relativePath.replace(/\\/g, '/')}]`)
                    }
                }

                findPivots(targetPath, results, depth + 1)
            }
        } catch (e) {
            // Ignore directory read errors
        }
    }

    try {
        const topLevelEntries = fs.readdirSync(parentDir, {
            withFileTypes: true,
        })

        for (const entry of topLevelEntries) {
            if (!entry.isDirectory()) continue
            if (IGNORE.has(entry.name)) continue

            const projectPath = path.join(parentDir, entry.name)

            if (/^\d{3}\./.test(entry.name) && hasDirectUnits(projectPath)) {
                const relativePath = path.relative(parentDir, projectPath)
                resultList.push(`[${relativePath.replace(/\\/g, '/')}]`)
            }

            findPivots(projectPath, resultList)
        }
    } catch (err) {
        console.error(`Error in listLibrary: ${err.message}`)
    }

    bal.slv({ libBit: { idx: 'list-library', lst: resultList, src: bal.idx } })
    return cpy
}

export const updateLibrary = async (
    cpy: LibraryModel,
    bal: LibraryBit,
    ste: State,
) => {
    const FS = require('fs-extra')
    const doT = require('dot')
    const S = require('string')
    const path = require('path')

    let title = '995.library'
    const file = './data/redux/BEE.txt'
    const fileFin = './data/redux/BEE.ts'

    title = bal.src
    if (title) title = title.replace(/[\[\]]/g, '')

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1)
    }

    const targetDir = path.resolve(title)
    const list = FS.readdirSync(targetDir)
    const lineList = FS.readFileSync(file).toString().split('\n')

    const out = []
    const dirList = []

    const itemList = []

    list.forEach(async (a, b) => {
        const checkPath = path.join(targetDir, a)

        if (FS.lstatSync(checkPath).isDirectory()) {
            if (S(checkPath).contains('unit') == false) return

            const directory = checkPath + '/'
            const element = a.split('.')[1]

            const unitName = capitalizeFirstLetter(element)

            const unitImportSrc = './' + a + '/' + element + '.unit'
            const unitImportSte =
                'import ' + unitName + 'Unit from "' + unitImportSrc + '";'

            const faceImportSrc = './' + a + '/fce/' + element + '.interface'
            let faceImportSte =
                'import ' + unitName + ' from "' + faceImportSrc + '";'

            const modlImportSrc = './' + a + '/' + element + '.model'
            const modlImportSte =
                'import { ' + unitName + 'Model } from "' + modlImportSrc + '";'

            const redcImportSrc = './' + a + '/' + element + '.reduce'
            const redcImportSte =
                'import * as reduceFrom' +
                unitName +
                ' from "' +
                redcImportSrc +
                '";'

            const reduced = element + ' : reduceFrom' + unitName + '.reducer'
            let model =
                element + ' : ' + unitName + ' = new ' + unitName + 'Model();'

            if (unitName === 'Model') {
                faceImportSte =
                    'import ModelInterface from "' + faceImportSrc + '";'
                model =
                    element + ' : ModelInterface = new ' + unitName + 'Model();'
            }

            const item = {
                model,
                reduced,
                redcI: redcImportSte,
                modlI: modlImportSte,
                facI: faceImportSte,
                untI: unitImportSte,
                unitName,
                element,
            }

            itemList.push(item)
        }
    })

    let unitImports = ''
    itemList.forEach((a) => {
        unitImports += a.untI + '\n'
    })

    let faceImports = ''
    itemList.forEach((a) => {
        faceImports += a.facI + '\n'
        faceImports += a.modlI + '\n'
    })

    const unitListNom = []
    itemList.forEach((a) => {
        unitListNom.push(a.unitName + 'Unit')
    })

    let unitList = JSON.stringify(unitListNom) + ';'
    unitList = S(unitList).replaceAll('"', '')

    let reduceImports = ''
    itemList.forEach((a) => {
        reduceImports += a.redcI + '\n'
    })

    let reduceList = ''
    itemList.forEach((a, b) => {
        //if (b == reduceList.length - 1) return;
        reduceList += a.reduced + ', \n'
    })

    //reduceList += itemList[itemList.length - 1].reduced + "\n";

    let modelList = ''
    itemList.forEach((a, b) => {
        modelList += a.model + '\n'
    })

    const gel = {
        unitImports,
        faceImports,
        unitList,
        reduceImports,
        reduceList,
        modelList,
    }

    const writeLine = []

    lineList.forEach(async (a, b) => {
        if (S(a).contains('//')) return

        const doTCompiled = doT.template(a)
        const outLine = doTCompiled(gel)

        writeLine.push(outLine)
    })

    writeLine.forEach(async (a) => {
        bit = await ste.hunt(ActCns.UPDATE_CONSOLE, {
            idx: 'cns00',
            src: 'line : ' + a,
        })
    })

    const finFile = writeLine.join('\n')

    FS.ensureFileSync(fileFin)

    const endLoc = path.join(targetDir, 'BEE.ts')

    finFile

    FS.writeFileSync(endLoc, finFile)

    bit = await ste.hunt(ActCns.UPDATE_CONSOLE, {
        idx: 'cns00',
        src: 'writing ' + endLoc,
    })

    bal.slv({ libBit: { idx: 'update-library' } })
    return cpy
}

export const progessLibrary = (
    cpy: LibraryModel,
    bal: LibraryBit,
    ste: State,
) => {
    const fs = require('fs')
    const path = require('path')

    if (!bal.src) {
        if (bal.slv)
            bal.slv({
                libBit: {
                    idx: 'progess-library-error',
                    src: 'No src provided',
                },
            })
        return cpy
    }

    const targetDir = path.resolve(process.cwd(), bal.src)
    const sourceDir = path.resolve(process.cwd(), 'apps', '995.library')

    //a console message here updating the library menu what is happening would be nice

    try {
        //is there any way to use an async version of fs.exists
        if (fs.existsSync(targetDir)) {
            fs.rmSync(targetDir, { recursive: true, force: true })
        }

        //is there any way to use an async version of fs.cp
        fs.cpSync(sourceDir, targetDir, { recursive: true })

        //a console message updating what is happening would be nice

        if (bal.slv)
            bal.slv({ libBit: { idx: 'progess-library', src: bal.src } })
    } catch (err) {
        debugger

        //a console message here updating the library menu what is happening would be nice

        if (bal.slv)
            bal.slv({
                libBit: { idx: 'progess-library-error', src: err.message },
            })
    }

    return cpy
}

export const scanLibrary = async (
    cpy: LibraryModel,
    bal: LibraryBit,
    ste: State,
) => {
    const fs = require('fs').promises
    const path = require('path')

    const resultList = []
    const upperLevel = path.resolve(process.cwd(), '..')
    const currentAppPath = path
        .resolve(process.cwd(), 'apps', '995.library')
        .replace(/\\/g, '/')

    async function scanDir(dir, depth) {
        if (depth > 4) return
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true })
            for (const entry of entries) {
                if (!entry.isDirectory()) continue
                if (
                    entry.name === 'node_modules' ||
                    entry.name === '.git' ||
                    entry.name === 'dist'
                )
                    continue

                const fullPath = path.join(dir, entry.name)
                const normalizedPath = fullPath.replace(/\\/g, '/')

                if (
                    normalizedPath.endsWith('apps/995.library') &&
                    normalizedPath !== currentAppPath
                ) {
                    resultList.push(
                        path
                            .relative(process.cwd(), fullPath)
                            .replace(/\\/g, '/'),
                    )
                } else {
                    await scanDir(fullPath, depth + 1)
                }
            }
        } catch (e) {
            // ignore
            debugger
        }
    }

    await scanDir(upperLevel, 0)

    if (bal.slv) {
        bal.slv({ libBit: { idx: 'scan-library', lst: resultList } })
    }

    return cpy
}

var patch = (ste, type, bale) => ste.dispatch({ type, bale })
