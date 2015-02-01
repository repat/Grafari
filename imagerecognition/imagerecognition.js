/**
 * Converts an image url to tags.
 *
 * @param imageUrl URL to the image to recognize
 * @returns { tag1: confidence1, tag2: confidence2, ... }
 **/
var imageToTags = function (imageUrl) {
    var api = "http://api.imagga.com/draft/tags";
    //var api = "http://private-anon-f6a08a52d-imagga.apiary-mock.com/draft/tags"; // mock-api
    var api_key = "Your_API_Key";
    var ret = null;

    $.ajax({
        type: 'GET',
        url: api,
        dataType: 'json',
        success: function (data) {
            ret = data;
        },
        data: {
            api_key: api_key,
            url: imageUrl
        },
        async: false
    });

    return ret;
}

/**
 * Converts the tags object to a list of tags.
 *
 * @param data The tags object
 * @param confidence The level of confidence to use for filtering the results
 * @returns [ "tag1", "tag2", ... ]
 **/
tagsToList = function (data, confidence) {
    var tags = data.tags.filter(function (tag) {
        return tag.confidence >= confidence;
    });

    return tags.map(function (elem) {
        return elem.tag;
    });
};
