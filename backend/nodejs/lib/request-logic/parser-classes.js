//Exported classes
exports.CombinedRequest = CombinedRequest
exports.BasicRequest    = BasicRequest
exports.Selector        = Selector
exports.CondYounger     = CondYounger
exports.CondOlder       = CondOlder
exports.CondAgeBetween  = CondAgeBetween
exports.CondAgeEqual    = CondAgeEqual
exports.CondLiveIn      = CondLiveIn
exports.CondFrom        = CondFrom
exports.CondLike        = CondLike
exports.CondName        = CondName
exports.CondWorkAt      = CondWorkAt
exports.CondBorn        = CondBorn
exports.CondStudy       = CondStudy
exports.CondRelationship= CondRelationship
exports.CondLang        = CondLang
exports.CondGroup       = CondGroup
exports.Disjunction     = Disjunction
exports.Conjunction     = Conjunction


// CombinedRequest, essentially an array of at least one BasicRequest
function CombinedRequest(basicRequest) {
  this.requests = [ basicRequest ]
}

CombinedRequest.prototype.push = function(basicRequest) {
  this.requests.push(basicRequest)
}

CombinedRequest.prototype.toString = function() {
  return "CombinedRequest(" + this.requests.map(function (x) { return x.toString() }).join() + ")"
}

// BasicRequest consisting of a selector any amount of conditions
function BasicRequest(selector) {
  this.selector = selector
  this.conditions = []
}

BasicRequest.prototype.push = function(condition) {
  this.conditions.push(condition)
}

BasicRequest.prototype.toString = function() {
  var str = "BasicRequest(" + this.selector
  this.conditions.forEach(function (con) { str += "," + con; })
  return str + ")"
}

// Selector. Will contain either 'people', 'men' or 'women'
function Selector(selector) {
  this.selector = selector
}

Selector.prototype.toString = function() {
  return "Selector(" + this.selector + ")"
}

function CondYounger(age) {
  this.age = age
}

CondYounger.prototype.toString = function() {
  return "CondYounger(" + this.age + ")"
}

function CondOlder(age) {
  this.age = age
}

CondOlder.prototype.toString = function() {
  return "CondOlder(" + this.age + ")"
}

function CondAgeBetween(age1, age2) {
  this.x = age1
  this.y = age2
}

CondAgeBetween.prototype.toString = function() {
  return "CondAgeBetween(" + this.x + "," + this.y + ")"
}

function CondAgeEqual(age) {
  this.age = age
}

CondAgeEqual.prototype.toString = function() {
  return "CondAgeEqual(" + this.age + ")"
}

function CondLiveIn(location, time) {
  this.time = time //"present" or "past"
  this.location = location //Has to be resolved before sending request to facebook
}

CondLiveIn.prototype.toString = function() {
  return "CondLiveIn(" + this.location + "," + this.time + ")"
}

function CondFrom(location) {
  this.location = location
}

CondFrom.prototype.toString = function() {
  return "CondFrom(" + this.location + ")"
}

function CondLike(what) {
  this.what = what //Has to be resolved before sending request to facebook
}

CondLike.prototype.toString = function() {
  return "CondLike(" + this.what + ")"
}

function CondName(name) {
  this.name = name
}

CondName.prototype.toString = function() {
  return "CondName(" + this.name + ")"
}

function CondWorkAt(employer, time) {
  this.time = time
  this.employer = employer
}

CondWorkAt.prototype.toString = function() {
  return "CondWorkAt(" + this.employer + "," + this.time + ")"
}

function CondBorn(year) {
  this.year = year
}

CondBorn.prototype.toString = function() {
  return "CondBorn(" + this.year + ")"
}

function CondStudy(uni) {
  this.uni = uni
}

CondStudy.prototype.toString = function() {
  return "CondStudy(" + this.uni + ")"
}

function CondRelationship(type) {
  this.type = type
}

CondRelationship.prototype.toString = function() {
  return "CondRelationship(" + this.type + ")"
}

function CondLang(lang) {
  this.lang = lang
}

CondLang.prototype.toString = function() {
  return "CondLang(" + this.lang + ")"
}

// Represents conditions grouped by ()
function CondGroup(disjunction) {
  this.disjunction = disjunction
}

CondGroup.prototype.toString = function() {
  return "CondGroup(" + this.disjunction + ")"
}

function Disjunction(conjunction) {
  this.conjunctions = [ conjunction ]
}

Disjunction.prototype.push = function(conjunction) {
  this.conjunctions.push(conjunction)
}

Disjunction.prototype.toString = function() {
  return "Disjunction(" + this.conjunctions.map(function (x) { return x.toString() }).join() + ")"
}

function Conjunction(condition) {
  this.conditions = [ condition ]
}

Conjunction.prototype.push = function(condition) {
  this.conditions.push(condition)
}

Conjunction.prototype.toString = function() {
  return "Conjunction(" + this.conditions.map(function(x) { return x.toString() }).join() + ")"
}

