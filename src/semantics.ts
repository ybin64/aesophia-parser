// ----------------------------------------------------------------------------
// Copyright (c) Nicklas Bystedt. All rights reserved.
// Licensed under the MIT License.
// See the LICENSE file in the project root for license information.
// ----------------------------------------------------------------------------

import {
    AstItem
} from './grammar'

import {
    ParserParseError, ParserParseWarning
} from './parser'


import {
    ParserDebug, StatementCache, ResolvedStmtCache
} from './parser-lib'


export type SemanticTiming = {
    foo : number
    /*
    parsedModuleStateMs?      : number
    parsedSubmodulesStateMs?  : number
    getExpandedModulesMs?     : number
    checkModuleSemanticsMs?   : number
    augmentModuleMs?          : number
    checkLeafTypesMs?         : number
    checkExpandedStmtRulesMs? : number
    */
}

/**
 * Semantic information for one module or submodule
 */
export type SemanticResult = {
    /**
     * The name of the module or the module the submodule belongs to
     */
    module : string | undefined

    /**
     * Errors
     */
    errors   : ParserParseError[],

    /**
     * Warnings
     */
    warnings : ParserParseWarning[],

    /**
     * Timing information
     */
    timing : SemanticTiming
}

/*
* Check semantics for Sophia contract
*/
export function checkSemantics(
                   ast : AstItem,
                   sc : StatementCache,
                   rsc : ResolvedStmtCache,
                   debug? : ParserDebug) : SemanticResult
{
    const timing : SemanticTiming = {
        foo : -101
    }
    return {
        module : undefined,
        errors   : [],

        warnings : [],
    
        timing : timing
    }
}