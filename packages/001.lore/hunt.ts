import { BehaviorSubject } from 'rx-lite'
import * as Import from './BEE.js'

class State extends BehaviorSubject<any> {
    hunt: any
    constructor(init = new Import.default()) {
        super(init)
    }
    dispatch(act: any) {
        const curr = this.getValue()
        for (const key in Import.reducer) {
            Import.reducer[key](curr[key], act, this)
        }
        this.onNext(curr)
    }
}

const sim: any = {
    hunt: null,
    state: null,
}

sim.hunt = (typ: string, obj: any = {}) => {
    if (!sim.state) {
        sim.state = new State()
        sim.state.hunt = sim.hunt
        for (const UnitClass of Import.list) {
            new UnitClass(sim.state)
        }
    }
    return new Promise((resolve) => {
        obj.slv = resolve
        sim.state.dispatch({ type: typ, bale: obj })
    })
}

export default sim
