define(function () {
    return {
        toggle: function () {
            $(".history").children().each(function (index, child) {
                if (index > 0) {
                    child.addClass("btn btn-primary")
                }
            });
        }
    };
});