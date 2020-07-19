import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'
import * as grammar from '../../src/grammar'

describe('contract stmt', () => {
    it('contract-stmt bug 1', () => {

        const result = tp.parseRule('top-contract-decl',
`
contract ComplexTypes =

    function map(f, xs) =
        switch(xs)
            []      => []
            x :: xs => f(x) :: map(f, xs)

    entrypoint squares(n) =
       map((i) => (i, i * i), up_to(n))

`
        )

        //console.log('result.errors=', result.errors)
        assert.equal(result.scanner.peekToken(), false)

        const ast = result.ast as grammar.AstItem_TopContractDecl
        assert.equal(ast.children.length, 2)
        
    })
})