import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'


describe('stmt switch', () => {

    it('stmt-switch simple 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('stmt',
`
switch (xs) 
  [] => n
`
        ), {
            type : 'stmt',
            stmtType : 'switch',
            cond : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'xs'
                }
            },
            children : [{
                type : 'case',
                    
                pattern : {
                    type : 'expr',
                    exprType : 'list'
                },

                children : [{
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'n'
                    }
                }]  
            }]     
        })
    })


    it('stmt-switch simple 2', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('stmt',
`
switch (xs) 
  (x, _) => n
`
        ), {
            type : 'stmt',
            stmtType : 'switch',
            cond : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'xs'
                }
            },
            children : [{
                type : 'case',
                    
                pattern : {
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
                            text : '_'
                        }                
                    }]
                },

                children : [{
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'n'
                    }
                }]  
            }]     
        })
    })




    it('stmt-switch discriminate between list and application on separate line', () => {
        const result = tp.parseRule('stmt',
`
switch(l)
    []               => (reverse(acc_l), reverse(acc_r))
    (left, right)::t => unzip_(t, left::acc_l, right::acc_r)
`
        )

        assert.strictEqual(result.scanner.peekToken(), false)
        assert.strictEqual(result.errors.length, 0)
        assert.strictEqual(result.ast!.children.length, 2)
        assert.strictEqual(result.ast!.children[0].type, 'case')
        assert.strictEqual(result.ast!.children[1].type, 'case')
    })

})


describe('stmt if', () => {
    it('stmt-if simple', () => {
    
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('stmt',
`
if(true)false 
`
        ), {
            type : 'stmt',
            stmtType : 'if',
            cond : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'true'
                }
            },

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

describe('stmt elif', () => {
    it('stmt-elif simple', () => {
    
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('stmt',
`
elif(true)false 
`
        ), {
            type : 'stmt',
            stmtType : 'elif',
            cond : {
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'true'
                }
            },

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

describe('stmt else', () => {
    it('stmt-else simple', () => {
    
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('stmt',
`
else false 
`
        ), {
            type : 'stmt',
            stmtType : 'else',
    
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

describe('stmt let', () => {

    it('stmt-let func-def simple', () => {
      
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('stmt',
        `let fac(0) = 1`
        ), {
            type : 'stmt',
            stmtType : 'let',
            letStmtType : 'function-definition',
            functionDef : {
                type : 'stmt',
                stmtType : 'function-def',
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
            }
        })
    })


    it('stmt-let value-def simple', () => {
      
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('stmt',
        `let foo = 123`
        ), {
            type : 'stmt',
            stmtType : 'let',
            letStmtType : 'value-definition',
            pattern : {
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
                    text : '123'
                }
            }]
           
        })
    })

})

describe('stmt function-def', () => {

    it('stmt-func-def simple 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('stmt',
        `fac(0) = 1`
        ), {
            type : 'stmt',
            stmtType : 'function-def',
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
        })
    })

    it('stmt-func-def simple 2', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('stmt',
        `fac(x) = x * state.worker.fac(x - 1)`
        ), {
            type : 'stmt',
            stmtType : 'function-def',
            
            args : [{
                type : 'expr',
                exprType : 'identifier',
                idType : 'id',
                identifier : {
                    text : 'x'
                }
            }],
            
            children : [{
                type : 'expr',
                exprType : 'binary-op',
                binOp : '*',
                children : [{
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'x'
                    }
                }, {
                    type : 'expr',
                    exprType : 'application',

                    expr : {
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
                                    text : 'worker'
                                }        
                            }]
                        }, {
                            type : 'expr',
                            exprType : 'identifier',
                            idType : 'id',
                            identifier : {
                                text : 'fac'
                            }
                        }]

                    },


                    // The arguments
                    children : [{
                        type : 'expr',
                        exprType : 'binary-op',
                        binOp : '-', 
                        children : [{
                            type : 'expr',
                            exprType : 'identifier',
                            idType : 'id',
                            identifier : {
                                text : 'x'
                            }
                        }, {
                            type : 'expr',
                            exprType : 'literal',
                            literalType : 'int',
                            literal : {
                                text : '1'
                            }
                        }]
                    }]

                }]
            }]
        })
    })
})