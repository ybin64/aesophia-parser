// ----------------------------------------------------------------------------
// Copyright (c) Nicklas Bystedt. All rights reserved.
// Licensed under the MIT License.
// See the LICENSE file in the project root for license information.
// ----------------------------------------------------------------------------

import * as path from 'path'
import * as fs from 'fs'
import * as process from 'process'

// -----------------------------------------------------------------------------

type Args = {
    files       : string[]
    searchPaths : string[]

    test : {
        showTimes : boolean
    }
}


function _printUsageAndExit(exitCode : number) {
    function w(line : string) {
        console.log(line);
    }

    w('Usage: aesophia-parser [options] <file>');
    w('');
    w('Options:');
    //w('  -j, --json  Output json');
    w('  -h, --help  Show help');
    //w('  -p, --path <directory>')
    //w('  --test-timestamps Show parse result times')
    w('');

    process.exit(exitCode);
}


function _parseArgs() : Args {
    const ret : Args = {
        files : [],
        searchPaths : [],
        test : {
            showTimes : false
        }
    }


    for (let ix = 0; ix < process.argv.length; ix++) { //process.argv.forEach((v, ix) => {
        let v : string = process.argv[ix]
    
        if (ix < 2) {
            continue
        }
    
        if ((v == '-h') || (v == '--help')) {
            _printUsageAndExit(0);
        }  else if ((v == '-p') || (v == '--path')) {
            if (ix < (process.argv.length - 1)) {
                ret.searchPaths.push(process.argv[++ix])
            } else {
                _printUsageAndExit(1)
            }
        } else if (v[0] !== '-') {
            ret.files.push(v);
        } else {
            _printUsageAndExit(1);
        }
    }

    return ret
}


// -----------------------------------------------------------------------------


import {
    ParseError,
    AddIncludeFunc, BeginEndPos, AddIncludeArgs
} from './grammar'


import {
    ParserParseError,
    ParserLogger,
    ParserParseArgs, ParseResult, parse
} from './parser'

import {
    Timer, ParseContext, ContextParseResult,
    StatementCache, ResolvedStmtCache, ParsedModuleSubmoduleCache
} from './parser-lib'



let _dummyLogger : ParserLogger = {
    info : (text : string) => {}
}

let _logger : ParserLogger = {
    info : (text) : void => {
        console.log(text);
    }
}

function _logErrorOrWarning(type : string, e : ParserParseError, filename? : string) {
    if (e.filename !== undefined) {
        filename = e.filename;
    }

    let message : string;

    if (e.err) {
        let err = e.err;
        let line = err.location.begin.line;
        let col = err.location.begin.column;

        message = line + ':' + col

        message += `: ${type}: ` + err.message
    } else if (e.message) {
        message = ` ${type}: ` + e.message;
    } else {
        throw new Error('Neither err or message is defined in error message structure');
    }

    if (filename !== undefined) {
        console.log(path.basename(filename) + ':' + message);
    } else {
        console.log(message);
    }
}

function _logError(e : ParserParseError, filename? : string) {
    _logErrorOrWarning('error', e, filename);
  }
  
  function _logWarning(e : ParserParseError, filename? : string) {
    _logErrorOrWarning('warning', e, filename);
  }

function _logInfo(text : string) {
    console.log(text)
}


function _testPrefix(args : Args) {
    // Do nothing
}

function _testSuffix(args : Args) {
    // Do nothin
}

function _testShowTimes(args : Args, totalTimeMs : number, result : ContextParseResult) {

    function _logSemanticItem(name : string, timeMs : number | undefined) {
        let value : string

        if ((timeMs === undefined) || (timeMs === NaN)) {
            value = '-'
        } else {
            value = `${timeMs / 1000.0} (s)`
        }

        _logInfo(`  ${name} : ${value}`)
   }

    if (args.test.showTimes) {
        _logInfo('')
        _logInfo(`Total time           : ${totalTimeMs / 1000.0} (s)`)
        _logInfo(`Parse time           : ${result.parseTimeMs / 1000.0} (s)`)
        _logInfo(`Semantic check time  : ${result.semanticCheckTimeMs / 1000.0} (s)`)

        
        if (result.semanticResult) {
            let t = result.semanticResult.timing

            /* 
            _logSemanticItem('parsedModulestate     ', t.parsedModuleStateMs)
            _logSemanticItem('parsedSubmodulesState ', t.parsedSubmodulesStateMs)
            _logSemanticItem('getExpandedModules    ', t.getExpandedModulesMs)
            _logSemanticItem('checkModuleSemantics  ', t.checkModuleSemanticsMs)
            _logSemanticItem('augmentModule         ', t.augmentModuleMs)
            _logSemanticItem('checkLeafTypes        ', t.checkLeafTypesMs)
            _logSemanticItem('checkExpandedStmtRules', t.checkExpandedStmtRulesMs)
            */
            
        }      
    }
}


