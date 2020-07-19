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
    BeginEndPos, ErrorLocation,
    AddIncludeFunc, AddIncludeArgs
} from './grammar'


import {
    ParserLogger,
    ParserParseError, ParserParseWarning,
    addError, parse as sophiaParse
} from './parser'


import {
    SemanticResult, checkSemantics
} from './semantics'



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

export function beginEndPos2ErrorLocation(beginEndPos : BeginEndPos) : ErrorLocation {
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

function _isInside(ast : AstItem, line : number, col : number) {
    if (ast && ast.loc) {
        var b;
        var a;
        var e;

        if (ast.loc) {
            b = ast.loc.b;
            e = ast.loc.e;
        }

        if (b && e) {
            if ((b[1] < line) && (line <= e[1])) {
                // FIXME: Check column if on same line
                if (line == e[1]) {
                  // At last line of statement
                  return col <= e[2];
                } else {
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * Return inner most statement that the position is within.
 *
 * @param ast    Yang parsed AST
 * @param line   1-based line number
 * @param column 1-based column number
 *
 * @return Found statement or undefined
 */
export function insideAst(ast : AstItem, line : number, column : number) : AstItem | undefined {
    var asts : AstItem[] = [];
    _insideAstAcc(ast, line, column, asts);

    if (asts.length > 0) {
        return asts[asts.length - 1];
    }

    return undefined;
}


function _insideAstAcc(stmt : AstItem, line : number, column : number, acc : AstItem[]) {
    if (_isInside(stmt, line, column)) {
        acc.push(stmt);
    }

    if (stmt.children) {
        for (var c = 0; c < stmt.children.length; c++) {
            _insideAstAcc(stmt.children[c], line, column, acc);
        }
    }
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


function _addNonExistingFileError(errors : ParserParseError[], filename : string) : void {
    addError(errors, `No such file: '${filename}'`);
 }

 function _nonExistingFileResult(filename : string) : ContextParseResult {
    let errors : ParserParseError[] = [];
    _addNonExistingFileError(errors, filename);
    return {
        errors   : errors,
        warnings : [],

        parseTimeMs : -1,
        semanticCheckTimeMs : -1
    };
}


function _addSemanticResult(result : _ContextParseOneTextResult, semanticResult? : SemanticResult) {
    if (semanticResult) {
        result.errors = result.errors.concat(semanticResult.errors);
        result.warnings = result.warnings.concat(semanticResult.warnings);
    }
}

type _ContextParseOneTextResult = {
    ast?     : AstItem,
    errors   : ParserParseError[],
    warnings : ParserParseWarning[],
}

export type ContextParseResult = {
    ast?              : AstItem
    errors            : ParserParseError[]
    warnings          : ParserParseWarning[]

    semanticResult?   : SemanticResult

    parseTimeMs         : number
    semanticCheckTimeMs : number
}


export function getFileContent(filename : string) : string {
    return fs.readFileSync(filename, 'utf8');
}

export class ParseContext {
    private _logger : ParserLogger;

    constructor(logger : ParserLogger) {
        this._logger = logger;
    }

    public parseFile(filename : string,
            rootURI : string,
            searchPaths : string[],

            sc : StatementCache,
            rsc : ResolvedStmtCache,
            pmsc : ParsedModuleSubmoduleCache
            
            ) : ContextParseResult
    {
        if (!fileExist(filename)) {
            return _nonExistingFileResult(filename);
        }

        let semanticCheck : boolean = true;

        let parseTimer = new Timer()

        let result = _parseOneText(getFileContent(filename), sc, pmsc, {
            fileExist      : fileExist,
            getFileContent : getFileContent,
            recurseImport  : true,
            recurseInclude : true,
            semanticCheck  : semanticCheck
        }, {
            filename          : filename,
            rootURI           : rootURI, //filename,
            searchPaths       : searchPaths,
            level             : 0
        },
 
        {
            logger : this._logger
        });

        parseTimer.stop()

        let semanticResult : SemanticResult | undefined;

        let semanticTimer = new Timer()

        if (semanticCheck) {
            semanticResult = this._checkSemantics(filename, result.ast, sc, rsc,
                //result.parsedModules, result.parsedSubmodules
                );

            _addSemanticResult(result, semanticResult);
        }

        semanticTimer.stop()

        return {
            ast               : result.ast,
            errors            : result.errors,
            warnings          : result.warnings,
            semanticResult    : semanticResult,

            parseTimeMs         : parseTimer.timeMs(),
            semanticCheckTimeMs : semanticTimer.timeMs()
        }
    }


    
    public parseText(text : string,
            rootURI : string,
            searchPaths : string[],
            sc : StatementCache,
            rsc : ResolvedStmtCache,
            pmsc : ParsedModuleSubmoduleCache,
            args : ParseTextArgs, filename? : string,
            debug? : ParseContextDebug) : ContextParseResult
    {
        if (filename === undefined) {
            filename = '-';
        }

        let parseTimer = new Timer()

        let result = _parseOneText(text, sc, pmsc, args, {
            filename : filename,
            rootURI  : rootURI, //filename,
            searchPaths : searchPaths,
            level    : 0
        },
        {
            logger : this._logger,
            debug : debug
        });

        parseTimer.stop()

        let semanticTimer = new Timer()

        let semanticResult : SemanticResult | undefined;

        if (args.semanticCheck) {
            semanticResult = this._checkSemantics(filename, result.ast, sc, rsc,
                                        //result.parsedModules, result.parsedSubmodules,
                                        debug)
            _addSemanticResult(result, semanticResult);
        }

        semanticTimer.stop()

        return {
            ast               : result.ast,
            errors            : result.errors,
            warnings          : result.warnings,
            parseTimeMs         : parseTimer.timeMs(),
            semanticCheckTimeMs : semanticTimer.timeMs()
        }
    }


    // ------------------------------------------------------------------------
    // Private methods

    private _checkSemantics(filename : string,
                ast : AstItem | undefined,
                sc : StatementCache,
                rsc : ResolvedStmtCache,
                //parsedModules : ParsedModuleMap, parsedSubmodules : ParsedSubmoduleMap,
                debug? : ParseContextDebug) : SemanticResult | undefined
    {

        if (ast) {
            return checkSemantics(ast, sc, rsc, 
                //parsedModules, parsedSubmodules, 
                debug);
        }
    }

}


type _Debug = {
    logger : ParserLogger,
    debug? : ParseContextDebug
}



function _addError(errors : ParserParseError[], text : string, loc : BeginEndPos, filename? : string, root? : {
    uri : string,
    loc : BeginEndPos
}) : void {

    let rootURI : string | undefined = undefined;
    let rootLoc : BeginEndPos | undefined  = undefined;

    if (root) {
        rootURI = root.uri;
        rootLoc = root.loc;
    }

    addError(errors, {
        filename : filename,
        //rootURI : rootURI,
        //rootLoc : rootLoc,
        err : {
            message : text,
            location : beginEndPos2ErrorLocation(loc)
        }
    })
}



type _TrackMap = Map<string, boolean>

type _ParseOneFileArgs = {
    filename    : string,
    rootURI     : string,
    searchPaths : string[],
    rootLoc?    : BeginEndPos,
    level       : number,
    topModule?  : AstItem,
}


type _ParseInclude = {
    inc      : AddIncludeArgs,
    filename : string,
    rootURI  : string,
    rootLoc  : BeginEndPos
}

type _ParseOneTextResult = {
    ast?     : AstItem,
    errors   : ParserParseError[],
    warnings : ParserParseWarning[],
}


function _rootLoc(fileArgs : _ParseOneFileArgs, stmt : AstItem) : BeginEndPos {
    let rootLoc : BeginEndPos | undefined = fileArgs.rootLoc;
    if (fileArgs.level === 0) {
        rootLoc = stmt.loc;
    }

    if (!rootLoc) {
        // Should never happen, just to satisfy the TypeScript compiler.
        throw new Error('No rootLoc');
    }

    return rootLoc;
}

function _getFileInSearchPaths(paths : string[], filename : string) : string | void {
    for (let p of paths) {
        let fp = path.resolve(p, filename);
        if (fileExist(fp)) {
            return fp;
        }
    }
}
function _getExistingSubmoduleFilename(subModuleName : string, searchPaths : string[]) : string | void {
    return _getFileInSearchPaths(searchPaths, subModuleName + '.yang');
}

function _addModuleInclude(includes : _ParseInclude[], inc : AddIncludeArgs, fileArgs : _ParseOneFileArgs, obErrors : ParserParseError[]) {
    let rootLoc = _rootLoc(fileArgs, inc.includeStmt);

    // FIXME: We don't have an arg in AstItem for Sophia
    //let filename = _getExistingSubmoduleFilename(inc.includeStmt.arg, fileArgs.searchPaths);

    let filename = ''

    if (filename) {
        includes.push({
            inc: inc,
            filename: filename,
            rootURI : fileArgs.rootURI,
            rootLoc : rootLoc
        });
    } else {
        _addError(obErrors, `submodule "${inc.includeStmt}" not found in search path`, inc.loc,
            path.basename(fileArgs.filename), {
                uri : fileArgs.rootURI,
                loc : rootLoc
            });
    }
}

function _parseOneText(text : string,
                sc   : StatementCache,
                pmsc : ParsedModuleSubmoduleCache,
                parseArgs : ParseTextArgs,
                fileArgs : _ParseOneFileArgs,
                debug : _Debug) : _ParseOneTextResult
{
    // Out of band result, e.g. for recursive includes
    let obErrors : ParserParseError[] = []


    let result = sophiaParse(text, undefined, {
        filename: fileArgs.filename,
        logger: debug.logger,


        addModuleInclude: (inc : AddIncludeArgs) : void => {
            // FIXME: How to handle this in Sophia
            //_addModuleInclude(includes, inc, fileArgs, obErrors);
        }
    });

    result.errors = result.errors.concat(obErrors);

    return {
        ast               : result.ast,
        errors            : result.errors,
        warnings          : result.warnings,
    }
}