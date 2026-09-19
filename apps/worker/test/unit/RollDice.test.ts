import { describe, it, expect } from 'vitest'

/**
 * RollDice tool — unit tests
 *
 * The RollDice tool is defined inline in src/index.ts and not exported.
 * We replicate its execute logic here to test the algorithm in isolation.
 */

// Replicate the execute function from src/index.ts
async function rollDiceExecute(
    _id: any,
    args: { number_of_dice: number; sides_per_die: number; reason: string },
) {
    const rolls: number[] = []
    let total = 0
    const num = args.number_of_dice || 1
    const sides = args.sides_per_die || 20

    for (let i = 0; i < num; i++) {
        const roll = Math.floor(Math.random() * sides) + 1
        rolls.push(roll)
        total += roll
    }

    const receipt = JSON.stringify({
        action: 'DICE_ROLLED',
        reason: args.reason,
        total,
        rolls,
    })
    return {
        content: [{ type: 'text', text: receipt }],
        details: { total, rolls },
    }
}

describe('RollDice Tool', () => {
    it('returns content with a text entry containing JSON receipt', async () => {
        const result = await rollDiceExecute(null, {
            number_of_dice: 2,
            sides_per_die: 6,
            reason: 'Testing',
        })

        expect(result.content).toHaveLength(1)
        expect(result.content[0].type).toBe('text')

        const parsed = JSON.parse(result.content[0].text)
        expect(parsed).toHaveProperty('action', 'DICE_ROLLED')
        expect(parsed).toHaveProperty('reason', 'Testing')
        expect(parsed).toHaveProperty('total')
        expect(parsed).toHaveProperty('rolls')
    })

    it('returns the correct number of rolls', async () => {
        const result = await rollDiceExecute(null, {
            number_of_dice: 4,
            sides_per_die: 8,
            reason: 'Testing',
        })
        const parsed = JSON.parse(result.content[0].text)

        expect(parsed.rolls).toHaveLength(4)
    })

    it('total equals the sum of all rolls', async () => {
        const result = await rollDiceExecute(null, {
            number_of_dice: 3,
            sides_per_die: 6,
            reason: 'Testing',
        })
        const parsed = JSON.parse(result.content[0].text)

        const sum = parsed.rolls.reduce((a: number, b: number) => a + b, 0)
        expect(parsed.total).toBe(sum)
    })

    it('all rolls are within valid bounds [1, sides]', async () => {
        const sides = 10
        const result = await rollDiceExecute(null, {
            number_of_dice: 100,
            sides_per_die: sides,
            reason: 'Testing',
        })
        const parsed = JSON.parse(result.content[0].text)

        for (const roll of parsed.rolls) {
            expect(roll).toBeGreaterThanOrEqual(1)
            expect(roll).toBeLessThanOrEqual(sides)
        }
    })

    it('defaults to 1 die when number_of_dice is falsy', async () => {
        const result = await rollDiceExecute(null, {
            number_of_dice: 0,
            sides_per_die: 6,
            reason: 'Testing',
        })
        const parsed = JSON.parse(result.content[0].text)

        expect(parsed.rolls).toHaveLength(1)
    })

    it('defaults to 20 sides when sides_per_die is falsy', async () => {
        const result = await rollDiceExecute(null, {
            number_of_dice: 1,
            sides_per_die: 0,
            reason: 'Testing',
        })
        const parsed = JSON.parse(result.content[0].text)

        expect(parsed.rolls).toHaveLength(1)
        expect(parsed.rolls[0]).toBeGreaterThanOrEqual(1)
        expect(parsed.rolls[0]).toBeLessThanOrEqual(20)
    })

    it('returns details with numerical values', async () => {
        const result = await rollDiceExecute(null, {
            number_of_dice: 2,
            sides_per_die: 6,
            reason: 'Testing',
        })

        expect(result.details).toHaveProperty('total')
        expect(result.details).toHaveProperty('rolls')
        expect(Array.isArray(result.details.rolls)).toBe(true)
    })
})
