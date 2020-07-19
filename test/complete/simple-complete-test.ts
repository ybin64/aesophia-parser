import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'

import {AstItemType, AstItemNoLoc, AstItem} from '../../src/grammar'

//var parseRule = parser.parseRule;
//var parseRuleNoLocation = tp.parseRuleNoLocation


function _simpleTopDecl(text : string) : tp.SimpleItem {
    const ast : AstItemNoLoc = tp.parseRuleNoLocation('top-decl', text)!
    return tp.simpleResult(ast)
}

describe('simple complete', () => {
    it('simple complete 1', () => {
        assert.deepStrictEqual(_simpleTopDecl(
`
contract Foo =
  type t = int
  type u = int

`), {
    type : 'top-contract-decl',
    children : [{
        type : 'type-decl'
    }, {
        type : 'type-decl'
    }]
})
     })
})

