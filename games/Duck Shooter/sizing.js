$("document").ready(function() {
    let width = screen.width;
    let height = screen.height;

    if (height >= width) {
        console.log("on mobile");
        runMobileCss();
    } else {
        $("#apology").hide();
    }

    function runMobileCss() {
        $("#container").remove();
        $("#sizing").remove();
    }




});
