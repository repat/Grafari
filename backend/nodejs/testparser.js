var Requests = require("./lib/request-logic")



/** Hier ein paar Beipielanfragen, die der Parser in Facebook-URLs übersetzen kann.
 * 
 *  Dazu ein paar Hinweise:
 *   - Der Tokenizer trennt nach Leerzeichen und Klammern. Kommata werden einfach geschluckt.
 *   - Alle Tokens, die keine besondere Bedeutung haben, werden in Kleinbuchstaben umgewandelt.
 *   - Mit "-Zeichen können mehrere Wörter zu einem Token zusammengefasst werden (Der Tokenizer fasst den Text darin auch nicht an)
 *     Die Zeichen werden also nicht zu Kleinbuchstaben umgewandelt und es werden auch keine Kommata entfernt.
 *   - Wörter zu einem Token zusammenzufassen ist notwendig, wenn man 'who like X', 'who live in X' oder 'who are named X' als Anfrage 
 *     verwendet und X Leerzeichen enthalten soll, oder auf Groß- & Kleinschreibung geachtet werden muss.
 *   - Alle Anfragen starten mit einem Selektor: '[All] people', '[All] women' oder '[All] men' anschließend können Bedingungen 
 *     mit who oder mit AND and die Anfrage geknüpft werden.
 *   - Da Facebook kein 'OR' unterstützt, müssen für jedes 'OR' mehrere Einzelanfragen gesendet werden.
 *   - 'AND', bzw 'who' bindet immer stärker als 'OR'. Ohne Klammern muss auf ein OR deshalb auch immer erstmal ein Selektor folgen.
 *     (Bsp. 'All people who live in Germany AND like 4Chan OR All women who are younger than 20' )
 *   - Mit Klammern machen nur im Zusammenhang von 'OR' Sinn und sparen etwas Tipparbeit.
 *     (Bsp: 'All People who (live in America OR like America)' Das wird dann intern übersetzt zu:
 *           'All People who live in Amreica OR All People who like America'
 */


/** Hier mal ein paar Beispielanfragen
 */
var input = 'All people who are living in Germany';
//var input = 'All people who lived in Germany AND who worked at "IBM" AND were born in 1990'
//var input = 'All men who study at "HAW Hamburg"'
//var input = 'All women who (are in an open relationship OR are single)'
//var input = 'All women who are under 20 years old'
//var input = 'All women who are younger than 20 OR all men who are older than 20';
//var input = 'All women who (live in Germany OR live in America)';
//var input = 'Women who are between 20 and 30 years old AND like 4Chan';
//var input = 'women who like "Justin Bieber" AND are under 20 years old AND live in "Hamburg, Germany"';
//var input = 'All people who live in Germany AND (are under 23 years old OR are older than 17) AND (like "Who Am I" OR are named "Bob")';
//var input = 'People who (like A OR like B OR (like C AND (like D OR like E)))'; //Um nachzuvollziehen, wie Gruppen aufgelöst werden

console.log("Input:\n" + input + "\n");

/** parse(sentence) takes a whole sentence and converts the sentence into a parseTree
 *  Internally this function works like: tokenize(sentence) -> rawParse(tokenlist) -> resolveGroups(parseTree)
 */
var parseTree = Requests.parse(input);
console.log("Flattened Parse-Tree:\n" + parseTree.toString() + "\n");


/** translateTree(parseTree, callback)
 * 
 * This function uses a callback, because it uses a resolver which has to communicate with Facebook to
 * resolve names to ID, so to prevent blocking this function needs a callback. 
 * (At the moment it only has a dummy resolver)
 * 
 * @param parseTree the parsed tree 
 * @param callback a callback to be executed, after the requestList has been translated
 */
Requests.translateTree(parseTree, function(err, requestList) {
  console.log("Resolved into following requests:")
  requestList.forEach(function (request) { console.log(request) })  
});