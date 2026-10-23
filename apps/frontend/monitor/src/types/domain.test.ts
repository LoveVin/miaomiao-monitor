import { describe, expect, it } from 'vitest'

import { APPLICATION_TYPES } from '@/types/domain'

describe('application types', () => {
    it('exposes exactly the four supported application types', () => {
        expect(APPLICATION_TYPES).toEqual(['Vanilla', 'React', 'Vue', 'Node.js'])
    })
})
