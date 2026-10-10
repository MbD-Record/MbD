/**
 * Colour randomisation runs in <head>, before the body paints, and writes CSS
 * custom properties onto the root element. Doing it in JS rather than at build
 * time is what makes the palette change on every reload; doing it in <head>
 * rather than at the end of the body is what stops it flashing.
 *
 * Text is always black. Every colour in the palette is a light pastel, so black
 * text scores between 7.04:1 and 13.93:1 against them (WCAG AAA on most) while
 * white would score between 1.51:1 and 2.98:1, failing AA even for large text.
 */
export const paletteScript = `(function(){
  var palette=['#c084fc','#f472b6','#fb7185','#e879f9','#a78bfa','#818cf8','#60a5fa','#38bdf8','#22d3ee','#2dd4bf','#34d399','#4ade80','#a3e635','#facc15','#fb923c','#f87171'];
  var used={};
  function draw(){
    for(var i=0;i<palette.length;i++){
      var c=palette[Math.floor(Math.random()*palette.length)];
      if(!used[c]){used[c]=1;return c;}
    }
    return palette[Math.floor(Math.random()*palette.length)];
  }
  var root=document.documentElement;
  root.style.setProperty('--mbd-bg',draw());
  for(var n=1;n<=5;n++){root.style.setProperty('--mbd-'+n,draw());}
  root.style.setProperty('--mbd-blog',draw());
})();`;