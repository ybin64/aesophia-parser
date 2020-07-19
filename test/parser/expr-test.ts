import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'
import * as grammar from '../../src/grammar'

describe('expr anonymous function', () => {
    it('expr-anon-func simpl 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', '(x)=>x'), {
            type : 'expr',
            exprType : 'anonymous-function',
            args : [{
                type : 'lamarg',
                id : {
                    text : 'x'
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
        })  
    })
})

//
describe('expr if expression', () => {
    it('expr-if simple', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 
            'if (1) -a else b'
        ), {
            type : 'expr',
            exprType : 'if',
         
            children : [{
                type : 'expr',
                exprType : 'literal',
                literalType : 'int',
                literal : {
                    text : '1'
                }
            }, {
                type : 'expr',
                exprType : 'unary-op',
                unaryOp : '-',
                children : [{
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'a'
                    }        
                }]
            }, {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'b'
                }
            }]
        })
    })
})
describe('expr type annotation', () => {

    it('expr-type-ann simple', () => {

        //x:int
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 'x:int'), {
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
        })
    })
})


// FIXME: Test operator precedence
describe('expr binary operators', () => {
    it('expr-binop all', () => {
        
        const _assertBinOpId = (expr : string, bo : grammar.BinaryOp, id1 : string, id2: string) => {
            assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', expr), {
                type : 'expr',
                exprType : 'binary-op',
                binOp : bo,

                children : [{
                    type : 'expr',
                    exprType : 'identifier', 
                    idType : 'id',
                    identifier : {
                        text : id1
                    }
                }, {
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : id2
                    }
                }]
            })
        }

        _assertBinOpId('b+c', '+', 'b', 'c')
        _assertBinOpId('a - b', '-', 'a', 'b')
        _assertBinOpId('a*b', '*', 'a', 'b')
        _assertBinOpId('a/b', '/', 'a', 'b')
        _assertBinOpId('abc :: de', '::', 'abc', 'de')
        _assertBinOpId('abc::de', '::', 'abc', 'de')
        _assertBinOpId('e++d', '++', 'e', 'd')
        _assertBinOpId('a mod b', 'mod', 'a', 'b')
        _assertBinOpId('a^b', '^', 'a', 'b')

        _assertBinOpId('a||b', '||', 'a', 'b')
        _assertBinOpId('a&&b', '&&', 'a', 'b')
        _assertBinOpId('a=<b', '=<', 'a', 'b')
        _assertBinOpId('a>=b', '>=', 'a', 'b')
        _assertBinOpId('a==b', '==', 'a', 'b')
        _assertBinOpId('a!=b', '!=', 'a', 'b')
        _assertBinOpId('a<b', '<', 'a', 'b')
        _assertBinOpId('a>b', '>', 'a', 'b') 
    })

    it('expr-binop add', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', '1 + 2'), {
            type : 'expr',
            exprType : 'binary-op',
            binOp : '+',
            children : [{
                type : 'expr',
                exprType : 'literal',
                literalType : 'int',
                literal : {
                    text : '1'
                }
            }, {
                type : 'expr',
                exprType : 'literal',
                literalType : 'int',
                literal : {
                    text : '2'
                }
            }]
        })
    })
})

describe('expr unary operators', () => {

    it('expr-unaryop -', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', '-1'), {
            type : 'expr',
            exprType : 'unary-op',
            unaryOp : '-',
            children : [{
                type : 'expr',
                exprType : 'literal',
                literalType : 'int',
                literal : {
                    text : '1'
                }
            }]
        })  
    })

    it('expr-unaryop !', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', '!false'), {
            type : 'expr',
            exprType : 'unary-op',
            unaryOp : '!',
            children : [{
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'false'
                }
            }]
        })  
    })

})

