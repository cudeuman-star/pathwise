export default { content:["./index.html","./src/**/*.{js,jsx}"], theme:{ extend:{
 colors:{ ink:"#0a0f1f", brand:{50:"#eef3ff",100:"#dce6ff",200:"#b9ccff",400:"#6f8fff",500:"#4b6bfb",600:"#3654e8",700:"#2a41c4",900:"#121a4d"} },
 fontFamily:{ sans:["Inter","ui-sans-serif","system-ui","sans-serif"] },
 keyframes:{ up:{"0%":{opacity:0,transform:"translateY(8px)"},"100%":{opacity:1,transform:"none"}} },
 animation:{ up:"up .5s cubic-bezier(.2,.7,.2,1) both" } } }, plugins:[] };
