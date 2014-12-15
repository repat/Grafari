var C = require("./parser-classes")

/** Parser logic for the German language. Since I don't know how to translate locations, and other stuff this
 *  is just an empty stub for now.
 */

//Export functions
exports.RootNode        = CombinedRequest
exports.CombinedRequest = CombinedRequest
exports.BasicRequest    = BasicRequest
exports.Selector        = Selector
exports.Condition       = Condition
exports.CondYounger     = CondYounger
exports.CondOlder       = CondOlder
exports.CondAgeBetween  = CondAgeBetween
exports.CondAgeEqual    = CondAgeEqual
exports.CondLiveIn      = CondLiveIn
exports.CondLike        = CondLike
exports.CondName        = CondName
exports.CondGroup       = CondGroup
exports.Disjunction     = Disjunction
exports.Conjunction     = Conjunction
exports.Age             = Age

exports.tokenize        = tokenize

//TODO define these functions and a reasonable grammar






//TODO how to tanslate locations, and objects into english for the resolver?











/** Extracts a string enclosed in quotation marks. Only supports very basic escaping. (\")
 * 
 * @param sentence a string beginning with ". 
 * 
 * @return an object { string: ..., rest: ... } containing the extracted string and an the remaining sentence.
 */
function getString(sentence) {
  var string = sentence.substr(1)
  if (string[0] == '"') 
    return { string:"", rest:string.substr(1) };
  
  var endPos = string.search(/[^\\]"/)
  if (endPos == -1)
    throw "Tokenizer couldn't match quotation marks"

  return {
    string: string.slice(0,endPos+1).replace(/\\"/g, '"') ,
    rest: string.substr(endPos+2)
  }

}