describe('expr record or map update', () => {
    it('expr-record-or-map-update simple', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 'state{ value = val}'), {
            type : 'expr',
            exprType : 'record-or-map-update',
            expr : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'state'
                }
            },
            children : [{
                type : 'field-update',
                children : [{
                    type : 'path',
                    pathType : 'record-field',
                    id : {
                        text : 'value'
                    }

                }, {
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'val'
                    }
                }]
            }]
        })   
    })

    it('expr-record-or-map-update alias 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 'state{ value @  v = value}'), {
            type : 'expr',
            exprType : 'record-or-map-update',
            expr : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'state'
                }
            },
            children : [{
                type : 'field-update',
                alias : {
                    text : 'value'
                },
                children : [{
                    type : 'path',
                    pathType : 'record-field',
                    id : {
                        text : 'v'
                    }

                }, {
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'value'
                    }
                }]
            }]
        })   
    })

    it('expr-record-or-map-update complex 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 
            'state{ contributions[Call.caller] = amount }'
        ), {
            type : 'expr',
            exprType : 'record-or-map-update',
            expr : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'state'
                }
            },
            children : [{
                type : 'field-update',
                children : [{
                    type : 'path',
                    pathType : 'record-field',
                    id : {
                        text : 'contributions'
                    },
                    children : [{
                        type : 'path',
                        pathType : 'map-key',
                        key : {
                            type : 'expr',
                            exprType : 'identifier',
                            idType : 'qid',
                            identifier : {
                                text : 'Call.caller'
                            }
                        }
                    }]

                }, {
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'amount'
                    }
                }]
            }]
        })   
    })


})


describe('expr record or map value', () => {

    it('expr-record-or-map-value simple 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', '{value=val}'), {
            type : 'expr',
            exprType : 'record-or-map-value',
            children : [{
                type : 'field-update',
                children : [{
                    type : 'path',
                    pathType : 'record-field',
                    id : {
                        text : 'value'
                    }

                }, {
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'val'
                    }

                }]
            }]
        })   
    })

    it('expr-record-or-map-value simple 2', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', '{value="val"}'), {
            type : 'expr',
            exprType : 'record-or-map-value',
            children : [{
                type : 'field-update',
                children : [{
                    type : 'path',
                    pathType : 'record-field',
                    id : {
                        text : 'value'
                    }

                }, {
                    type : 'expr',
                    exprType : 'literal',
                    literalType : 'string',
                    literal : {
                        text : 'val'
                    }

                }]
            }]
        })   
    })

})



describe('expr projection', () => {

    it('expr-projection simple 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 'state.x'), {
            type : 'expr',
            exprType : 'projection',
            children : [{
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'state'
                }
            }, {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'x'
                }
            }]
        })   
    })

    it('expr-projection simple 2', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 'state.x.y'), {
            type : 'expr',
            exprType : 'projection',
            children : [{
                type : 'expr',
                exprType : 'projection',
                children : [{
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'state'
                    }
                }, {
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'x'
                    }                
                }]
            }, {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'y'
                }
            }]
        })   
    })

  

    it('expr-projection simple add', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 'state.x + 1'), {

            type : 'expr',
            exprType : 'binary-op',
            binOp    : '+',

            children : [{
                type : 'expr',
                exprType : 'projection',
                children : [{
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'state'
                    }
                }, {
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'x'
                    }
                }]
            }, {
                type : 'expr',
                exprType : 'literal',
                literalType : 'int',
                literal : {
                    text : '1'
                }
            }]
        })   
    })

})

describe('map lookup', () => {
    it('map-lookup simple 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 
`
contributions[Call.caller]
`), {
            type : 'expr',
            exprType : 'map-lookup',
            map : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'contributions'
                }
            },
            key : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'qid',
                identifier : {
                    text : 'Call.caller'
                }
            }
        })         
    })
})

describe('expr list', () => {
    it('expr-list empty', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', '[]'), {
            type : 'expr',
            exprType : 'list'
        })
    })

    it('expr-list one element', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', '[foo]'), {
            type : 'expr',
            exprType : 'list',
            children : [{
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'foo'
                }
            }]
        })
    })

    it('expr-list two elements', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', '[foo, 1]'), {
            type : 'expr',
            exprType : 'list',
            children : [{
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'foo'
                }
            }, {
                type : 'expr',
                exprType : 'literal',
                literalType : 'int',
                literal : {
                    text : '1'
                }
            }]
        })
    })
 
})


