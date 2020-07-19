import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'
import * as grammar from '../../src/grammar'

describe('function decl', () => {

    it('function-decl simple 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('function-decl',
'function main() = x'
        ), {
            type : 'function-decl',

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

    it('function-decl simple 2', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('function-decl',
'function main(val) = x'
        ), {
            type : 'function-decl',

            children : [{
                type : 'func-decl',
                funcDeclType : 'definition',
                id   : {text : 'main'},
                args : [{
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'val'
                    }
                }],
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

    it('function-decl stateful', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('function-decl',
'stateful function main() = x'
        ), {
            type : 'function-decl',
          
            fModifier : {
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

    it('function-decl private', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('function-decl',
'private function main() = x'
        ), {
            type : 'function-decl',
            fModifier : {
                text : 'private'
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


    it('function-decl id-type-signature 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('function-decl',
'function foo:int'
        ), {
            type : 'function-decl',

            children : [{
                type : 'func-decl', 
                funcDeclType : 'type-signature',
                id   : {text : 'foo'},
                returnType : {
                    type : 'type',
                    specificType : 'literal',
                    literalType : 'int'
                }
            }]
        })
    })


    it('function-decl id-type-signature 2', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('function-decl',
'function fac : (string) => int'
        ), {
            type : 'function-decl',

            children : [{
                type : 'func-decl',
                funcDeclType : 'type-signature',
                id   : {text : 'fac'},

                returnType : {
                    type : 'type',

                    specificType : 'function-type',
                    domain : {
                        type : 'domain',
                        children : [{
                            type : 'type',
                            specificType : 'literal',
                            literalType : 'string'
                        }]
                    },
                    functionType : {
                        type : 'type',
                        specificType : 'literal',
                        literalType  : 'int'
                    }
                }

            }]
        })
    })


    it('function-decl id-args-type-definition 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('function-decl',
'function foo(b : string) : int = 12'
        ), {
            type : 'function-decl',

            children : [{
                type : 'func-decl',
                funcDeclType : 'definition',
                id   : {text : 'foo'},
                args : [{
                    type : 'expr',
                    exprType : 'type-annotation',
                    children : [{
                        type : 'expr',
                        exprType : 'identifier',
                        idType : 'id',
                        identifier : {
                            text : 'b'
                        }
                    }, {
                        type : 'type',
                        specificType : 'literal',
                        literalType : 'string'
                    }]
                }],

                returnType : {
                    type : 'type',
                    specificType : 'literal',
                    literalType : 'int'
                },
                children : [{
                    type : 'expr',
                    exprType : 'literal',
                    literalType : 'int',
                    literal : {
                        text : '12'
                    }
                }]

            }]
        })
    })

    it('function-decl id-args-type-definition 2', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('function-decl',
'function foo():(string) = 12'
        ), {
            type : 'function-decl',

            children : [{
                type : 'func-decl',

                funcDeclType : 'definition',
                id   : {text : 'foo'},
                args : [],

                returnType : {
                    type : 'type',
                    specificType : 'parens',
                    children : [{
                        type : 'type',
                        specificType : 'literal',
                        literalType : 'string'
                    }]
                },

                children : [{
                    type : 'expr',
                    exprType : 'literal',
                    literalType : 'int',
                    literal : {
                        text : '12'
                    }
                }]

            }]

        })
    })


    it('function-decl id-args-type-definition 3', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('function-decl',
'function foo(0) = 1'
        ), {
            type : 'function-decl',
            
            children : [{
                type : 'func-decl',
                funcDeclType : 'definition',

                id   : {text : 'foo'},
                args : [{
                    type : 'expr',
                    exprType : 'literal',
                    literalType : 'int',
                    literal : {
                        text : '0'
                    }

                }],

                children : [{
                    type : 'expr',
                    exprType : 'literal',
                    literalType : 'int',
                    literal : {
                        text : '1'
                    }
                }]

            }]

        })
    })

    it('function-decl multiple rows 1', () => {
        const result = tp.parseRule('function-decl',
`
function 
    fac : int => int
    fac(0) = 1
    fac(x) = x * state.worker.fac(x - 1)
`
        )
        assert.deepStrictEqual(tp.simpleResult(result.ast!), {
            type : 'function-decl',
            children : [{
                type : 'func-decl',   
            }, {
                type : 'func-decl',
                children : [{
                    type : 'expr',
                }]

            }, {
                type : 'func-decl',
                children : [{
                        type : 'expr',
                        children : [{
                            type : 'expr'
                        }, {
                            type : 'expr',
                            children : [{
                                type : 'expr',
                                children : [{
                                    type : 'expr'
                                }, {
                                    type : 'expr'
                                }]
                            }]
                        }]
                    
                }]          
            }]
        })

        assert.equal(result.errors.length, 0)
        assert.equal(result.warnings.length, 0)
    })


    it('function-decl switch 1', () => {
        // From complex_types.aes

        const result = tp.parseRule('function-decl',
`
function map(f, xs) =
    switch(xs)
        []      => []
        x :: xs => f(x) :: map(f, xs)
`
        )

        //console.log('result.ast=', result.ast!.children[0].children[0])

        assert.equal(result.scanner.peekToken(), false)
        const sw = result.ast!.children[0].children[0] as grammar.AstItem_Stmt
        assert.equal(sw.stmtType, 'switch')
        assert.equal(sw.children.length, 2)
        assert.equal(sw.children[0].type, 'case')
        assert.equal(sw.children[1].type, 'case')
    })


    it('function-decl switch 2', () => {
        // From List.aes

        // First case ended up as a map lookup to next line

        const result = tp.parseRule('function-decl',
`
function last(l : list('a)) : option('a) = switch(l)
    []  => None
    [x] => Some(x)
    _::t => last(t)

`
        )

        //console.log('result.ast=', result.ast!.children[0].children[0])
        assert.strictEqual(result.errors.length, 0)
        assert.equal(result.scanner.peekToken(), false)
        const sw = result.ast!.children[0].children[0] as grammar.AstItem_Stmt
        assert.equal(sw.stmtType, 'switch')
        assert.equal(sw.children.length, 3)
        assert.equal(sw.children[0].type, 'case')
        assert.equal(sw.children[1].type, 'case')
        assert.equal(sw.children[2].type, 'case')
        
    })


})