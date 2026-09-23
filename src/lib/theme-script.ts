/**
 * Se inyecta en <head> y corre antes del primer pintado, así que el tema
 * elegido se aplica sin parpadeo. Deja `window.__tema` para que el selector de
 * Perfil lo cambie sin recargar, y sigue al sistema cuando la preferencia es
 * "sistema" (incluso si el sistema cambia con la app abierta).
 */
export const TEMA_STORAGE_KEY = "workout:tema";

export const themeScript = `(function(){
  var K="${TEMA_STORAGE_KEY}";
  var mq=window.matchMedia("(prefers-color-scheme: dark)");
  function leer(){try{return localStorage.getItem(K)||"sistema"}catch(e){return "sistema"}}
  function aplicar(){
    var pref=leer();
    var oscuro=pref==="oscuro"||(pref==="sistema"&&mq.matches);
    var r=document.documentElement;
    r.setAttribute("data-theme",oscuro?"dark":"light");
    var m=document.querySelector('meta[name="theme-color"]');
    if(!m){m=document.createElement("meta");m.setAttribute("name","theme-color");document.head.appendChild(m)}
    m.setAttribute("content",oscuro?"#000000":"#f2f2f7");
  }
  window.__tema={leer:leer,aplicar:aplicar,set:function(p){try{localStorage.setItem(K,p)}catch(e){}aplicar()}};
  try{mq.addEventListener("change",aplicar)}catch(e){}
  aplicar();
})();`;
