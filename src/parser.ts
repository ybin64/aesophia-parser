// ----------------------------------------------------------------------------
// Copyright (c) Nicklas Bystedt. All rights reserved.
// Licensed under the MIT License.
// See the LICENSE file in the project root for license information.
// ----------------------------------------------------------------------------

import * as assert from 'assert'
import * as path from 'path'

import {
    AstItem, AstItemType,
    ParseErrWarn, ParseError, ParseWarning, ParseArgs,
    ErrWarnLocation, BeginEndPos,
    AddIncludeFunc, AddIncludeArgs
} from './grammar'

import {
    beginEndPos2ErrorLocation
} from './parser-lib'

import {Scanner} from './scanner'



/**
 * Used for both errors and warnings
 * 
 * NOTE: withLock and noLocMessage are mutually exclusive
 */
export type FileParseErrWarn = {
    message : string
    location? : ErrWarnLocation

    filename? : string,
}

export type FileParseError = FileParseErrWarn
export type FileParseWarning = FileParseErrWarn

export type ParseResult = {
    ast          : undefined | AstItem,
    errors       : FileParseError[],
    warnings     : FileParseWarning[],
}

export function addError(errors : FileParseError[], error :  FileParseError | string) : void {
  
    if (typeof error === 'string') {
        errors.push({
            message : error
        })
    } else {
        errors.push(error);
    }
}

export function addBeginEndPosError(
                    errors : FileParseError[],
                    text : string,
                    loc : BeginEndPos,
                    filename? : string,
                    //refLoc? : BeginEndPos,
                    //refFilename? : string
                    ) : void
{
    addError(errors, {
        filename : filename,
        
        message : text,
        location : beginEndPos2ErrorLocation(loc),
    

        //refLoc : refLoc,
        //refFilename : refFilename
    })
}

export function createBeginEndPosError(message : string, loc : BeginEndPos, filename? : string) : FileParseError {
    const ret : FileParseError = {
        message : message,
        location : beginEndPos2ErrorLocation(loc)  
    }

    if (filename) {
        ret.filename = filename
    }

    return ret
}

export type ErrorLocRef = {
    uri : string,
    loc : BeginEndPos
}

export function addErrorWithRef(errors : FileParseError[], text : string, errRef : ErrorLocRef) {
    addBeginEndPosError(errors, text, errRef.loc, errRef.uri)
}

export function appendErrors(dest : FileParseError[], src : FileParseError[] | undefined) : void {
    if (src) {
        for (let e of src) {
            dest.push(e)
        }
    }
}


export function errorLocationStr(uri : string, pos : BeginEndPos) {
    return `${path.basename(uri)}:${pos.b[1]}:${pos.b[2]}`;
}

export function initParseResult(ast? : AstItem) : ParseResult {
    return {
        ast      : ast,
        errors   : [],
        warnings : []
    };
}

/**
 * Return ast from result.
 * NOTE: This is a helper to silence the TypeScript compiler, only call when you are sure that the ast exist in the result.
 */
export function astFromParseResult(result : ParseResult) : AstItem {
    if (result.ast === undefined) {
        throw new Error('ast must exist');
    }
    return result.ast;
}

export interface ParserLogger {
    info : (text : string) => void;
}
export type ParserParseArgs = {
    filename       : string
    logger         : ParserLogger

    addModuleInclude? : AddIncludeFunc
}

let _dummyLogger = {
    info : (text : string) => {}
}

/**
 * Parse sophia content
 *
 * @param text Sophia text
 * @param rule Start rule (optional)
 *
 * @return ParseResult
 *
 */
/*
export function parse(text : string, type? : AstItemType, args? : ParserParseArgs) : ParseResult {
    if (args === undefined) {
        args = {
            filename : '-',
            logger   : _dummyLogger
        };
    }

    let addModuleInclude = args.addModuleInclude;

 
    if (!addModuleInclude) {
        addModuleInclude = (args : AddIncludeArgs) : void => {}
    }

    if (type === undefined) {
        type = 'top-decl'
    }

    return _parse(text, args, addModuleInclude, type)
}
*/
// ----------------------------------------------------------------------------
/*
function _parse(text : string,
            args : ParserParseArgs,
            addSubmoduleInclude : AddIncludeFunc,
            type : AstItemType) : ParseResult
{
    var ret : ParseResult = initParseResult();

    let scanner = new Scanner(text)

    let parser = new ParserImpl()

    let result : ParserImplResult

    let manualArgs = {
        addModuleInclude : addSubmoduleInclude
    }
    if (type === 'top-decl') {
        result = parser.parse(manualArgs, scanner)
    } else {
        result = parser.parseAstItem(manualArgs, type, scanner)
    }

    if (result.stmt !== undefined) {
        ret.ast = result.stmt
    }

    for (let e of result.errors) {
        ret.errors.push({
            message  : e.message,
            location : e.location,
            filename : args.filename
        });
    }

    return ret
}
*/