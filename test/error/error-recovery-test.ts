import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'
import * as grammar from '../../src/grammar'
import * as parser_lib from '../../src/parser-lib'
import { TokenError } from '../../src/scanner'

describe('error recovery include', () => {

    it('error-recovery-include 1', () => {
        const result = tp.parseRule('file',
// 3456789012
`
include "foo
include "bar"
`)


        assert.deepStrictEqual(tp.removeLocationAndEmptyChildren(result.ast), {
            type : 'file',
            children : [{
                type : 'top-include-decl',
                include : {
                    text : 'foo'
                },
                validIncludeToken : false
            }, {
                type : 'top-include-decl',
                include : {
                    text : 'bar'
                },
                validIncludeToken : true
            }]
        })

        assert.strictEqual(result.errors.length, 1)
        assert.strictEqual(result.errors[0].message, 'Missing string end quote')

        assert.deepStrictEqual(result.ast!.children[0].loc, {
            b : [1, 2, 1],
            e : [12, 2, 12]
        })

        assert.deepStrictEqual(tp.removeBEPosOffset(result.ast!.children[1].loc), {
            b : [3, 1],
            e : [3, 13]
        })
        
        // One column past non complete include string is considered inside the include string
        let f : parser_lib.InsideAstItem = parser_lib.insideAst(result.ast!, 2, 13)!
        assert.strictEqual(f.type, parser_lib.InsideAstItemType.IncompleteIncludeStr)

        // One past complete include string
        f = parser_lib.insideAst(result.ast!, 3, 14)!
        assert.strictEqual(f.ast.type, 'top-include-decl')
        assert.strictEqual(f.type, parser_lib.InsideAstItemType.Default)

    })
})


describe('error recovery function', () => {
    
    it('error-recovery-function 1', () => {
        const result = tp.parseRule('file',
// 3456789012
`
contract C =
  function foo() = Foo.
  function bar() = Bar.b
`)
        assert.deepStrictEqual(tp.removeLocationAndEmptyChildren(result.ast), {
            type : 'file',
            children : [{
                type : 'top-contract-decl',
                payable : false,
                con : {
                    text : 'C'
                },
                children: [{
                    type : 'function-decl',
                    children : [{
                        type : 'func-decl',
                        funcDeclType : 'definition',
                        args : [],
                        id : {
                            text : 'foo'
                        }, 
                        children : [{
                            type : 'expr',
                            exprType : 'identifier',
                            idType : 'qid',
                            invalidToken : TokenError.TrailingQIdDot,
                            identifier : {
                                text : 'Foo.'
                            }
                        }]
                    }]
                }, {
                    type : 'function-decl',
                    children : [{
                        type : 'func-decl',
                        funcDeclType : 'definition',
                        args : [],
                        id : {
                            text : 'bar'
                        },
                        children : [{
                            type : 'expr',
                            exprType : 'identifier',
                            idType : 'qid',
                            identifier : {
                                text : 'Bar.b'
                            }
                        }]
                    }]
                }]
            }]
        })

        assert.strictEqual(result.errors.length, 1)
        assert.strictEqual(result.warnings.length, 0)

        assert.deepStrictEqual(tp.removeLocationOffsetFromErrors(result.errors), [{
            filename : undefined,
            message : 'Invalid identifier',
            location : {
                begin : {
                    line : 3,
                    column : 20
                },
                end : {
                    line : 3, 
                    column : 24
                }
            }
        }])
    })
})