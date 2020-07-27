import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'
import * as grammar from '../../src/grammar'

describe('pragma compiler', () => {
    it('pragma-compiler 1', () => {
        assert.deepStrictEqual(tp.parseRuleNoLocationNoEmptyChildren('top-pragma-compiler', 
            '@compiler >= 4.3'
        ), {
            type : 'top-pragma-compiler',
            op : {
                text : '>='
            },
            children : [{
                type : 'version',
                children : [{
                    type : 'int',
                    value : {
                        text : '4'
                    }
                }, {
                    type : 'int',
                    value : {
                        text : '3'
                    }
                }]
            }]
        })  
    })  
    
    it('pragma-compiler all operators', () => {
        const _parseOp = (txt : string) => {
            return (tp.parseRuleNoLocationNoEmptyChildren('top-pragma-compiler', txt) as any).op.text
        }

        assert.strictEqual(_parseOp('@compiler < 0'), '<')
        assert.strictEqual(_parseOp('@compiler =< 1'), '=<')
        assert.strictEqual(_parseOp('@compiler == 1'), '==') 
        assert.strictEqual(_parseOp('@compiler >= 1'), '>=')
        assert.strictEqual(_parseOp('@compiler > 1'), '>')
    })
    
})