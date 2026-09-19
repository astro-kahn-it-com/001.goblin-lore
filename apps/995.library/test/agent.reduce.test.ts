import test from 'ava'
import clone from 'clone-deep'
import { AgentModel } from '../995.library/01.agent.unit/agent.model'
import { reducer } from '../995.library/01.agent.unit/agent.reduce'
import * as Act from '../995.library/01.agent.unit/agent.action'

// ---------------------------------------------------------------------------
// Reducer dispatch tests
// ---------------------------------------------------------------------------

test('reducer — returns default model when no action matches', (t) => {
    const model = new AgentModel()
    const result = reducer(model, { type: 'UNKNOWN_ACTION', bale: {} } as any)

    // Default case returns the model unchanged
    t.deepEqual(result, model)
})

test('reducer — UPDATE_AGENT action type matches the expected constant', (t) => {
    t.is(Act.UPDATE_AGENT, '[Agent action] Update Agent')
})

test('reducer — INIT_AGENT action type matches the expected constant', (t) => {
    t.is(Act.INIT_AGENT, '[Agent action] Init Agent')
})

test('reducer — ORACLE_AGENT action type matches the expected constant', (t) => {
    t.is(Act.ORACLE_AGENT, '[Oracle action] Oracle Agent')
})

test('reducer — Action classes carry the correct type', (t) => {
    const initAction = new Act.InitAgent({ idx: 'test' } as any)
    t.is(initAction.type, Act.INIT_AGENT)

    const updateAction = new Act.UpdateAgent({ idx: 'test' } as any)
    t.is(updateAction.type, Act.UPDATE_AGENT)

    const oracleAction = new Act.OracleAgent({ idx: 'test' } as any)
    t.is(oracleAction.type, Act.ORACLE_AGENT)
})

test('reducer — Action classes store the bale', (t) => {
    const bale = { idx: 'test-bale', src: 'hello' }
    const action = new Act.UpdateAgent(bale as any)
    t.deepEqual(action.bale, bale)
})

test('reducer — clones model before passing to buzzer (immutability)', (t) => {
    const model = new AgentModel()
    const original = clone(model)

    // INIT_AGENT calls initAgent which just returns cpy (the clone).
    // The reducer clones the model via clone-deep before passing to the buzzer.
    // Since AgentModel is currently empty, we verify the original was not mutated
    // and that the reducer call succeeds without error.
    const result = reducer(model, { type: Act.INIT_AGENT, bale: {} } as any)

    // The original model should be unchanged
    t.deepEqual(model, original)
    // The result should still be a valid AgentModel instance
    t.truthy(result)
})
