import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'

import {AstItemType} from '../../src/grammar'


function _simpleDecl(type : AstItemType, text : string) : tp.SimpleItem {
    const ast = tp.parseRuleNoLocation(type, text)!

    if (!ast) {
        throw new Error(`Failed to parse type "${type}"`)
    }

    return tp.simpleResult(ast)
}

describe('type decl', () => {
    it('type int', () => {

        assert.deepStrictEqual(tp.parseRuleNoLocation('type-decl',
        `type t = int`
        ), {
            type : 'type-decl',
        
            id : {
                text : 't'
            },
            tVars : null,
            typeAlias : {
                type : 'type',
                specificType : 'literal',
                literalType : 'int',
                children : [],
            },

            children : []
        });
        
    })

    it('invalid type id 1', () => {
        
        const result = tp.parseRule('type-decl',
// 01234567890123
  `type Foo = int`
        )

        assert.deepStrictEqual(tp.removeLocation(result.ast), {
            type : 'type-decl',
            
            id : {
                text : 'Foo'
            },
            tVars : null,
            typeAlias : {
                type : 'type',
                specificType : 'literal',
                literalType : 'int',
                children : [],
            
            }, 
            
        
            children : []  
        })

        assert.equal(result.errors.length, 1)
        assert.equal(result.warnings.length, 0)

        assert.deepEqual(result.errors, [{
            filename : undefined,
            message : "Invalid identifier, format is [a-z_][A-Za-z0-9_']*",
            location : {
                begin : {
                    offset : 5,
                    line   : 1,
                    column : 6
                }, 
                end : {
                    offset : 7,
                    line   : 1,
                    column : 8
                }
            }
        }])
    })

    it('type missing type alias 1', () => {
        
        assert.deepStrictEqual(tp.parseRuleNoLocation('type-decl',
`type t = `
        ), undefined/* {
            type : 'type-decl',
            arg : {
                id : {
                    text : 't'
                },
                tVar : null,
                typeAlias : {
                    text : 'int'
                } 
                
            } as AstTypeDeclArg,
            children : []
        } as AstItemNoLoc*/);
        
    })

    describe('type variables', () => {
        it('empty type variable args', () => {

            // No space after type id
            assert.deepStrictEqual(_simpleDecl('type-decl', `type t() = int`), {
                type : 'type-decl',
            })

            // Space after type id
            assert.deepStrictEqual(_simpleDecl('type-decl', `type t () = int`), {
                type : 'type-decl',
            })   

        })

        it('type-decl type variables 1', () => {
            assert.deepStrictEqual(tp.parseRuleNoLocation('type-decl', `type t ('a) = int`), {
                type : 'type-decl',
            
                id : {
                    text : 't'
                },
                tVars : [{
                    text : "'a"
                }],
                typeAlias : {
                    type : 'type',
                    specificType : 'literal',
                    literalType : 'int',
                    children : [],
                },               
                children : [] 
            })


            assert.deepStrictEqual(tp.parseRuleNoLocation('type-decl', `type t ('a,'b, 'c  , 'dd  ) = int`), {
                type : 'type-decl',
                
                id : {
                    text : 't'
                },
                tVars : [{
                    text : "'a"
                }, {
                    text : "'b"
                }, {
                    text : "'c"
                }, {
                    text : "'dd"
                }],
                typeAlias : {
                    type : 'type',
                    specificType : 'literal',
                    literalType : 'int',
                    children : [],
                  
                },               
            
                children : [] 
            })
        })

        it('type-decl invalid type variable 1', () => {
            //                                        01234567890
            const result = tp.parseRule('type-decl', `type t (foo) = int`)

            assert.deepStrictEqual(tp.removeLocation(result.ast), {
                type : 'type-decl',
                
                id : {
                    text : 't'
                },
                tVars : null,
                typeAlias : {
                    type : 'type',
                    children : [],
                    specificType : 'literal',
                    literalType : 'int'
                 },
                children : [] 
            })


            assert.equal(result.errors.length, 1)
            assert.equal(result.warnings.length, 0)
            
            assert.deepEqual(result.errors, [{
                filename : undefined,
                message : "Invalid type variable",
                location : {
                    begin : {
                        offset : 8,
                        line   : 1,
                        column : 9
                    }, 
                    end : {
                        offset : 10,
                        line   : 1,
                        column : 11
                    }
                }
            }])
        })

        it('type-decl invalid type variable ending', () => {
            //                                        012345678901234567890
            const result = tp.parseRule('type-decl', `type t ('foo, ) = int`)

            assert.deepStrictEqual(tp.removeLocation(result.ast), {
                type : 'type-decl',
                
                id : {
                    text : 't'
                },
                tVars : [{
                    text : "'foo"
                }],
                typeAlias : {
                    type : 'type',
                    children : [],
                    specificType : 'literal',
                    literalType : 'int'
                },               
            
                children : [] 
            })


            assert.equal(result.errors.length, 1)
            assert.deepEqual(result.errors, [{
                filename : undefined,
                message : "Unexpected token ')'",
                location : {
                    begin : {
                        offset : 14,
                        line   : 1,
                        column : 15
                    }, 
                    end : {
                        offset : 14,
                        line   : 1,
                        column : 15
                    }
                }
            }])
        })
    })

    describe('type-decl complicated', () => {

        it('type-decl complicated map 1', () => {

            assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type-decl',
`type board = map(bool, map(int, string))`
            ), {
                type : 'type-decl',
                id : {
                    text : 'board'
                },
                tVars : null,
                typeAlias : {
                    type : 'type',
                    specificType : 'literal',
                    literalType : 'map',
                    key : {
                        type : 'type',
                        specificType : 'literal',
                        literalType : 'bool'
                    },
                    value : {
                        type : 'type',
                        specificType : 'literal',
                        literalType : 'map',
                        key : {
                            type : 'type',
                            specificType : 'literal',
                            literalType : 'int'
                        },
                        value : {
                            type : 'type',
                            specificType : 'literal',
                            literalType : 'string'
                        }
                    }
                }

            })
        })

    })
})