// ----------------------------------------------------------------------------
// Copyright (c) Nicklas Bystedt. All rights reserved.
// Licensed under the MIT License.
// See the LICENSE file in the project root for license information.
// ----------------------------------------------------------------------------

import {
    AstItem, AstItem_TopIncludeDecl,
    AstItem_Expr, AstItem_TopNamespaceDecl, AstItem_FunctionDecl

} from './grammar'

import {insideAst, InsideAstItemType, InsideAstItem} from './parser-lib'
import {splitQId} from './scanner'
import {getExplicitStdlibFilenames} from './explicit-stdlib'

export const enum CompletionItemType {
    Generic = 1,
    File    = 2,
    Function = 3
}

export type CompletionItem = {
    type : CompletionItemType
    text : string
}

export type Completion_GetNamespaceF = (namespace : string) => AstItem_TopNamespaceDecl | undefined

export type GetCompletionItemsArgs = {
    getNamespace : Completion_GetNamespaceF
}

/**
 * Get the completion items for the text position
 * @param ast 
 * @param line One-based line number
 * @param col One-based column number
 */
export function getCompletionItems(args : GetCompletionItemsArgs, ast : AstItem, line : number, col : number) : CompletionItem[] {
    let ret : CompletionItem[] = []

    let found = insideAst(ast, line, col)
    if (found) {
        //console.log(`getCompletionItems : found.type=${found.ast.type}`)
     
        if (found.ast.type === 'top-include-decl') {
            return _getTopIncludeDeclCompletion(found.ast as AstItem_TopIncludeDecl, found.type)
        } else if (found.ast.type === 'expr') {
            return _getExprCompletion(args, found)
        }
    }

    return ret
}

function _getTopIncludeDeclCompletion(ast : AstItem_TopIncludeDecl, foundType : InsideAstItemType) : CompletionItem[] {
    if (foundType === InsideAstItemType.IncompleteIncludeStr) {       
        return getExplicitStdlibFilenames().map(f => {
            return {
                type : CompletionItemType.File,
                text : f
            }
        })
    }

    return []
}

function _getExprCompletion(args : GetCompletionItemsArgs, iai : InsideAstItem) : CompletionItem[] {
    const e = iai.ast as AstItem_Expr
 
    if ((iai.type === InsideAstItemType.ExprIdentifier) && iai.identifier) {
        if (iai.idType === 'qid') {
            return _getQidCompletion(args, iai.identifier.text)
        }
    }

    return []
}

function _getQidCompletion(args : GetCompletionItemsArgs, qid : string) : CompletionItem[] {
    const sqid = splitQId(qid)

    const ns = args.getNamespace(sqid.con)

    if (ns) {
        const ret : CompletionItem[] = []

        for (let child of ns.children) {
            if (child.type === 'function-decl') {
                const f = child as AstItem_FunctionDecl

                // FIXME: Handle multiple function FuncDecl
                if (f.children.length > 0) {
                    const fd = f.children[0]
                    
                    ret.push({
                        type : CompletionItemType.Function,
                        text : fd.id.text
                    })
                }
            }
        }

        return ret
    }

    return []
}
