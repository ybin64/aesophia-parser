import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'


describe('type literal', () => {
    
    it('type simple int', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `int`
        ), {
            type : 'type',
            specificType : 'literal',
            literalType : 'int'
        })
    })

    it('type simple string', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `string`
        ), {
            type : 'type',
            specificType : 'literal',
            literalType : 'string'
        })
    })


    it('type simple bool', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `bool`
        ), {
            type : 'type',
            specificType : 'literal',
            literalType : 'bool'
        })
    })

    it ('type simple list one item', () => {
        
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `list(int)`
        ), {
            type : 'type',
            specificType : 'literal',
            literalType : 'list',
            listArgs : [{
                type : 'type',
                specificType : 'literal',
                literalType : 'int'
            }]
        })


        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `list (int)`
        ), {
            type : 'type',
            specificType : 'literal',
            literalType : 'list',
            listArgs : [{
                type : 'type',
                specificType : 'literal',
                literalType : 'int'
            }]
        })


        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `list ( int )`
        ), {
            type : 'type',
            specificType : 'literal',
            literalType : 'list',
            listArgs : [{
                type : 'type',
                specificType : 'literal',
                literalType : 'int'
            }]
        })
 
    })


    it ('type simple list multiple items', () => { 
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `list(int, string)`
        ), {
            type : 'type',
            specificType : 'literal',
            literalType : 'list',
            listArgs : [{
                type : 'type',
                specificType : 'literal',
                literalType : 'int'
            }, {
                type : 'type',
                specificType : 'literal',
                literalType : 'string'
            }]
        })


        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `list ( int,     \tstring )`
        ), {
            type : 'type',
            specificType : 'literal',
            literalType : 'list',
            listArgs : [{
                type : 'type',
                specificType : 'literal',
                literalType : 'int'
            }, {
                type : 'type',
                specificType : 'literal',
                literalType : 'string'
            }]
        })
    })

    it ('type simple list multiple items errors', () => { 
        //                                 012345678901234567
        let result = tp.parseRule('type', `list(int, string, )`) 
        
        assert.deepStrictEqual(tp.removeLocationAndEmptyChildren(result.ast), {
            type : 'type',
            specificType : 'literal',
            literalType : 'list',
            listArgs : [{
                type : 'type',
                specificType : 'literal',
                literalType : 'int'
            }, {
                type : 'type',
                specificType : 'literal',
                literalType : 'string'
            }]
        })


        assert.equal(result.errors.length, 1)
        assert.equal(result.warnings.length, 0)

        assert.deepEqual(result.errors, [{
            filename : undefined,
            err : {
                message : "Expected type",
                location : {
                    begin : {
                        offset : 16,
                        line   : 1,
                        column : 17
                    }, 
                    end : {
                        offset : 16,
                        line   : 1,
                        column : 17
                    }
                }
                
            }
        }])

    })

})


describe('type literal map', () => {
    it('type-literal-map simple 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `map(string, bool)`
        ), {
            type : 'type',
            specificType : 'literal',
            literalType : 'map',

            key : {
                type : 'type',
                specificType : 'literal',
                literalType : 'string'
            }, 
            
            value : {
                type : 'type',
                specificType : 'literal',
                literalType : 'bool'
            }
        })
    })

    it('type-literal-map complex 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `map((i) => (i, i * i), up_to(n))`
        ), {
            type : 'type',
            specificType : 'literal',
            literalType : 'map',

            key : {
                type : 'type',
                specificType : 'function-type',
                domain : {
                    type : 'domain',
                    children : [{
                        type : 'type',
                        specificType : 'id',
                        text : {
                            text : 'i'
                        }
                    }]
                },

                functionType : {
                    type : 'type',
                    specificType : 'pair',
                    children : [{
                        type : 'type',
                        specificType : 'id',
                        text : {
                            text : 'i'
                        }
                    }, {
                        type : 'type',
                        specificType : 'tuple',
                        children : [{
                            type : 'type',
                            specificType : 'id',
                            text : {
                                text : 'i'
                            }
                        }, {
                            type : 'type',
                            specificType : 'id',
                            text : {
                                text : 'i'
                            }
                        }]
                    }]
                }
            }, 
            
            value : {
                type : 'type',
                specificType : 'type-application',
                functionType : {
                    type : 'type',
                    specificType : 'id',
                    text : {
                        text : 'up_to'
                    }
                },
                children : [{
                    type : 'type',
                    specificType : 'id',
                    text : {
                        text : 'n'
                    }
                }]
            }
        })
    })
})



