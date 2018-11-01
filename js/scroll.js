(function ($) {
    //跑马灯效果
    var interval = null;
    // var contentWidth = $(".tips_content").width();
    var contentWidth = 2000+"px";
    $(function(){
      $(".tips_content").css("margin-left",0-contentWidth);
      startScroll($(".tips_content").width());

      // $(".tips_content").mouseover(function(){
      //   console.log("mouseover;");
      //   clearInterval(interval);
      // });

      // $(".tips_content").mouseout(function(){
      //   console.log("mouseout;");
      //   startScroll();
      // });
    });

    function startScroll(){
      var offset = parseFloat($(".tips_content").css("margin-left"));
      interval = setInterval(function(){
        if (offset <= 1000) {
          offset = offset + 10;
          $(".tips_content").css("margin-left",-offset);
        }else{
          offset =0;
        }
      },200);
    }
})(Zepto);