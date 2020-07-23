// ----------------------------------------------------------------------------
// Copyright (c) Nicklas Bystedt. All rights reserved.
// Licensed under the MIT License.
// See the LICENSE file in the project root for license information.
// ----------------------------------------------------------------------------

// FIXME: Major overhaul needed

import * as path from 'path'
import * as fs from 'fs'

import {Map} from 'immutable'

import {
    AstItem, Pos, StmtErrLoc, 
    BeginEndPos, ErrWarnLocation,
    AddIncludeFunc, AddIncludeArgs, 
    ExprIdentifierType,
    AstItem_TopIncludeDecl,
    AstItem_Expr, AstItem_Expr_Application, AstItem_Expr_Identifier
} from './grammar'



import {
    ParserLogger,
    FileParseError, FileParseWarning,
    addError
} from './parser'


import {
    SemanticResult, checkSemantics
} from './semantics'
import { StrWithBELoc } from './scanner'



// FIXME: Needed for Sophia parser?
export class StatementCache {
}

// FIXME: Needed for Sophia parser?
export class ResolvedStmtCache {
}

// FIXME: Remove ParsedModuleSubmoduleCache
export class ParsedModuleSubmoduleCache {
}

// ----------------------------------------------------------------------------

export type FileExist = (filename : string) => boolean;
export type GetFileContent = (filename : string) => string;


export type ParseTextArgs = {
    fileExist      : FileExist,
    getFileContent : GetFileContent,
    recurseImport  : boolean,
    recurseInclude : boolean,

    // FIXME: Not entirely correct to have the semanticCheck flag here, but will do for now.
    semanticCheck  : boolean
}

export type ParserDebug = {
    info : (text : string, obj? : any) => void
}

export function logInfo(debug : ParserDebug | undefined, text : string, obj? : any) {
    if (debug) {
        if (arguments.length === 2) {
            debug.info(text)
        } else {
            debug.info(text, obj)
        }
    }
}

export class Timer {
    private startTime : Date
    private stopTime  : Date
    constructor() {
        this.start()
    }

    public start() : void {
        this.startTime = new Date()
    }

    public stop() : void {
        this.stopTime = new Date()
    }

    public timeMs() : number {
        return this.stopTime.valueOf() - this.startTime.valueOf()
    }

    public timeS() : number {
        return this.timeMs() / 1000.0
    }
}

// ----------------------------------------------------------------------------

export function pos2StmtErrLoc(pos : Pos) : StmtErrLoc {
    return {
        offset : pos[0],
        line   : pos[1],
        column : pos[2]
    }
}

export function beginEndPos2ErrorLocation(beginEndPos : BeginEndPos) : ErrWarnLocation {
    return {
        begin : pos2StmtErrLoc(beginEndPos.b),
        end   : pos2StmtErrLoc(beginEndPos.e)
    };
}

export function stmtErrLoc(pos : Pos) : StmtErrLoc {
    let col = pos[2];
    if (col === 0) {
        // FIXME: This might happen due to error recovery
        col = 1;
    }
    return {
        offset : pos[0],
        line   : pos[1],
        column : col
    };
}

export function stmtBeginErrLoc(stmt : any) : StmtErrLoc {
    return stmtErrLoc(stmt.loc.stmt.b);
}

export function stmtEndErrLoc(stmt : any) : StmtErrLoc {
    return stmtErrLoc(stmt.loc.stmt.e);
}


// ----------------------------------------------------------------------------

export const enum InsideAstItemType {
    Default = 1,

    /**
     * Inside include declaration string
     */
    IncompleteIncludeStr = 2,

    /**
     * Inside an expression identifier
     */
    ExprIdentifier = 201,
}

export type InsideAstItem = {
    type : InsideAstItemType
    ast : AstItem

    /**
     * Valid for type === ExprIdentifier
     */
    idType? : ExprIdentifierType

    /**
     * Valid for type === ExprIdentifier
     */
    identifier? : StrWithBELoc
}

/**
 * Return inner most statement that the position is within.
 *
 * @param ast    Ast
 * @param line   1-based line number
 * @param column 1-based column number
 *
 * @return Found statement or undefined
 */
