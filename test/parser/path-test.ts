import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'
import * as grammar from '../../src/grammar'

describe('path', () => {
    it('path-record-field simple 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('path', 'foo'), {
            type : 'path', 
            pathType : 'record-field',
            id : {
                text : 'foo'
            }
        })
    })


    it('path-map-key simple 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('path', '[bar]'), {
            type : 'path', 
            pathType : 'map-key',
            key : {
                type : 'expr',
                exprType : 'identifier',
                idType   : 'id',
                identifier : {
                    text : 'bar'
                }
            }
        })
    })

    it('path-nested-record-field simple 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('path', 'foo.bar'), {
            type : 'path', 
            pathType : 'record-field',
            id : {
                text : 'foo'
            },

            children : [{
                type : 'path',
                pathType : 'record-field',
                id : {
                    text : 'bar'
                }
            }]
        })
    })

   
    it('path-nested-map-key simple 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('path', 'foo[bar]'), {
            type : 'path', 
            pathType : 'record-field',
            id : {
                text : 'foo'
            },

            children : [{
                type : 'path',
                pathType : 'map-key',
                key : {
                    type : 'expr',
                    exprType : 'identifier',
                    idType : 'id',
                    identifier : {
                        text : 'bar'
                    }
                }
            }]
        })
    })
 

})