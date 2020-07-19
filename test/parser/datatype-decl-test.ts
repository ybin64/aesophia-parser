import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'



describe('datatype decl', () => {

    it('datatype-decl simple 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('datatype-decl',
`datatype foo = Zero`), {
            type : 'datatype-decl',
            id : {
                text : 'foo'
            },
            tVars : null, 
            children : [{
                type : 'con-decl',
                con : {
                    text : 'Zero'
                }

            }]

        })
    })


    it('datatype-decl simple 2', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('datatype-decl',
`datatype foo = Zero | One`), {
            type : 'datatype-decl',
            id : {
                text : 'foo'
            },
            tVars : null, 
            children : [{
                type : 'con-decl',
                con : {
                    text : 'Zero'
                }
            }, {
                type : 'con-decl',
                con : {
                    text : 'One'
                }
            }]

        })
    })

    it('datatype-decl complex 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('datatype-decl',
`datatype frac = Pos(int, int) | Zero | Neg(int, int)`), {
            type : 'datatype-decl',
            id : {
                text : 'frac'
            },
            tVars : null, 
            children : [{
                type : 'con-decl',
                con : {
                    text : 'Pos'
                },
                children : [{
                    type : 'type',
                    specificType : 'literal',
                    literalType : 'int'
                }, {
                    type : 'type',
                    specificType : 'literal',
                    literalType : 'int'
                }]
            }, {
                type : 'con-decl',
                con : {
                    text : 'Zero'
                }
            }, {
                type : 'con-decl',
                con : {
                    text : 'Neg'
                },
                children :[{
                    type : 'type',
                    specificType : 'literal',
                    literalType : 'int'
                }, {
                    type : 'type',
                    specificType : 'literal',
                    literalType : 'int'
                }]
            }]

        })
    })

})