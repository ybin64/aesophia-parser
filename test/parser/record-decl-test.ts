import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'



describe('record decl', () => {

    it('record-decl simple 1', () => {
        
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('record-decl',
`record foo = {bar:int}`
        ), {
            type : 'record-decl',
        
            id : {
                text : 'foo'
            },
            tVars : null,

            fieldTypes : [{
                id : {
                    text : 'bar'
                },
                type : {
                    type : 'type',
                    specificType : 'literal',
                    literalType : 'int'
                }

            }]
        });

    })


    it('record-decl simple 2', () => {       
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('record-decl',
`
record foo = {
    one:int,
    two : string ,
    three : bool
}`
        ), {
            type : 'record-decl',
        
            id : {
                text : 'foo'
            },
            tVars : null,

            fieldTypes : [{
                id : {
                    text : 'one'
                },
                type : {
                    type : 'type',
                    specificType : 'literal',
                    literalType : 'int'
                }
            }, {
                id : {
                    text : 'two'
                },
                type : {
                    type : 'type',
                    specificType : 'literal',
                    literalType : 'string'
                }
            }, {
                id : {
                    text : 'three'
                },
                type : {
                    type : 'type',
                    specificType : 'literal',
                    literalType : 'bool'
                }              
            }]
        });

    })


    it('record-decl simple 3', () => {       
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('record-decl',
`
record state = {worker : FactorialServer}
`
        ), {
            type : 'record-decl',
            id : {
                text : 'state'
            },
            tVars : null,
            fieldTypes : [{
                id : {
                    text : 'worker'
                },
                type : {
                    type : 'type',
                    specificType : 'con',
                    text : {
                        text : 'FactorialServer'
                    }
                }
            }]
        })
    })

})