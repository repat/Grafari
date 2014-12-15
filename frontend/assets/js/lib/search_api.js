/** SEARCH-API
 * The search object will accept a query sentence in english, translate it into
 * one or more Facebook requests and will then return the results as list of objects.
 * Keywords are: NOT, AND, OR   (listed in precedence order)
 * The keywords don't have to be seperated by spaces. (e.g. ORNOT <=> OR NOT)
 *
 * Parentheses can be used to group a part of the sentence. (e.g. 'NOT ( xy AND yz)' - The NOT will apply to the whole expression 'xy AND yz')
 *
 * requires underscore.js to work (<script src="//underscorejs.org/underscore-min.js"></script>)
 */

if (typeof (_) === "undefined") {
    window.alert("Underscore.js missing!");
}

//Some helper functions to deal with arrays
Array.prototype.top = function () {
    return this[this.length - 1];
};
Array.prototype.empty = function () {
    return this.length === 0;
};

var search = {
    /** Main method, which issues one or more facebook searches depending on the query and returns a list of result objects
     *
     * @param query the search query sentence
     *
     * @return a list of objects which where found by executing the search query
     */
    search: function (query) {
        var tokenlist = this._tokenize(query);
        var tree = parser.parse(tokenlist);
        //TODO implement remaining functions
        //TODO normalize   Bsp:  NOT ( a OR n )  -> NOT a AND NOT b
        //TODO for later: how to interpret something like 'NOT a'? Analyze the whole sentence?
        throw "Method not fully implemented yet!"
    },
    /** This method splits the sentence into single tokens, used for logical analysis.
     *  This method will be called only internally
     *
     * @param sentence the sentence to split
     *
     * @return an array of tokens and strings
     */
    _tokenize: function (sentence) {
        var tokenlist = [];

        while (sentence.length > 0) {
            var pos = sentence.search(/AND|OR|NOT|\(|\)/);
            if (pos === -1) { //No more tokens to read
                tokenlist.push(sentence.trim());
                sentence = "";
            } else {
                //Find the matching token
                var token = _.find(this.tokens(), function (t) {
                    return sentence.substr(pos).indexOf(t.name) === 0;
                });

                tokenlist.push(sentence.substr(0, pos).trim());
                tokenlist.push(token);
                sentence = sentence.substr(pos + token.name.length);
            }
        }


        return _.filter(tokenlist, function (item) {
            return item !== "";
        }); //Filter empty strings and return result
    },
    token: {
        and: {name: "AND"},
        or: {name: "OR"},
        not: {name: "NOT"},
        leftp: {name: "("},
        rightp: {name: ")"}
    },
    tokens: function () {
        return [this.token.and, this.token.or, this.token.not, this.token.leftp, this.token.rightp];
    }
};



/** the parser object will parse tokenized requests and build a syntax tree according to the following rules:
 *
 * atom = sentence | NOT atom | ( expression )
 * conjunction = atom AND conjunction | atom
 * disjunction = conjunction OR disjunction | conjunction
 * expression = disjunction
 *
 */
