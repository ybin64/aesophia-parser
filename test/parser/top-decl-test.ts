import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'

describe('top decl', () => {
    it('top-decl contract simple 1', () => {

        assert.deepStrictEqual(tp.parseRuleNoLocation('top-decl',
`
contract Foo = 
  type t = int

`
        ), {
            type : 'top-contract-decl',
        
            payable : false,
            con : {
                text : 'Foo'
            },
            children : [{
                type : 'type-decl',
                
                id : {
                    text : 't'
                },
                tVars : null,
                typeAlias : {
                    type : 'type',
                    specificType : 'literal',
                    literalType  : 'int',
                    children : []
                },                  
                
                children : []
            }]
        });
        
    })

    it('top-decl namespace simple 1', () => {

        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('top-decl',
`
namespace Foo = 
  type t = int
  function bar() = 1

`
        ), {
            type : 'top-namespace-decl',
        
            con : {
                text : 'Foo'
            },
            children : [{
                type : 'type-decl',
                
                id : {
                    text : 't'
                },
                tVars : null,
                typeAlias : {
                    type : 'type',
                    specificType : 'literal',
                    literalType  : 'int'
                }              
            }, {
                type : 'function-decl',
                children : [{
                    type : 'func-decl',
                    funcDeclType : 'definition',
                    id : {
                        text : 'bar'
                    },
                    args : [],
                    children : [{
                        type : 'expr',
                        exprType : 'literal',
                        literalType : 'int',
                        literal : {
                            text : '1'
                        }
                    }]
                    
                }]
            }]
        });      
    })



    it('top-decl namespace complex 1', () => {

        const result = tp.parseRule('top-decl',
`
namespace Ns =
  datatype d('a) = D | S(int) | M('a, list('a), int)
  private function fff() = 123

  stateful entrypoint
    f (1, x) = (_) => x
`)    

        assert.deepStrictEqual(result.errors, [])
        assert.deepStrictEqual(result.warnings, [])

        

        const ast = result.ast!
        assert.strictEqual(ast.children.length, 3)
        assert.strictEqual(ast.children[0].type, 'datatype-decl')
        assert.strictEqual(ast.children[1].type, 'function-decl')
        assert.strictEqual(ast.children[2].type, 'entrypoint-decl')

        assert.strictEqual(result.scanner.nextToken(), false)
    })

    // FIXME: Remove this test? The trailing content test isn't done on top-decl level now
    it.skip('trailing content error', () => {
        const result = tp.parseRule('top-decl', 
`
contract Foo = 
    type t = int

    residual
`)

        assert.deepStrictEqual(tp.removeLocation(result.ast), {
            type : 'top-contract-decl',
        
            payable : false,
            con : {
                text : 'Foo'
            },
            children : [{
                type : 'type-decl',
                
                id : {
                    text : 't'
                },
                tVars : null,
                typeAlias : {
                    type : 'type',
                    specificType : 'literal',
                    literalType : 'int',
                    children : []
                },                  
                
                children : []
            }]
        })

        assert.equal(result.errors.length, 1)
        assert.equal(result.warnings.length, 0)
        
        assert.deepEqual(result.errors, [{
            filename : undefined,
            err : {
                message : `Trailing content "residual"`,
                location : {
                    begin : {
                        offset : 39,
                        line   : 5,
                        column : 5
                    }, 
                    end : {
                        offset : 47,
                        line   : 5,
                        column : 13
                    }
                }
                
            }
        }])
    })



    it('top-decl identity valid', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('top-decl',
`
contract Identity =
  entrypoint main (x:int) = x
`
        ), {
            type : 'top-contract-decl',
        
            payable : false,
            con : {
                text : 'Identity'
            },

            children : [{
                type : 'entrypoint-decl',
             
                children : [{
                    type : 'func-decl',
                    funcDeclType : 'definition',

                    id : {
                        text : 'main'
                    },

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



            }]
        }); 
    })

    it('top-decl identity error missing expr', () => {
        // Should return a parser error with an AST that has empty type-annotation children
        const result = tp.parseRule('top-decl',
`
contract Identity =
  entrypoint main (x:int) = 

`)

        assert.deepStrictEqual(tp.removeLocationAndEmptyChildren(result.ast), {
            type : 'top-contract-decl',
        
            payable : false,
            con : {
                text : 'Identity'
            },
            children : [{
                type : 'entrypoint-decl',
                children : [{
                    type : 'func-decl',
                    funcDeclType : 'definition',
                    id : {
                        text : 'main'
                    },

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
                    }],
                }]       
            }]
        })

        assert.equal(result.errors.length, 1)
        assert.equal(result.warnings.length, 0)

        assert.deepEqual(result.errors, [{
            filename : undefined,
            message : `Missing stmt`,
            location : {
                begin : {
                    offset : 48,
                    line   : 3,
                    column : 28
                }, 
                end : {
                    offset : 48,
                    line   : 3,
                    column : 28
                }
            }
        }])

    })


    it('top-decl counter valid', () => {
        const result = tp.parseRule('top-decl',
`
contract Counter =

  record state = { value : int }

  entrypoint init(val) = { value = val }
  entrypoint get()     = state.valuee

  stateful entrypoint tick()    = put(state{ value = state.value + 1 })

`)

        assert.deepStrictEqual(tp.simpleResult(result.ast!), {
            type : 'top-contract-decl',
            children : [{
                type : 'record-decl'
            }, {
                type : 'entrypoint-decl',
                children : [{
                    type : 'func-decl',
                    children : [{
                        type : 'expr',
                        children : [{
                            type : 'field-update',
                            children : [{
                                type : 'path'
                            }, {
                                type : 'expr'
                            }]
                        }]
                    }]
                }]
        
            }, {
                type : 'entrypoint-decl',
                children : [{
                    type : 'func-decl',
                    children : [{
                        type : 'expr',
                        children : [{
                            type : 'expr'
                        }, {
                            type : 'expr'
                        }]
                    }]
                }]
            }, {
                // FIXME: Will have children here when parsers is complete
                type : 'entrypoint-decl',

                children : [{

                    type : 'func-decl',
                    children : [{
                        type : 'expr',
                        children : [{
                            type : 'expr',
                            children : [{
                                type : 'field-update',
                                children : [{
                                    type : 'path'
                                }, {
                                    type : 'expr',
                                    children : [{
                                        type : 'expr',
                                        children : [{
                                            type : 'expr'
                                        }, {
                                            type : 'expr'
                                        }]
                                    }, {
                                        type : 'expr'
                                    }]
                                }]
                            }]
                        }]
                    }]
                }]
            }]

        })

        assert.equal(0, result.errors.length)
    })



    it('top-decl function valid', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('top-decl',
`
contract Foo =
  function bar(x:int) = x
`
        ), {
            type : 'top-contract-decl',
        
            payable : false,
            con : {
                text : 'Foo'
            },
            
            children : [{
                type : 'function-decl',
             
                children : [{
                    type : 'func-decl',
                    funcDeclType : 'definition',
                    id : {
                        text : 'bar'
                    },

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
                            literalType  : 'int'
                        }]
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
            }]
        }); 
    })
 
})