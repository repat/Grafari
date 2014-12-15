//  ######  Language: ######
//
//CombinedRequest = BasicRequest { 'OR' BasicRequest }
//BasicRequest    = Selector {('AND'|'who') Condition}
//Selector        = ['all'] ('people'|'men'|'women')
//Condition       = ['who'] (CondYounger|CondOlder|...|CondGroup)
//CondYounger     = 'are' ('younger' 'than' | 'under') Age
//CondOlder       = 'are' ('older' 'than' | 'over') Age
//CondAgeBetween  = 'are' 'between' Age 'and' Age
//CondAgeEqual    = 'are' Age
//CondLiveIn      = ('live')|('are' 'living')|('lived') 'in' token
//CondFrom        = 'are' 'from' token
//CondLike        = 'like' token
//CondName        = 'are' ('named'|'called') token
//CondWorkAt      = ('work'|'worked'|'are' 'working') 'at' token
//CondBorn        = 'were' 'born' 'in' integer
//CondStudy       = ('are' 'studying')|('study') 'at' token
//CondRelationship= 'are' 'married' | 'are' 'engaged' | 'are' 'single' | 'are' 'widowed' |
//                  'are' 'in' 'an' open' 'relationship' | 'are' 'seperated' |
//                  'are' 'divorced' | 'are' 'in' 'a' 'civil' 'union' |
//                  'are' 'dating' | 'are' 'in' 'a' 'relationship' | 'whose' 'relationship' 'is' 'complicated'
//CondGroup       = '(' Disjunction ')'
//Disjunction     = Conjunction {'OR' Conjunction}
//Conjunction     = Condition {'AND' Condition }

//Age             = integer ['years'] ['old']


var L = require("./parser-logic-en")
var R = require("./group-resolver")
var T = require("./tree-translator")


// exported functions
exports.tokenize = L.tokenize
exports.tokenizeEn = L.tokenize
exports.tokenizeDe = undefined

exports.parse = flatParse
exports.rawParse = rawParse
exports.flatParse = flatParse
exports.translateTree = T.translate
exports.translate = T.translate
exports.resolveGroups = R.resolveGroups


/** Parses the given sentence according to the defined grammar and then resolves nested requests by
 *  factoring out inner groups (eg. A AND (B OR C) --> A AND B OR A AND C). This conversion must be done, before
 *  passing the tree to translate(). Otherwise translate will fail.
 *
 * @param sentence the sentence to parse
 *
 * @return the flattened parse tree which can be passed to translate() to convert it into Facebook request URLs
 */
function flatParse(sentence) {
    var tree = rawParse(sentence)
    return R.resolveGroups(tree)
}

/** Just tokenizes and then parses the given sentence according to the defined grammar.
 *
 * @param sentence the sentence which should be parsed
 *
 * @return the parse tree of the sentence. Might throw exceptions if sentence format doesn't match the grammar
 */
function rawParse(sentence) {
    var tokens = L.tokenize(sentence)
    tokens.reverse()
    var tree = L.RootNode(tokens)

    if (tokens.length > 0)
        throw "Parse error: parsing request returned with non empty token list: " + tokens.reverse()

    return tree;
}




