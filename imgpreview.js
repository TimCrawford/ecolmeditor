var prevdiv, previmg, zoomdiv, pageimg, imgcanvas, 
  imgcontext, prevcan, prevcanimg, prevcontext;


function showpreview(e){
  var prevx = $(prevcan).offset().left;
  var prevy = $(prevcan).offset().top;
  // var prevx = $(previmg).offset().left;
  // var prevy = $(previmg).offset().top;
  // var prevh = previmg.height;
  // var prevw = previmg.width;
  var prevh = prevcanimg.height;
  var prevw = prevcanimg.width;
  var imgh = pageimg.height;
  var imgw = pageimg.width;
  var pw = 600;
  var ph = 300;
  zoomdiv.style.width = pw;
  zoomdiv.style.height = ph;
  imgcanvas.style.width = pw;
  imgcanvas.style.height = ph;
  // The position of the pointer on the preview as a proportion of
  // width and height
  var posx = (e.pageX - prevx)/prevw;
  var posy = (e.pageY - prevy)/prevh;
  // The coordinates of that on the full image
  posx = posx * imgw;
  posy = posy * imgh;
  // Offsets to place these in the centre
  imgcontext.fillStyle = "#999";
  imgcontext.fillRect(0,0,pw, ph);
  imgcontext.drawImage(pageimg, pw/2-posx, ph/2-posy);
}

function previewinit(prevsrc, pagesrc, pagesystems){
  prevdiv = document.getElementById('preview');
//  previmg = document.getElementById('thumb');
  prevcan = document.getElementById('thumbcanvas');
  zoomdiv = document.getElementById('zoomed');
  imgcanvas = document.getElementById('zoomcan');
  imgcontext = imgcanvas.getContext("2d");
  prevcontext = prevcan.getContext("2d");
  $(zoomdiv).hide();
  pageimg = new Image();
  prevcanimg = new Image();
  prevcanimg.onload = function(){
    prevdiv.style.width=this.width;
    prevdiv.style.height=this.height;
    prevcan.width = this.width;
    prevcan.height = this.height;
//    prevcontext.scale(2.05,1.95);
    prevcontext.drawImage(prevcanimg, 0,0, this.width, this.height);
    if(TabCodeDocument){
      prevdiv.style.marginLeft = basicwidth() - parseInt(this.width);
    }
    systemPosInfo(pagesystems);
    var fun1 = function(){$(zoomdiv).show();};
    var fun2 = function(){$(zoomdiv).hide();};
    prevdiv.onmouseover = fun1;
    prevdiv.addEventListener("touchstart", fun1); 
    prevdiv.addEventListener("touchmove", showpreview);
    $(prevdiv).mousemove(showpreview);
    prevdiv.onmouseout = function(){$(zoomdiv).hide();};
    prevdiv.onmouseup = function(){$(zoomdiv).hide();};
    prevdiv.addEventListener("touchend", fun2);
  };
  pageimg.src = pagesrc;
  prevcanimg.src = prevsrc;
}

function systemPosInfo(path){
  $.ajax({
      type: 'POST',
      async: true,
      url: path,
      failure: function(){
        return false;
      },
      success: function(data){
        var lines = data.split("\n");
        var sysbox = $.trim(lines[curSysNo()]).split(",");
        var x = parseInt(sysbox[0]);
        var y = parseInt(sysbox[1]);
        var h = parseInt(sysbox[2]);
        var w = parseInt(sysbox[3]);
        var s = prevcanimg.width / pageimg.width;
        prevcontext.strokeStyle = "rgba( 80, 80, 208, 0.5)";
        prevcontext.lineWidth = 4;
        prevcontext.strokeRect(x*s, y*s, w*s, h * s);
      }
  });
}