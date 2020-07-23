const frac_aes = require('raw-loader!./../stdlib/Frac.aes')
const func_aes = require('raw-loader!./../stdlib/Func.aes')
const list_aes = require('raw-loader!./../stdlib/List.aes')
const list_internal_aes = require('raw-loader!./../stdlib/ListInternal.aes')
const option_aes = require('raw-loader!./../stdlib/Option.aes')
const pair_aes = require('raw-loader!./../stdlib/Pair.aes')
const triple_aes = require('raw-loader!./../stdlib/Triple.aes')


function _aes2String(aes : any) : string {
    if (aes.default.startsWith('export default')) {
        // A string representation of the module, happens when used in vscode
        return eval(aes.default.substr(15))
    }

    return aes.default
}


const _explicit_stdlibs : {[key : string] : string} = {
    'Frac.aes'         : _aes2String(frac_aes),
    'Func.aes'         : _aes2String(func_aes),
    'List.aes'         : _aes2String(list_aes),
    'ListInternal.aes' : _aes2String(list_internal_aes),
    'Option.aes'       : _aes2String(option_aes),
    'Pair.aes'         : _aes2String(pair_aes),
    'Triple_aes'       : _aes2String(triple_aes)
}

export function isExplicitStdlibUri(uri : string) {
    return uri in _explicit_stdlibs
}

export function getExplicitStdlibContent(uri : string) : string {
    const tmp = _explicit_stdlibs[uri] 
    return _explicit_stdlibs[uri]
}

export function getExplicitStdlibFilenames() : string [] {
    return Object.keys(_explicit_stdlibs).sort().
            filter(i => i !== 'ListInternal.aes')
}