// -----------------------------------------------------------------------------

function _sortError(a : ParserParseError, b : ParserParseError) : number {
    function _cmp(a : ParseError, b : ParseError) {
        if (a.location.begin.line < b.location.begin.line) {
            return -1;
        } else if (a.location.begin.line > b.location.begin.line) {
            return 1;
        } else {
            if (a.location.begin.column < b.location.begin.column) {
                return -1
            } else if (a.location.begin.column > b.location.begin.column) {
                return 1
            } else {
                return 0;
            }
        }
    }

    if (a.message) {
        return -1;
    } else if (b.message) {
        return 1;
    }

    // Both have a valid err member.

    if (a.err && b.err) {
        // Non explicit filenames have priority
        if ((a.filename === undefined) && (b.filename === undefined)) {
            return _cmp(a.err, b.err);
        } else if (a.filename === b.filename) {
            return _cmp(a.err, b.err);
        } else if (a.filename === undefined) {
            return -1
        } else if (b.filename === undefined) {
            return 1;
        } else if (a.filename <= b.filename) {
            return -1;
        } else {
            return 1;
        }
    }

    return 0;
}

function _handleParseResult(result : ContextParseResult, filename? : string) {
    if (result.errors.length > 0) {
        for (let e of result.errors.sort(_sortError)) {
            _logError(e, filename);
        }
    }

    if (result.warnings.length > 0) {
        for (let w of result.warnings.sort(_sortError)) {
            _logWarning(w, filename);
        }
    }
}

function _processExit(result : ContextParseResult) {
    if (result.errors.length > 0) {
        process.exit(1)
    } else {
        process.exit(0)
    }
}

// -----------------------------------------------------------------------------


function _parseText(text : string, args? : ParserParseArgs) : ParseResult {
    return parse(text, undefined, args);
}

function _parseStdin() {
    var stdin = process.stdin;
    var chunks : Buffer[] = [];

    stdin.resume();
    stdin.setEncoding('utf8');

    stdin.on('data', function(chunk) {
        chunks.push(chunk);
    });

    stdin.on('end', function() {
        var text = chunks.join();
        var result = _parseText(text);

        // FIXME: Can't call handleParseResult with this parameter
        //handleParseResult(result);
    });
}

// -----------------------------------------------------------------------------

class NullParsedModuleSubmoduleCache implements ParsedModuleSubmoduleCache {
    
    public getModule(moduleName : string) : undefined {
        return undefined
    }

    public getSubmodule(moduleName : string) : undefined {
        return undefined
    }
    
}
function _parseOneFile(args : Args, filename : string) {
    let totalTimer = new Timer()

    let logger = _logger;
    let ctx : ParseContext = new ParseContext(logger);
    let sc = new StatementCache()
    let rsc = new ResolvedStmtCache()
    let pmsc = new NullParsedModuleSubmoduleCache()

    _testPrefix(args)

    let searchPaths : string[] = args.searchPaths.concat([])
    searchPaths.push(path.dirname(path.resolve(process.cwd(), filename)))

    //ctx.addModuleSearchPath(path.dirname(path.resolve(process.cwd(), filename)));

    let result = ctx.parseFile(filename, filename, searchPaths, sc, rsc, pmsc);

    // Dirty fix to help with error sorting
    for (let e of result.errors) {
        if (e.err && (e.filename === filename)) {
            e.filename = undefined;
        }
    }

    _handleParseResult(result, filename)
    totalTimer.stop()

    _testSuffix(args)
    _testShowTimes(args, totalTimer.timeMs(), result)

    _processExit(result)
}



function _parseMultipleFiles(filenames : string[]) {
    //console.log('jsyang : parseMultipleFiles : 00 : filenames=', filenames)
    
        var successCount = 0;
        var failCount = 0;
    
        for (var c = 0; c < filenames.length; c++) {
            var filename = filenames[c];
    
            var text = fs.readFileSync(filename, 'utf8');
            var result = _parseText(text);
    
            if (result.errors.length === 0) {
                console.log(filename + ' : OK');
                successCount += 1;
            } else {
                failCount += 1;
                console.log(filename + ' : FAILED');
            }
        }
    
        console.log('Total    : ' + filenames.length);
        console.log('Success  : ' + successCount);
        console.log('Fail     : ' + failCount);
    
        if (failCount > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    
    }
    

// -----------------------------------------------------------------------------
// main
// -----------------------------------------------------------------------------

const args = _parseArgs()

if (args.files.length === 0) {
    _parseStdin();
} else if (args.files.length === 1) {
    _parseOneFile(args, args.files[0]);
} else {
    _parseMultipleFiles(args.files);
}