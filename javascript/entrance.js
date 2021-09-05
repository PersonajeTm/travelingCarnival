// game in games folder
$("document").ready(function() {
  // VARIABLES
  let sWidth = $(window).width();
  let sHeight = $(window).height();
  $("#root").css("width", sWidth);
  $("#root").css("height", sHeight);
  // IF STATEMENTS
  if (sHeight >= sWidth){
    showMobileDiv();
  }else {
    hideMobileDiv();
  }
  // FUNCTIONS
  function hideMobileDiv() {
    $("#style").attr("href", "css/entrance.css");
  }
  function showMobileDiv() {
    $("#style").attr("href", "css/entranceMobile.css");
  }
  // START
  $(window).resize(function() {
    //resize just happened, pixels changed
    // UPDATE WINDOW SIZES
    sWidth = $(window).width();
    sHeight = $(window).height();
    // IF MOBILE
    if (sHeight >= sWidth){
      showMobileDiv();
    }
    // IF NOT MOBILE
    if (sHeight < sWidth) {
      hideMobileDiv();
    }
  });
});