describe('expr list comprehension', () => {

    it('expr-list-comprehension generator 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 
`[x | y <- sample1()]`
        ), {
            type : 'expr',
            exprType : 'list-compr',
            expr : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'x'
                }
            },
            children : [{
                type : 'generator',
                generatorType : 'generator',
                pattern : {
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'y'
                    }
                },
                expr : {
                    type : 'expr',
                    exprType : 'application',
                    expr : {
                        type : 'expr',
                        exprType : 'identifier',
                        idType : 'id',
                        identifier : {
                            text : 'sample1'
                        }
                    }
                }

            }]
        })
    })

    it('expr-list-comprehension generator 2', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 
`[x | y <- 1, z <- 22]`
        ), {
            type : 'expr',
            exprType : 'list-compr',
            expr : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'x'
                }
            },
            children : [{
                type : 'generator',
                generatorType : 'generator',
                pattern : {
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'y'
                    }
                },
                expr : {
                    type : 'expr',
                    exprType : 'literal',
                    literalType : 'int',
                    literal : {
                        text : '1'
                    }    
                }
            }, {
                type : 'generator',
                generatorType : 'generator',
                pattern : {
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'z'
                    }
                },
                expr : {
                    type : 'expr',
                    exprType : 'literal',
                    literalType : 'int',
                    literal : {
                        text : '22'
                    }    
                }              
            }]
        })
    })

    it('expr-list-comprehension guard 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 
`[x | if (true)]`
        ), {
            type : 'expr',
            exprType : 'list-compr',
            expr : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'x'
                }
            },
            children : [{
                type : 'generator',
                generatorType : 'guard',
                expr : {
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'true'
                    }
                }
            }]
        })

    })

    it('expr-list-comprehension letdef 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 
`[x | let base = 1]`
        ), {
            type : 'expr',
            exprType : 'list-compr',
            expr : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'x'
                }
            },
            children : [{
                type : 'generator',
                generatorType : 'definition',
                letDef : {
                    type : 'stmt',
                    stmtType : 'let',
                    letStmtType : 'value-definition',
                    pattern : {
                        type : 'expr',
                        exprType : 'identifier',
                        idType : 'id',
                        identifier : {
                            text : 'base'
                        }
                    },
                    children : [{
                        type : 'expr',
                        exprType : 'literal',
                        literalType : 'int',
                        literal : {
                            text : '1'
                        }
                    }]
                }

            }]
        })
    })


    


})


describe('expr list range', () => {
    it('expr-list-range simple 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', '[a..b]'), {
            type : 'expr',
            exprType : 'list-range',
            children : [{
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'a'
                }
            }, {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'b'
                }              
            }]
        })
    })
})

describe('expr application', () => {


    it('expr-application simple', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 'foo()'), {
            type : 'expr',
            exprType : 'application',
            expr : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'foo'
                }
            }
        })   
    })

  
    it('expr-application args 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 'foo(1)'), {
            type : 'expr',
            exprType : 'application',
            expr : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'foo'
                }
            },
            children : [{
                type : 'expr',
                exprType : 'literal',
                literalType : 'int',
                literal : {
                    text : '1'
                }
            }]
        })   
    })

    it('expr-application args 2', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 'foo(13, id)'), {
            type : 'expr',
            exprType : 'application',
            expr : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'foo'
                }
            },
            children : [{
                type : 'expr',
                exprType : 'literal',
                literalType : 'int',
                literal : {
                    text : '13'
                }
            }, {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'id'
                }
            }]
        })   
    })

    it('expr-application default value 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', 'foo(id = 3)'), {
            type : 'expr',
            exprType : 'application',
            expr : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'foo'
                }
            },
            children : [{
                type : 'expr',
                exprType : 'assign',
                children : [{
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'id'
                    }
                }, {
                    type : 'expr',
                    exprType : 'literal',
                    literalType : 'int',
                    literal : {
                        text : '3'
                    }
                }]
            }]
        })   
    })

})


describe('expr literal int', () => {
    it('expr-literal-int simple', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', '123'), {
            type : 'expr',
            exprType : 'literal',
            literalType : 'int',
            literal : {
                text : '123'
            }
        })   
    })
})

describe('expr literal string', () => {
    it('expr-literal-string simple', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('expr', '"one"'), {
            type : 'expr',
            exprType : 'literal',
            literalType : 'string',
            literal : {
                text : 'one'
            }
        })   
    })
})


// FIXME: Implement test
describe.skip('expr literal char', () => {
})


describe.skip('expr chain identifier', () => {

    // Implement AccountAddress test
    // Implement ContractAddress test
    // Implement OracleAddress test
    // Implement OracleQueryId test
})

