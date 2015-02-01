/**
 * Translates an array of words.
 *
 * @param textArr The array to translate
 * @returns [ "Wort1", "Wort2", ...]
 **/
var translate = function (textArr) {
    var text = textArr.join('&text=');
    var yapi_key = "Your_api_key";
    var api = "https://translate.yandex.net/api/v1.5/tr.json/translate?key=" + yapi_key + "&lang=en-de&text=" + encodeURI(text);
    var ret = null;

    $.ajax({
        type: 'GET',
        url: api,
        dataType: 'json',
        success: function (data) {
            ret = data.text;
        },
        data: {},
        async: false
    });

    return ret;
}
