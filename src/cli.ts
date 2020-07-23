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
    ParseErrWarn
} from './grammar'


import {
    FileParseError, FileParseWarning,
    ParserLogger,

} from './parser'

import {
    Timer, 
    StatementCache, ResolvedStmtCache, ParsedModuleSubmoduleCache, getFileContent
} from './parser-lib'
import { Scanner } from './scanner';

import * as parser_impl from './parser-impl'
import * as parsed_file from './parsed-file'
import * as explicit_stdlib from './explicit-stdlib'


let _dummyLogger : ParserLogger = {
    info : (text : string) => {}
}

let _logger : ParserLogger = {
    info : (text) : void => {
        console.log(text);
    }
}

function _logErrorOrWarning(type : string, e : FileParseError, filename? : string) {
    if (e.filename !== undefined) {
        filename = e.filename;
    }

    let message : string;

    if (e.location) {
        const line = e.location.begin.line;
        const col = e.location.begin.column;

        message = line + ':' + col

        message += `: ${type}: ` + e.message
    } else {
        message = ` ${type}: ` + e.message;
    } 

    if (filename !== undefined) {
        console.log(path.basename(filename) + ':' + message);
    } else {
        console.log(message);
    }
}

function _logError(e : FileParseError, filename? : string) {
    _logErrorOrWarning('error', e, filename);
  }
  
  function _logWarning(e : FileParseError, filename? : string) {
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

type ParseFileResult = {
    errors : FileParseError[]
    warnings : FileParseWarning[]
}

function _testShowTimes(args : Args, totalTimeMs : number, result : ParseFileResult) {

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


        //_logInfo(`Parse time           : ${result.parseTimeMs / 1000.0} (s)`)
        //_logInfo(`Semantic check time  : ${result.semanticCheckTimeMs / 1000.0} (s)`)

        /*
        if (result.semanticResult) {
            let t = result.semanticResult.timing

            
            _logSemanticItem('parsedModulestate     ', t.parsedModuleStateMs)
            _logSemanticItem('parsedSubmodulesState ', t.parsedSubmodulesStateMs)
            _logSemanticItem('getExpandedModules    ', t.getExpandedModulesMs)
            _logSemanticItem('checkModuleSemantics  ', t.checkModuleSemanticsMs)
            _logSemanticItem('augmentModule         ', t.augmentModuleMs)
            _logSemanticItem('checkLeafTypes        ', t.checkLeafTypesMs)
            _logSemanticItem('checkExpandedStmtRules', t.checkExpandedStmtRulesMs)
            
            
        }   
        */   
    }
}


// -----------------------------------------------------------------------------

function _sortError(a : FileParseError, b : FileParseError) : number {
    function _cmp(a : ParseErrWarn, b : ParseErrWarn) {
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

    if (!a.location) {
        return -1;
    } else if (!b.location) {
        return 1;
    }

    // Both have a valid location 

    const aloc = a as ParseErrWarn
    const bloc = b as ParseErrWarn

    // Non explicit filenames have priority
    if ((a.filename === undefined) && (b.filename === undefined)) {
        return _cmp(aloc, bloc);
    } else if (a.filename === b.filename) {
        return _cmp(aloc, bloc);
    } else if (a.filename === undefined) {
        return -1
    } else if (b.filename === undefined) {
        return 1;
    } else if (a.filename <= b.filename) {
        return -1;
    } else {
        return 1;
    }


    return 0;
}

function _handleParseResult(result : ParseFileResult, filename? : string) {
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

function _processExit(result : ParseFileResult) {
    if (result.errors.length > 0) {
        process.exit(1)
    } else {
        process.exit(0)
    }
}

// -----------------------------------------------------------------------------

/*
function _parseText(text : string) : parserimpl.ParseResult {
    //return parse(text, undefined, args);
    const scanner = new Scanner(text)

    return parserimpl.parse(scanner)
}
*/

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

/*
class NullParsedModuleSubmoduleCache implements ParsedModuleSubmoduleCache {
    
    public getModule(moduleName : string) : undefined {
        return undefined
    }

    public getSubmodule(moduleName : string) : undefined {
        return undefined
    }
    
}
*/

function _fileContentResolver(fileuri : string) : string | false {
    if (explicit_stdlib.isExplicitStdlibUri(fileuri)) {
        return explicit_stdlib.getExplicitStdlibContent(fileuri)
    }

    return false
} 

function _parseText(text : string) : parsed_file.TextParserResult {
    const scanner = new Scanner(text)
    return parser_impl.parse(scanner)
}

function _parseOneFile(args : Args, filename : string) {
    let totalTimer = new Timer()

    let logger = _logger;

    _testPrefix(args)

    let searchPaths : string[] = args.searchPaths.concat([])
    searchPaths.push(path.dirname(path.resolve(process.cwd(), filename)))

    const parseResult = _parseText(getFileContent(filename))

    const result : ParseFileResult = {
        warnings : parseResult.warnings,
        errors   : parseResult.errors
    }

    if (parseResult.ast) {
        const cache = new parsed_file.ParsedFileCache()
        const pf = parsed_file.createParsedFile({
            fileuri  : filename, 
            fileAst  : parseResult.ast,
            warnings : parseResult.warnings,
            errors   : parseResult.errors
        })

        cache.addParsedFile(pf, _fileContentResolver, _parseText)
        result.warnings = cache.getWarnings()
        result.errors   = cache.getErrors()

    }

    // Dirty fix to help with error sorting
    for (let e of result.errors) {
        if (e.location && (e.filename === filename)) {
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