describe('type function-type', () => {
    
    it('type-function-type single', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `(string) => int`
        ), {
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
                literalType : 'int'
            }
            
        })
    })

    it('type-function-type multiple', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `(string, bool) => int`
        ), {
            type : 'type',
            specificType : 'function-type',
            domain : {
                type : 'domain',
                children : [{
                    type : 'type',
                    specificType : 'literal',
                    literalType : 'string' 
                }, {
                    type : 'type',
                    specificType : 'literal',
                    literalType : 'bool'
                }]
            },
            functionType : {
                type : 'type',
                specificType : 'literal',
                literalType : 'int'
            }
            
        })
    })


    it('type-function-type empty arguments', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `() => int`
        ), {
            type : 'type',
            specificType : 'function-type',
            domain : {
                type : 'domain',
            },
            functionType : {
                type : 'type',
                specificType : 'literal',
                literalType : 'int'
            }         
        })
    })
})


describe('type type-application', () => {
    it('type-type-application empty', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `foo()`
        ), {
            type : 'type',
            specificType : 'type-application',
            functionType : {
                type : 'type',
                specificType : 'id',
                text : {
                    text : 'foo'
                }
            }       
        })
    })

    it('type-type-application one type', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `bar(int)`
        ), {
            type : 'type',
            specificType : 'type-application',
            functionType : {
                type : 'type',
                specificType : 'id',
                text : {
                    text : 'bar'
                }
            }, 
            children : [{
                type : 'type',
                specificType : 'literal',
                literalType : 'int'
            }]      
        })
    })

    it('type-type-application two', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `bar(int, bool)`
        ), {
            type : 'type',
            specificType : 'type-application',
            functionType : {
                type : 'type',
                specificType : 'id',
                text : {
                    text : 'bar'
                }
            }, 
            children : [{
                type : 'type',
                specificType : 'literal',
                literalType : 'int'
            }, {
                type : 'type',
                specificType : 'literal',
                literalType : 'bool'
            }]      
        })
    })

})


// FIXME: parens test

describe('type parens', () => {
    it('type-parens simple', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `(int)`
        ), {
            type : 'type',
            specificType : 'parens',
            children : [{
                type : 'type',
                specificType : 'literal',
                literalType : 'int'
            }]       
        })
    })
})

describe('type tuple', () => {

    it('type-tuple unit', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocation('type',
        `unit`
        ), {
            type : 'type',
            specificType : 'tuple',

            // No children => it's 'unit'
            children : []       
        })
    })

    it('type-tuple multiple simple', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `int * string`
        ), {
            type : 'type',
            specificType : 'tuple',
            children : [{
                type : 'type',
                specificType : 'literal',
                literalType : 'int'
            }, {
                type : 'type',
                specificType : 'literal',
                literalType : 'string'
            }]       
        })
    })

    it('type-tuple multiple 3', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `int * string * bool`
        ), {
            type : 'type',
            specificType : 'tuple',
            children : [{
                type : 'type',
                specificType : 'literal',
                literalType : 'int'
            }, {
                type : 'type',
                specificType : 'literal',
                literalType : 'string'
            }, {
                type : 'type',
                specificType : 'literal',
                literalType  : 'bool'
            }]       
        })
    })


})

describe('type text', () => {
    
    it('type-text id 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `foo`
        ), {
            type : 'type',
            specificType : 'id',
            text : {
                text : 'foo'
            }
        })
    })

    it('type-text qid 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        `Foo.bar`
        ), {
            type : 'type',
            specificType : 'qid',
            text : {
                text : 'Foo.bar'
            }
        })
    })


    it('type-text tvar 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        "'a"
        ), {
            type : 'type',
            specificType : 'tvar',
            text : {
                text : "'a"
            }
        })
    })

    it('type-text con 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('type',
        "Foo"
        ), {
            type : 'type',
            specificType : 'con',
            text : {
                text : "Foo"
            }
        })
    })


})