export function insideAst(ast : AstItem, line : number, column : number) : InsideAstItem | undefined {
    var asts : InsideAstItem[] = [];
    _insideAstAcc(ast, line, column, asts);

    if (asts.length > 0) {
        return asts[asts.length - 1];
    }

    return undefined;
}


function _insideAstAcc(ast : AstItem, line : number, column : number, acc : InsideAstItem[]) {
    const inside = _isInsideAst(ast, line, column)

    if (inside) {
        acc.push(inside)
    }

    for (let child of ast.children) {
        _insideAstAcc(child, line, column, acc)
    }
}

function _isInsideAst(ast : AstItem, line : number, col : number) : InsideAstItem | undefined {
    //console.log(`_isInsideAst : type=${ast.type} : [${line}, ${col}]`, ast.loc)

    if (ast.type === 'expr') {
        return _isInsideExpr(ast as AstItem_Expr, line , col)
    }
    if (ast.type === 'top-include-decl') {
        return _isInsideAstTopIncludeDecl(ast as AstItem_TopIncludeDecl, line , col)
    } 

    return _defaultInsideAst(ast, line, col)
}

function _defaultInsideAst(ast : AstItem, line : number, col : number) : InsideAstItem | undefined {
    if (insideBEPos(ast.loc, line, col, 0)) {
        return {
            type : InsideAstItemType.Default,
            ast : ast
        }
    }    
}

// -----------------------------------------------------------------------------
// Inside include

function _isInsideAstTopIncludeDecl(ast : AstItem_TopIncludeDecl, line : number, col : number) : InsideAstItem | undefined {  
    if (ast.include && (insideBEPos(ast.include.fullLoc, line, col, 1))) {
        if (!ast.validIncludeToken) {
            return {
                type : InsideAstItemType.IncompleteIncludeStr,
                ast : ast,
            }
        } else {
            return {
                type : InsideAstItemType.Default,
                ast : ast
            }
        }
    }
    
    return _defaultInsideAst(ast, line, col)
}

// -----------------------------------------------------------------------------
// Inside expr

function _isInsideExpr(ast : AstItem_Expr, line : number, col : number) : InsideAstItem | undefined {  
    if (ast.exprType === 'application') {
        return _isInsideExprApplication(ast as AstItem_Expr_Application, line, col)
    } else if (ast.exprType === 'identifier') {
        return _isInsideExprIdentifier(ast as AstItem_Expr_Identifier, line , col)
    }

    return _defaultInsideAst(ast, line, col)
}

function _isInsideExprApplication(ast : AstItem_Expr_Application, line : number, col : number) : InsideAstItem | undefined {  
    if (ast.expr.exprType === 'identifier') {
        const ie = _isInsideExprIdentifier(ast.expr as AstItem_Expr_Identifier, line, col)
        if (ie) {
            return ie
        }
    }

    return _defaultInsideAst(ast, line, col)
}

function _isInsideExprIdentifier(ast : AstItem_Expr_Identifier, line : number, col : number) : InsideAstItem | undefined {  
  
    if (insideBEPos(ast.identifier.loc, line, col, 0)) {
        return {
            type : InsideAstItemType.ExprIdentifier,
            ast  : ast,
            idType : ast.idType,
            identifier : ast.identifier
        }
    }

    return _defaultInsideAst(ast, line, col)
}

// -----------------------------------------------------------------------------

export function insideBEPos(pos : BeginEndPos, line : number, col : number, endColDelta : number) {
     if ((pos.b[1] <= line) && (line <= pos.e[1])) {
        return (pos.b[2] <= col) && (col <= (pos.e[2] + endColDelta))
    }

    return false
}

// ----------------------------------------------------------------------------

export type ParseContextDebug = {
    info : (text : string, obj? : any) => void
}

// ----------------------------------------------------------------------------

export function fileExist(filename : string) : boolean {
    try {
        fs.statSync(filename);
        return true;
    } catch (e) {
        return false;
    }
}


// -----------------------------------------------------------------------------
//


export function getFileContent(filename : string) : string {
    return fs.readFileSync(filename, 'utf8');
}
