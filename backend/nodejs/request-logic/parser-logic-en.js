var C = require("./parser-classes")

/** Parser logic and tokenizer for English language
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


//Some array helper methods
Array.prototype.peek = function() {
  return this[this.length-1]
}

Array.prototype.empty = function () {
  return this.length == 0
}

Array.prototype.isNext = function(token) {
  return !this.empty() && this.peek() == token
}

Array.prototype.takeNext = function(token) {
  if (this.isNext(token)) {
    this.pop()
    return true
  }
  return false
}

Array.prototype.findFirst = function(predicate) {
  for(var c = 0; c < this.length; ++c) 
    if (predicate(this[c]))
      return this[c]
  return undefined
}

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
//CondLiveIn      = ('live')|('are' 'living') 'in' token
//CondLike        = 'like' token
//CondName        = 'are' ('named'|'called') token
//CondGroup       = '(' Disjunction ')'
//Disjunction     = Conjunction {'OR' Conjunction}
//Conjunction     = Condition {'AND' Condition }

//Age             = integer ['years'] ['old']


//CombinedRequest = BasicRequest { 'OR' BasicRequest }
function CombinedRequest(tokens) {
  var combinedRequest = new C.CombinedRequest(BasicRequest(tokens))
  while (tokens.takeNext('OR')) {
    combinedRequest.push(BasicRequest(tokens))
  }
  return combinedRequest
}

//BasicRequest = Selector {('AND'|'who') Condition}
function BasicRequest(tokens) {
  var basicRequest = new C.BasicRequest(Selector(tokens))
  while (tokens.takeNext('AND') || tokens.takeNext('who')) {
    basicRequest.push(Condition(tokens))
  }
  return basicRequest
}

//Selector = ['all'] ('people'|'men'|'women')
function Selector(tokens) {
  tokens.takeNext('all')
  var token = ['people', 'men', 'women'].findFirst(function(t) { 
    return tokens.takeNext(t) 
  })

  if (!token)
    throw parseError("Missing selector. Expected 'people', 'men' or 'women'", tokens)

  return new C.Selector(token)
}

//Condition = ['who'] (CondYounger|CondOlder|...|CondGroup)
function Condition(tokens) { 
  tokens.takeNext('who') //Skip 'who'

  if (tokens.takeNext('are')) { //Choose between conditions
    if (tokens.isNext('younger') || tokens.isNext('under')) {
      tokens.push('are') //Put back 'are'
      return CondYounger(tokens)
    } else if (tokens.isNext('older') || tokens.isNext('over')) {
      tokens.push('are')
      return CondOlder(tokens)
    } else if (tokens.isNext('between')) {
      tokens.push('are')
      return CondAgeBetween(tokens)
    } else if (tokens.isNext('living')) {
      tokens.push('are')
      return CondLiveIn(tokens)
    } else if (tokens.isNext('named') || tokens.isNext('called')) {
      tokens.push('are')
      return CondName(tokens)
    } else { //Only remaining possibility
      tokens.push('are')
      return CondAgeEqual(tokens)
    }
  } else {
    if (tokens.isNext('('))
      return CondGroup(tokens)
    else if (tokens.isNext('live'))
      return CondLiveIn(tokens)
    else if (tokens.isNext('like'))
      return CondLike(tokens)
    

    throw parseError("Unexpected next token in token list when parsing a condition", tokens)
  }
}

//CondYounger = 'are' ('younger' 'than' | 'under') Age
function CondYounger(tokens) {
  if (tokens.takeNext('are')) {
    if ((tokens.takeNext('younger') && tokens.takeNext('than')) || (tokens.takeNext('under'))) {
      var age = Age(tokens)
      return new C.CondYounger(age)
    }
  } 

  throw parseError("Expected 'are younger than X years' or 'are under X years old'", tokens)
}

//CondOlder = 'are' ('older' 'than' | 'over') Age 
function CondOlder(tokens) {
  if (tokens.takeNext('are')) {
    if ((tokens.takeNext('older') && tokens.takeNext('than')) || tokens.takeNext('over')) {   
      var age = Age(tokens)
      return new C.CondOlder(age)
    }
  }

  throw parseError("Expected 'are older than X years' oder 'are over X years old", tokens)
}

//CondAgeBetween = 'are' 'between' Age 'and' Age
function CondAgeBetween(tokens) {
  if (tokens.takeNext('are') &&
      tokens.takeNext('between')) {
    var x = Age(tokens)
    if (tokens.takeNext('and')) {
      var y = Age(tokens)
      return new C.CondAgeBetween(x,y)
    }
    throw parseError("Expected 'and' in 'are between X and Y years old'", tokens)
  }
  throw parseError("Expected 'are between X and Y years old'", tokens)
}

//CondAgeEqual = 'are' Age
function CondAgeEqual(tokens) {
  if (tokens.takeNext('are')) {
    var age = Age(tokens)
    return new C.CondAgeEqual(age)
  }

  throw parseError("Expected 'are' in 'are X years old'", tokens)
}

//CondLiveIn = ('live')|('are' 'living') 'in' token
function CondLiveIn(tokens) {
  if (tokens.takeNext('live') || (
      tokens.takeNext('are') &&
      tokens.takeNext('living'))) {
    if (tokens.takeNext('in') && !tokens.empty()) {
      var location = tokens.pop()
      return new C.CondLiveIn(location)
    }
  }

  throw parseError("Expected 'live in' or 'are living in'", tokens)
}

//CondLike = 'like' token
function CondLike(tokens) {
  if (tokens.takeNext('like') && !tokens.empty()) {
    var what = tokens.pop()
    return new C.CondLike(what)
  }

  throw parseError("Expected 'like X'", tokens)
}

//CondName  = 'are' ('named'|'called') token
function CondName(tokens) {
  if (tokens.takeNext('are')) {
    if ((tokens.takeNext('named') || tokens.takeNext('called')) && !tokens.empty()) {
      var name = tokens.pop()
      return new C.CondName(name)
    }
  }

  throw parseError("Expected 'are named X' or 'are called X'", tokens)
}

//CondGroup       = '(' Disjunction ')'
//Disjunction     = Conjunction {'OR' Conjunction}
//Conjunction     = Condition {'AND' Condition }
function CondGroup(tokens) {
  if (!tokens.takeNext('('))
    throw parseError("Expected a group, but lost sight of the '('", tokens)

  var disjunction = Disjunction(tokens)
  if (!tokens.takeNext(')')) 
    throw parseError("Last group is missing a closing parenthesis", tokens)

  return new C.CondGroup(disjunction)
}

//Disjunction = Conjunction {'OR' Conjunction}
function Disjunction(tokens) {
  var conjunction = Conjunction(tokens)
  var disjunction = new C.Disjunction(conjunction)
  while (tokens.takeNext('OR'))
    disjunction.push(Conjunction(tokens))

  return disjunction
}

//Conjunction = Condition {'AND' Condition }
function Conjunction(tokens) {
  var condition = Condition(tokens)
  var conjunction = new C.Conjunction(condition)
  while (tokens.takeNext('AND'))
    conjunction.push(Condition(tokens))

  return conjunction
}

//Age = integer ['years'] ['old']
function Age(tokens) {
  var number = tokens.pop()
  if (Number(number).toString() != number) //Check for valid number
    throw parseError("Expected a number when parsing an age, but got '" + number + "'", tokens)

  if (tokens.takeNext('years'))
    tokens.takeNext('old')

  return number //is still a string
}

function parseError(message, tokens) {
  return errmsg = "Parse-Error: " + message + ", got stuck at: " + tokens.reverse()
}




/** Accepts a sentence and the extracts all tokens from it. All tokens which aren't enclosed in quotation marks
 *  and aren't special tokens ('AND', 'OR', 'NOT') are converted into lowercase characters.
 *
 * @param sentence the sentence to tokenize 
 *
 * @return and array of strings. Every string represents a single token
 */
function tokenize(sentence) {
  var tokens = []
  var rest = sentence

  
  while (rest.length > 0) {
    if (rest[0] == '"') {
      var strData = getString(rest)
      rest = strData.rest
      tokens.push(strData.string)
    } else if(rest[0] == ' ' || rest[0] == ',') { //skip whitespace and comma
      rest = rest.substr(1) 
    } else if(rest[0] == '(' || rest[0] == ')') {
      tokens.push(rest[0])
      rest = rest.substr(1)
    } else { //regular token
      var nextSpace = rest.search(/(\(|\)|,| )/)
      if (nextSpace == -1) 
        nextSpace = rest.length

      var token = rest.slice(0, nextSpace)
      if (token != "AND" && token != "OR" && token != "NOT")
        token = token.toLowerCase()
    
      tokens.push(token)
      rest = rest.substr(nextSpace)
    }
  }

  return tokens
}


/** Extracts a string enclosed in quotation marks. Only supports very basic escaping. (\")
 * 
 * @param sentence a string beginning with ". 
 * 
 * @return an object { string: ..., rest: ... } containing the extracted string and an the remaining sentence.
 */
function getString(data) {
  var string = data.substr(1)
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