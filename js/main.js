;(function(global, doc, $){
  // main func
  $(doc).ready(function() {
    resizeApp();
  });

  // 调整APP尺寸自适应
  function resizeApp() {
    const appWidth = $('#app').width();
    const appHeight = $('#app').height();
    const screenWidth = global.innerWidth;
    const screenHeight = global.innerHeight;
    const ratio = Math.min(screenWidth / appWidth, screenHeight / appHeight);
    $('#app').css({
      transform: `scale(${ratio}) translateX(-50%)`
    });
  }
})(window, document, jQuery);