import 'mocha'
import assert from 'assert'

import * as tp from '../test-parser'
import * as grammar from '../../src/grammar'
import * as parser_lib from '../../src/parser-lib'

import {
    InsideAstItemType
} from '../../src/parser-lib'

describe('inside ast include', () =>  {

    it('inside-ast-include 1', () => {
        const result = tp.parseRule('file',
// 3456789012
`
include "foo
include "bar"
`)        
                // One column past non complete include string is considered inside the include string
                let f : parser_lib.InsideAstItem = parser_lib.insideAst(result.ast!, 2, 13)!
                assert.strictEqual(f.type, parser_lib.InsideAstItemType.IncompleteIncludeStr)
        
                // One past complete include string
                f = parser_lib.insideAst(result.ast!, 3, 14)!
                assert.strictEqual(f.ast.type, 'top-include-decl')
                assert.strictEqual(f.type, parser_lib.InsideAstItemType.Default)
               
    })
})


describe('inside ast expr application', () =>  {
    it('inside-ast-expr-application 1', () => {
        const result = tp.parseRule('expr',
        //   0123456789012
            `List.foo()`)    

                //console.log('result.ast=', result.ast)
                const f1 : parser_lib.InsideAstItem = parser_lib.insideAst(result.ast!, 1, 1)!
                
                assert.strictEqual(f1.type, InsideAstItemType.ExprIdentifier) 
                assert.strictEqual(f1.idType, 'qid'),
                assert.strictEqual(f1.identifier?.text, 'List.foo')
                
                const f2 : parser_lib.InsideAstItem = parser_lib.insideAst(result.ast!, 1, 8)!
                assert.deepStrictEqual(f1, f2)
            
                // Left paren
                const f3 : parser_lib.InsideAstItem = parser_lib.insideAst(result.ast!, 1, 9)!
                assert.notDeepStrictEqual(f1, f3)   
    })
})

describe('inside ast expr identifier', () =>  {
    it('inside-ast-expr-identifier 1', () => {
        const result = tp.parseRule('expr',
        //   0123456789012
            `List.foo`)    

                //console.log('result.ast=', result.ast)
                const f1 : parser_lib.InsideAstItem = parser_lib.insideAst(result.ast!, 1, 1)!
                
                assert.strictEqual(f1.type, InsideAstItemType.ExprIdentifier) 
                assert.strictEqual(f1.idType, 'qid'),
                assert.strictEqual(f1.identifier?.text, 'List.foo')
                
                const f2 : parser_lib.InsideAstItem = parser_lib.insideAst(result.ast!, 1, 8)!
                assert.deepStrictEqual(f1, f2)
            
                // Left paren
                const f3 : parser_lib.InsideAstItem = parser_lib.insideAst(result.ast!, 1, 9)!
                assert.notDeepStrictEqual(f1, f3)   
    })
})



describe('inside ast function', () =>  {

    it('inside-ast-function 1', () => {
        const result = tp.parseRule('file',
// 3456789012
`
contract C = 
  function foo() = List.bar
`)        

        
        const f1 = parser_lib.insideAst(result.ast!, 3, 20)!
        assert.strictEqual(f1.ast.type, 'expr')
        assert.strictEqual(f1.type, InsideAstItemType.ExprIdentifier)
        assert.strictEqual(f1.idType, 'qid')
        assert.strictEqual(f1.identifier?.text, 'List.bar')

        const f2 = parser_lib.insideAst(result.ast!, 3, 27)!
        assert.deepStrictEqual(f1, f2)
        
        const f3 = parser_lib.insideAst(result.ast!, 3, 28)!
        assert.notDeepStrictEqual(f1, f3)
        
    })
})

