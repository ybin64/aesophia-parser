import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'
import * as grammar from '../../src/grammar'

describe('entrypoint decl', () => {

    it('entrypoint-decl simple 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('entrypoint-decl',
'entrypoint main() = x'
        ), {
            type : 'entrypoint-decl',
               
            children : [{
                type : 'func-decl',
                funcDeclType : 'definition',
                id   : {text : 'main'},
                args : [],
                children : [{
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'x'
                    }
                }]
            }]
        })
    })


    it('entrypoint-decl payable', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('entrypoint-decl',
'payable entrypoint main() = x'
        ), {
            type : 'entrypoint-decl',
            eModifier : {
                text : 'payable'
            },

            children : [{
                type : 'func-decl', 
                funcDeclType : 'definition',
            
                id   : {text : 'main'},
                args : [],
                children : [{
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'x'
                    }
                }]
            }]
        })
    })

    it('entrypoint-decl stateful', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('entrypoint-decl',
'stateful entrypoint main() = x'
        ), {
            type : 'entrypoint-decl',
            eModifier : {
                text : 'stateful'
            },

            children : [{
                type : 'func-decl', 
                funcDeclType : 'definition',
            
                id   : {text : 'main'},
                args : [],
                children : [{
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'x'
                    }
                }]
            }]
        })
    })

/*
    it('entrypoint-decl projection', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('entrypoint-decl',
'entrypoint get()     = state.value'
        ), {
            type : 'entrypoint-decl',
            id   : {text : 'main'},
            args : [],
            children : [{
                type : 'projection',
                exprType : 'identifier',
                identifier : {
                    text : 'x'
                }
            }]
        })
    })
 */



    it('entrypoint-decl complex 1', () => {
        const result = tp.parseRule('entrypoint-decl',
`
entrypoint remote_triangle(worker, n) : answer(int) =
    let xs = worker.up_to(gas = 100000, n)
    let t  = workerr.sum(xs)
    let t = 1
    { label = "answer:", result = t }
`
/*
  let t  = worker.sum(xs)

  { label = "answer:", result = t }

`
*/
        )

        //console.log('errors=', result.errors[0].err)
        const ast = tp.removeLocationAndEmptyChildren(result.ast)
        //console.log('ast=', ast)
        //console.log('ast.children[0]=', ast.children[0])
        //console.log('peekToken=', result.scanner.peekToken())


        assert.equal(0, result.errors.length)
        assert.equal(0, result.warnings.length)


        const children : grammar.AstItem_Stmt_Let[] = ast.children[0].children as grammar.AstItem_Stmt_Let[]
        const childrenExpr : grammar.AstItem_Expr[] = ast.children[0].children as grammar.AstItem_Expr[]
        
        assert.equal(children.length, 4)

        assert.equal(children[0].type, 'stmt')
        assert.equal(children[0].stmtType, 'let')
        assert.equal(children[0].letStmtType, 'value-definition')

        assert.equal(children[1].type, 'stmt')
        assert.equal(children[1].stmtType, 'let')
        assert.equal(children[1].letStmtType, 'value-definition')

        assert.equal(children[2].type, 'stmt')
        assert.equal(children[2].stmtType, 'let')
        assert.equal(children[2].letStmtType, 'value-definition')

        assert.equal(childrenExpr[3].type, 'expr')
        assert.equal(childrenExpr[3].exprType, 'record-or-map-value')
    })

   
    it('entrypoint-decl pair 1', () => {
        // From complex_types.aes
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('entrypoint-decl',
'entrypoint pair(x : int, y : string) = (x, y)'
        ), {
            type : 'entrypoint-decl',
         


            children : [{
                type : 'func-decl', 
                funcDeclType : 'definition',
            
                id   : {text : 'pair'},
                args : [{
                    type : 'expr',
                    exprType : 'type-annotation',
                    children : [{
                        type : 'expr',
                        exprType : 'identifier',
                        idType : 'id',
                        identifier : {
                            text : 'x'
                        }
                    }, {
                        type : 'type',
                        specificType : 'literal',
                        literalType : 'int'
                    }]
                }, {
                    type : 'expr',
                    exprType : 'type-annotation',
                    children : [{
                        type : 'expr',
                        exprType : 'identifier',
                        idType : 'id',
                        identifier : {
                            text : 'y'
                        }
                    }, {
                        type : 'type',
                        specificType : 'literal',
                        literalType : 'string'
                    }]
                }],
                children : [{
                    type : 'expr',
                    exprType : 'pair',

                    children : [{
                        type : 'expr',
                        exprType : 'identifier',
                        idType : 'id',
                        identifier : {
                            text : 'x'
                        }
                    }, {
                        type : 'expr',
                        exprType : 'identifier',
                        idType : 'id',
                        identifier : {
                            text : 'y'
                        }    
                    }]
                }]
            }]
        })
    })

    it('entrypoint-decl map 1', () => {
        // From complex_types.aes

        const result = tp.parseRule('entrypoint-decl',
`
entrypoint squares(n) =
    map((i) => (i, i * i), up_to(n))
`
        )

        //console.log('result.ast=', result.ast!.children[0].children[0])

        assert.equal(result.scanner.peekToken(), false)
        const app = result.ast!.children[0].children[0] as grammar.AstItem_Expr_Application

        assert.equal(app.expr.exprType, 'identifier')
        assert.equal(app.expr.identifier!.text, 'map')
        assert.equal(app.children.length, 2)
        assert.equal((app.children[0] as grammar.AstItem_Expr).exprType, 'anonymous-function')
        assert.equal((app.children[1] as grammar.AstItem_Expr).exprType, 'application')
       
    })


})