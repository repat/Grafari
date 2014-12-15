/** This module converts a flattened parse tree back to a
 *  human readable form.
 */

var C = require("./parser-classes")

C.BasicRequest.prototype.print = function () {
    var sel = this.selector.print();
    if (this.conditions.length == 0)
        return sel

    var subsentences = this.conditions.map(function (cond) {
        return cond.print()
    })
    return sel + " who " + subsentences.join(" AND ")
}

C.Selector.prototype.print = function () {
    return "All " + this.selector
}

C.CondYounger.prototype.print = function () {
    return "are under " + this.age + " years old"
}

C.CondOlder.prototype.print = function () {
    return "are over " + this.age + " years old"
}

C.CondAgeBetween.prototype.print = function () {
    return "are between " + this.x + " and " + this.y + " years old"
}

C.CondAgeEqual.prototype.print = function () {
    return "are " + this.age + " years old"
}

C.CondLiveIn.prototype.print = function () {
    if (this.time == "past")
        return "lived in " + this.location
    return "live in " + this.location
}

C.CondLike.prototype.print = function () {
    return "like " + this.what
}

C.CondName.prototype.print = function () {
    return "are named " + this.name
}

C.CondWorkAt.prototype.print = function () {
    if (this.time == "past")
        return "worked at " + this.employer
    return "work at " + this.employer
}

C.CondBorn.prototype.print = function () {
    return "were born in " + this.year
}

C.CondFrom.prototype.print = function () {
    return "are from " + this.location
}

C.CondStudy.prototype.print = function () {
    return "study at " + this.uni
}

C.CondRelationship.prototype.print = function () {
    switch (this.type) {
        case "married":
            return "are married"
        case "engaged":
            return "are engaged"
        case "single":
            return "are single"
        case "widowed":
            return "are widowed"
        case "in-open-relationship":
            return "are in an open relationship"
        case "its-complicated":
            return "whose relationship is complicated"
        case "seperated":
            return "are seperated"
        case "divorced":
            return "are divorced"
        case "in-civil-union":
            return "are in a civil union"
        case "dating":
            return "are dating"
        case "in-any-relationship":
            return "are in a relationship"
    }
}