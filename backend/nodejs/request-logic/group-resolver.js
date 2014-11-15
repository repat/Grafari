var C = require("./parser-classes")


exports.resolve       = resolveGroups
exports.resolveGroups = resolveGroups

/** This function will stepwise reduce the request's grouping depth. This is necessary before a tree can be converted into
 *  a list of facebook requests
 *
 * @param parseTree the tree to flatten
 *
 * @return a new flat tree
 */
function resolveGroups(parseTree) {
  var extractor = new Extractor() 
  var requestStack = [] 
  var flatRequests = [] //All completed transformations land here

  parseTree.requests.forEach(function(e) { requestStack.push(e) })

  while(requestStack.length > 0) { // resolve groups
    extractor.reset()
    var request = requestStack.pop()

    var copy = extractor.extract(request)
    if (extractor.isComplete()) {
      flatRequests.push(copy)
    } else {
      requestStack.push(copy)
      while(extractor.needsReRun()) 
        requestStack.push(extractor.extract(request))
    }
  }

  //Everything is resolved, rebuild CombinedRequest
  var first = flatRequests.shift()
  var resultTree = new C.CombinedRequest(first)
  flatRequests.forEach(function(req) { resultTree.push(req) })
  return resultTree
}



/** This class is used to remove the inner groups. It keeps track of whether a group has 
 *  been entered and which element must be extracted. 
 */
function Extractor() {
  this.groupEntered = false
  this.groupMax = undefined
  this.groupIndex = 0
  this.base = undefined
}

Extractor.prototype.setBase = function(base) {
  this.groupEntered = false
  this.base = base
}

Extractor.prototype.pushBase = function(condition) {
  this.base.push(condition)
}

Extractor.prototype.enterGroup = function() {
  if (!this.groupEntered)
    return this.groupEntered = true
  return false
}

Extractor.prototype.reRun = function(runs) {
  if (!this.groupMax)
    this.groupMax = runs-1
  else
    ++this.groupIndex

  return this.groupIndex
}

Extractor.prototype.extract = function(obj) { 
  if (obj.extract)
    return obj.extract(this)
  else
    return obj
}

Extractor.prototype.isComplete = function() {
  return !this.groupEntered
}

Extractor.prototype.needsReRun = function() {
  return this.groupEntered && this.groupIndex < this.groupMax 
}

Extractor.prototype.reset = function() {
  this.groupEntered = false
  this.groupMax = undefined
  this.groupIndex = 0
  this.base = undefined
}

// Resolving schema:
//
//   A AND (B OR C AND (D OR E)) AND X
// -->
//   A AND B AND X
//   OR
//   A AND C AND (D OR E) AND X
// -->
//   A AND B AND X
//   OR
//   A AND C AND D AND X
//   OR 
//   A AND C AND E AND X


/** Extractor methods for the classes, requiring them. Since extractor.extract() checks whether an element
 *  defines the extract method, and if not simply returns the elment, only the classes need extract, which are
 *  doing something in it. (i.e the groupNodes)
 */
C.BasicRequest.prototype.extract = function(extractor) {
  var selector = extractor.extract(this.selector)
  var copy = new C.BasicRequest(selector)
  extractor.setBase(copy) //set currently valid BasicRequest
  this.conditions.forEach(function(cond) { copy.push(extractor.extract(cond)) })
  return copy
}


C.CondGroup.prototype.extract = function(extractor) {
  if (extractor.enterGroup())
    return extractor.extract(this.disjunction)
  return this
}

C.Disjunction.prototype.extract = function(extractor) {
  if (this.conjunctions.length == 1)
    return extractor.extract(this.conjunctions[0])


  var c = extractor.reRun(this.conjunctions.length)
  return extractor.extract(this.conjunctions[c])
}

C.Conjunction.prototype.extract = function(extractor) {
  if (this.conditions.length == 1)
    return extractor.extract(this.conditions[0])

  for(var c = 0; c < this.conditions.length-1; ++c)
    extractor.pushBase(extractor.extract(this.conditions[c]))

  return extractor.extract(this.conditions[this.conditions.length-1])
}