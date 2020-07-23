
import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'
import * as grammar from '../../src/grammar'

/** 
 *  Builtin namespaces
 * 
 *     Bits
 *     String
 *     Bytes
 *     Int
 *     Map
 *     Address
 *     Crypto
 *     Auth 
 *     Oracle
 *     AENS
 *     Contract
 *     Call
 *     Chain
*/

/**
 * Explicit include needed for
 * 
 *     List
 *     Option
 *     Func
 *     Pair
 *     Triple
 *     BLS12_381
 *     Frac
 * 
 */

describe('include test internal', () => {

    it('include-internal syntax', () => {
        const result = tp.parseRule('file',
`
include "foo.aes"
include "bar.aes"
`)

        assert.ok(!!result.ast)
        assert.strictEqual(result.scanner.peekToken(), false)

        assert.strictEqual(result.errors.length, 0)
        assert.strictEqual(result.warnings.length, 0)

        assert.deepStrictEqual(tp.removeLocationAndEmptyChildren(result.ast), {
            type : 'file',
            children : [{
                type : 'top-include-decl',
                include : {
                    text : 'foo.aes'
                },
                validIncludeToken : true
            }, {

                type : 'top-include-decl',
                include : {
                    text : 'bar.aes'
                },
                validIncludeToken : true

            }]
        })
    })
})