var parser = {
    /** This method parses the tokenized string and returns a syntax tree consisting of:
     *  operators(AND, OR, NOT) and queries(the sub sentences)
     *  If there are any errors, then the parser will throw them
     *
     * @param tokenized_sentence the sentence, after passing it to the _tokenize() method
     *
     * @return the parsed syntax tree
     */
    parse: function (tokenized_sentence) {
        var token_stack = tokenized_sentence.reverse();

        if (token_stack.empty())
            return new Empty();

        var tree = this._expression(token_stack);

        if (!token_stack.empty()) {
            throw "Parse error: expression returned with unparsed tokens: " + JSON.stringify(token_stack.reverse())
        }
        return tree;
    },
    /** The root node is an expression
     * expression = disjunction
     */
    _expression: function (tokens) {
        return this._disjunction(tokens);
    },
    /** A disjunction of conjunctions or just a conjunction
     *
     * disjunction = conjunction OR disjunction | conjunction
     *
     * @param tokens the tokenstack
     *
     * @return the node representing the disjunction
     */
    _disjunction: function (tokens) {
        var conjunction = this._conjunction(tokens);
        if (tokens.top() === search.token.or) { // conjunction OR disjunction
            tokens.pop();
            var disjunction = this._disjunction(tokens);
            return new Or(conjunction, disjunction);
        } else {                               // conjunction
            return conjunction;
        }
    },
    /** A conjunction of atoms or just an atom.
     *
     * conjunction = atom AND conjunction | atom
     *
     * @param tokens the tokenstack
     *
     * @return the node representing the conjunction
     */
    _conjunction: function (tokens) {
        var atom = this._atom(tokens);
        if (tokens.top() === search.token.and) { // atom AND conjunction
            tokens.pop();
            var conjunction = this._conjunction(tokens);
            return new And(atom, conjunction);
        } else {                                // atom
            return atom;
        }
    },
    /** A logical atom. For simplicity (expression) and NOT atom are also atoms.
     *  Essentially everything what can be negated is an atom
     *
     *  atom = sentence | NOT atom | ( expression )
     *
     * @param tokens the tokenstack
     *
     * @return a node representing the current atom
     */
    _atom: function (tokens) {
        if (tokens.empty()) {
            throw "Parse error: expecting a token while parsing an atom, but none found!"
        }

        var current = tokens.pop();
        if (typeof (current) === "string") {         // sentence
            return new Query(current);
        } else if (current === search.token.not) {   // NOT atom
            var atom = this._atom(tokens);
            return new Not(atom);
        } else if (current === search.token.leftp) { // ( expression )
            var expression = this._expression(tokens);
            if (tokens.top() !== search.token.rightp) {
                throw "Parse error: missing right parenthesis at end of expression. Remaining sentence: " + JSON.stringify(tokens.reverse())
            }
            tokens.pop(); //Remove right parenthesis from stack
            return expression;
        } else {
            this._unknownToken("atom", current, tokens); //Something went wrong
        }
    },
    _unknownToken: function (parserState, token, tokens) {
        throw "Parse error: Unexpected token '" + JSON.stringify(token) + "' in when parsing " + parserState + ". Remaining sentence: " + JSON.stringify(tokens.reverse())
    }
};


/** Class representing the base queries, which are concatenated by the operators(AND,OR).
 *  Basically all this class has to do is pass it's query to Facebook's Graph-Search and returns the resulting array.
 *  If this turns out to be not possible then this sentence has to be analyzed further (either by keyword search of by
 *  a full snytactical analysis)
 */
function Query(sentence) {
    this.query = sentence;
}

Query.prototype.evaluate = function () {
    //TODO send this sentence to the facebook graph search and return results
    throw "Evaluation of Query is not implemented!"
};

Query.prototype.toString = function () {
    return "Query(" + this.query + ")";
};


/** Class representing OR nodes
 */
function Or(left, right) {
    this.left = left;
    this.right = right;
}

Or.prototype.evaluate = function () {
    //TODO evaluate left and right queries and combine result arrays into one array
    // Could be implemented in terms of set union
    throw "OR isn't implemented!"
};

Or.prototype.toString = function () {
    return "OR(" + this.left.toString() + "," + this.right.toString() + ")";
};

/** Class representing AND nodes
 */
function And(left, right) {
    this.left = left;
    this.right = right;
}

And.prototype.evaluate = function () {
    //TODO evaluate both left and right and then somehow only return the elements from left which are also in right
    // Could be implemented in terms of set intersection
    throw "AND isn't implemented!"
};

And.prototype.toString = function () {
    return "AND(" + this.left.toString() + "," + this.right.toString() + ")";
};



/** Class representing negation nodes
 */
function Not(expression) {
    this.expression = expression;
}

Not.prototype.evaluate = function () {
    var results = this.expression.evaluate();
    //TODO somehow negate/invert the results... this could pose a problem as this is defined now. The better solution would be probably to define NOT as setminus (i.e 'A AND NOT B' <=> Take all elements from A and remove all occurrences of B from A). But this again leaves the problem that queries like 'NOT People who are in Africa' would be impossible. (Well one could implicitly convert the previous query into: 'All people AND NOT People who are in Africa')
    //But then again defining NOT as setminus raises the problem with result ordering. We need read in the whole result array and then do the operation on the complete arrays to ensure that we don't miss any elements. Keeping in mind that queries like 'All people living in Africa' can yield millions of people as result, we don't have the capacity to make such a computation(Not to mention that requesting such an array from Facebook would take like forever). :/
    //If the resulsts are ensured to be in alphabetical order or ordered by ids then we can efficiently compute such a set without pulling megabytes of data from Facebook.
    throw "NOT isn't implemented!"
};

Not.prototype.toString = function () {
    return "NOT(" + this.expression.toString() + ")";
};


/** Just for completeness a class representing an empty request
 */
function Empty() {
}

Empty.prototype.evaluate = function () {
    return [];
};

Empty.prototype.toString = function () {
    return "Empty()";
};