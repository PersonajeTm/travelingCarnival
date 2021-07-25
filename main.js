// game in games folder
$("document").ready(function() {
  // VARIABLES
  let sWidth = $(window).width();
  let sHeight = $(window).height();
  // IF STATEMENTS
  if (sHeight >= sWidth){
    showMobileDiv();
  }else {
    hideMobileDiv();
  }
  // FUNCTIONS
  function hideMobileDiv() {
    $("#mobileDiv").hide();
  }
  function showMobileDiv() {
    $("#mobileDiv").show();
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
