import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'
import * as grammar from '../../src/grammar'

describe('block valid', () => {

    it('block-valid 1', () =>{
        assert.deepStrictEqual(tp.simpleResult(tp.parseRuleNoLocationNoEmptyChildren('top-decl', 
`
contract C1 =
    entrypoint foo() = v
    entrypoint bar() = w
`
        ) as grammar.AstItem), {
            type : 'top-contract-decl',
            children : [{
                type : 'entrypoint-decl',
                children : [{
                    type : 'func-decl',
                    children : [{
                        type : 'expr'
                    }]
                }]
            }, {
                type : 'entrypoint-decl',
                children : [{
                    type : 'func-decl',
                    children : [{
                        type : 'expr'
                    }]
                }]
            }]

        })
    })

    // FIXME: Remove this test? Traling content error not check on top-decl now
    it.skip('block-valid 2', () =>{
        const result = tp.parseRule('top-decl', 
`
contract FactorialServer =
    entrypoint fac : (string) => int

contract Factorial =
`)
    
        //console.log('#####=', result.scanner.peekToken())
        //console.log('result.errors=', result.errors)
 
        const pos = result.scanner.pos()
        delete pos.pos
        assert.deepStrictEqual(pos, {
           line : 3,
           col  : 37
        })

        assert.equal(result.errors.length, 1)
        assert.deepStrictEqual(result.errors, [{
            filename : undefined,
            err: {
                message: 'Trailing content "contract Factorial ="',
                location: {
                    begin : {
                        offset : 66,
                        line   : 5,
                        column : 1
                    },
                    end : {
                        offset : 86,
                        line   : 5,
                        column : 21
                    }
                }
              }          
        }])
    })


    it('block-valid private functions', () =>{
        const result = tp.parseRule('top-decl', 
`
namespace Frac =

  private function gcd() = 1
  private function absint() = 2

`)
    
        //console.log('#####=', result.scanner.peekToken())
        //console.log('result.errors=', result.errors)
        //console.log('result.ast=', result.ast)

        assert.strictEqual(result.scanner.peekToken(), false)
        const ast = result.ast as grammar.AstItem_TopNamespaceDecl

        assert.strictEqual(ast.type, 'top-namespace-decl')
        assert.strictEqual(ast.children.length, 2)
        assert.strictEqual(ast.children[0].type, 'function-decl')
        assert.strictEqual(ast.children[1].type, 'function-decl')
        
    })


})
