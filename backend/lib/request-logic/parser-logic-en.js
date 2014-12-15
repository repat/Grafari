var C = require("./parser-classes")

/** Parser logic and tokenizer for English language
 */


//Export functions
exports.RootNode = CombinedRequest
exports.tokenize = tokenize


//Some array helper methods
Array.prototype.peek = function () {
    return this[this.length - 1]
}

Array.prototype.empty = function () {
    return this.length == 0
}

Array.prototype.is = function (t1, t2, t3, t4, t5) {
    var tokens = []
    if (t1)
        tokens.push(t1)
    if (t2)
        tokens.push(t2)
    if (t3)
        tokens.push(t3)
    if (t4)
        tokens.push(t4)
    if (t5)
        tokens.push(t5)

    //Check for whether tokens match
    for (var c = 0; c < tokens.length; ++c) {
        var index = this.length - c - 1
        if (index < 0 || this[index] != tokens[c])
            return false
    }
    return true
}

Array.prototype.isNext = function (token) {
    return !this.empty() && this.peek() == token
}

Array.prototype.take = function (t1, t2, t3, t4, t5) {
    //Check whether tokens exist
    var match = this.is(t1, t2, t3, t4, t5)
    var ary = this

    if (!match)
        return false

    var tokens = []
    if (t1)
        tokens.push(t1)
    if (t2)
        tokens.push(t2)
    if (t3)
        tokens.push(t3)
    if (t4)
        tokens.push(t4)
    if (t5)
        tokens.push(t5)


    //Now remove the tokens
    tokens.forEach(function () {
        ary.pop()
    })

    return true
}

Array.prototype.takeNext = function (token) {
    if (this.isNext(token)) {
        this.pop()
        return true
    }
    return false
}

Array.prototype.findFirst = function (predicate) {
    for (var c = 0; c < this.length; ++c)
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
//CondLang        = 'speak' token
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
    var token = ['people', 'men', 'women'].findFirst(function (t) {
        return tokens.takeNext(t)
    })

    if (!token)
        throw parseError("Missing selector. Expected 'people', 'men' or 'women'", tokens)

    return new C.Selector(token)
}

//Condition = ['who'] (CondYounger|CondOlder|...|CondGroup)

//CondRelationship= 'are' 'married' | 'are' 'engaged' | 'are' 'single' | 'are' 'widowed' |
//                  'are' 'in' 'an' open' 'relationship' | 'are' 'seperated' |
//                  'are' 'divorced' | 'are' 'in' 'a' 'civil' 'union' |
//                  'are' 'dating' | 'are' 'in' 'a' 'relationship' | 'whose' 'relationship' 'is' 'complicated'
function Condition(tokens) {
    tokens.takeNext('who') //Skip 'who'

    if (tokens.is('are', 'younger') ||
            tokens.is('are', 'under'))
        return CondYounger(tokens)
    if (tokens.is('are', 'older') ||
            tokens.is('are', 'over'))
        return CondOlder(tokens)
    if (tokens.is('are', 'between'))
        return CondAgeBetween(tokens)
    if (tokens.is('are', 'living'))
        return CondLiveIn(tokens)
    if (tokens.is('are', 'named') ||
            tokens.is('are', 'called'))
        return CondName(tokens)
    if (tokens.is('are', 'working'))
        return CondWorkAt(tokens)
    if (tokens.is('are', 'married') ||
            tokens.is('are', 'engaged') ||
            tokens.is('are', 'single') ||
            tokens.is('are', 'widowed') ||
            tokens.is('are', 'in') ||
            tokens.is('are', 'sperated') ||
            tokens.is('are', 'divorced') ||
            tokens.is('are', 'dating'))
        return CondRelationship(tokens)
    if (tokens.is('are'))
        return CondAgeEqual(tokens)


    if (tokens.is('('))
        return CondGroup(tokens)
    if (tokens.is('live') ||
            tokens.is('lived'))
        return CondLiveIn(tokens)
    if (tokens.is('like'))
        return CondLike(tokens)
    if (tokens.is('were'))
        return CondBorn(tokens)
    if (tokens.is('worked') ||
            tokens.is('work'))
        return CondWorkAt(tokens)
    if (tokens.is('study'))
        return CondStudy(tokens)
    if (tokens.is('whose'))
        return CondRelationship(tokens)
    if (tokens.is('speak'))
        return CondLang(tokens)


    throw parseError("Unexpected next token in token list when parsing a condition", tokens)
}

//CondYounger = 'are' ('younger' 'than' | 'under') Age
function CondYounger(tokens) {
    if (tokens.take('are', 'younger', 'than') ||
            tokens.take('are', 'under')) {
        var age = Age(tokens)
        return new C.CondYounger(age)
    }

    throw parseError("Expected 'are younger than X years' or 'are under X years old'", tokens)
}

//CondOlder = 'are' ('older' 'than' | 'over') Age
function CondOlder(tokens) {
    if (tokens.take('are', 'older', 'than') ||
            tokens.take('are', 'over')) {
        var age = Age(tokens)
        return new C.CondOlder(age)
    }

    throw parseError("Expected 'are older than X years' oder 'are over X years old", tokens)
}

//CondAgeBetween = 'are' 'between' Age 'and' Age
function CondAgeBetween(tokens) {
    if (tokens.take('are', 'between')) {
        var x = Age(tokens)
        if (tokens.take('and')) {
            var y = Age(tokens)
            return new C.CondAgeBetween(x, y)
        }
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

//CondLiveIn = ('live')|('are' 'living')|('lived') 'in' token
function CondLiveIn(tokens) {
    if (tokens.take('live', 'in') ||
            tokens.take('are', 'living', 'in')) {
        if (!tokens.empty()) {
            var location = tokens.pop()
            return new C.CondLiveIn(location, "present")
        }
    } else if (tokens.take('lived', 'in') && !tokens.empty()) {
        var location = tokens.pop()
        return new C.CondLiveIn(location, "past")
    }

    throw parseError("Expected 'live in' or 'are living in' or 'lived in'", tokens)
}

//CondFrom = 'are' 'from' token
function CondFrom(tokens) {
    if (tokens.take('are', 'from') && !tokens.empty()) {
        var location = tokens.pop()
        return new C.CondFrom(location)
    }

    throw parseError("Expected 'are from'", tokens)
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
    if (tokens.take('are', 'named') ||
            tokens.take('are', 'called')) {
        var name = tokens.pop()
        return new C.CondName(name)
    }

    throw parseError("Expected 'are named X' or 'are called X'", tokens)
}

//CondWorkAt = ('work'|'worked'|'are' 'working') 'at' token
function CondWorkAt(tokens) {
    if (tokens.take('work', 'at') ||
            tokens.take('are', 'working', 'at')) {
        if (!tokens.empty()) {
            var employer = tokens.pop()
            return new C.CondWorkAt(employer, "present")
        }
    } else if (tokens.take('worked', 'at') && !tokens.empty()) {
        var employer = tokens.pop()
        return new C.CondWorkAt(employer, "past")
    }

    throw parseError("Expected 'are working at', 'work at' or 'worked at'", tokens)
}

//CondBorn = 'were' 'born' 'in' integer
function CondBorn(tokens) {
    if (tokens.take('were', 'born', 'in') && !tokens.empty()) {
        return new C.CondBorn(integer(tokens))
    }

    throw parseError("Expected 'were born in'", tokens)
}

//CondStudy = ('are' 'studying')|(study') 'at' token
function CondStudy(tokens) {
    if (tokens.take('study', 'at') ||
            tokens.take('are', 'studying', 'at')) {
        if (!tokens.empty()) {
            var university = tokens.pop()
            return new C.CondStudy(university)
        }
    }

    throw parseError("Expected 'are studying at' or 'study at'")
}

//CondRelationship= 'are' 'married' | 'are' 'engaged' | 'are' 'single' | 'are' 'widowed' |
//                  'are' 'in' 'an' open' 'relationship' | 'are' 'seperated' |
//                  'are' 'divorced' | 'are' 'in' 'a' 'civil' 'union' |
//                  'are' 'dating' | 'are' 'in' 'a' 'relationship' | 'whose' 'relationship' 'is' 'complicated'
function CondRelationship(tokens) {
    if (tokens.take('are', 'married'))
        return new C.CondRelationship("married")
    if (tokens.take('are', 'engaged'))
        return new C.CondRelationship("engaged")
    if (tokens.take('are', 'single'))
        return new C.CondRelationship("single")
    if (tokens.take('are', 'widowed'))
        return new C.CondRelationship("widowed")
    if (tokens.take('are', 'in', 'an', 'open', 'relationship'))
        return new C.CondRelationship("in-open-relationship")
    if (tokens.take('whose', 'relationship', 'is', 'complicated'))
        return new C.CondRelationship("its-complicated")
    if (tokens.take('are', 'seperated'))
        return new C.CondRelationship("seperated")
    if (tokens.take('are', 'divorced'))
        return new C.CondRelationship("divorced")
    if (tokens.take('are', 'in', 'a', 'civil', 'union'))
        return new C.CondRelationship("in-civil-union")
    if (tokens.take('are', 'dating'))
        return new C.CondRelationship("dating")
    if (tokens.take('are', 'in', 'a', 'relationship'))
        return new C.CondRelationship("in-any-relationship")

    throw parseError("Expected any kind of relationship description", tokens)
}

//CondLang = 'speak' token
function CondLang(tokens) {
    if (tokens.take('speak') && !tokens.empty()) {
        var lang = tokens.pop()
        return new C.CondLang(lang)
    }

    throw parseError("Expected 'speak'", tokens)
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

//takes a token, checks whether it is convertible to a number and then returns it
function integer(tokens) {
    var number = tokens.pop()
    if (Number(number).toString() != number) //Check for valid number
        throw parseError("Expected a number, but got '" + number + "'", tokens)
    return number
}

//Age = integer ['years'] ['old']
function Age(tokens) {
    var number = integer(tokens)

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
        } else if (rest[0] == ' ' || rest[0] == ',') { //skip whitespace and comma
            rest = rest.substr(1)
        } else if (rest[0] == '(' || rest[0] == ')') {
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
        return {string: "", rest: string.substr(1)};

    var endPos = string.search(/[^\\]"/)
    if (endPos == -1)
        throw "Tokenizer couldn't match quotation marks"

    return {
        string: string.slice(0, endPos + 1).replace(/\\"/g, '"'),
        rest: string.substr(endPos + 2)
    }

}