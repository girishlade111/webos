import{n as e,s as t,t as n}from"./jsx-runtime-Bzw2jH9X.js";import{t as r}from"./sound-C0fIyiFM.js";import{t as i}from"./history-DhOSN5RP.js";import{pt as a}from"./index-eOAzbU6s.js";var o=a(`delete`,[[`path`,{d:`M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z`,key:`1yo7s0`}],[`path`,{d:`m12 9 6 6`,key:`anjzzh`}],[`path`,{d:`m18 9-6 6`,key:`1fp51s`}]]),s=t(e(),1),c=n(),l=()=>{let[e,t]=(0,s.useState)(`0`),[n,a]=(0,s.useState)(null),[l,u]=(0,s.useState)(null),[d,f]=(0,s.useState)(!1),[p,m]=(0,s.useState)(!1),[h,g]=(0,s.useState)([]),[_,v]=(0,s.useState)(!1),y=n=>{r.playClick(),d?(t(n),f(!1)):t(e===`0`?n:e+n)},b=()=>{if(r.playClick(),d){t(`0.`),f(!1);return}e.includes(`.`)||t(e+`.`)},x=()=>{r.playClick(),t(`0`),a(null),u(null),f(!1)},S=()=>{r.playClick(),t(String(-parseFloat(e)))},C=()=>{r.playClick(),t(String(parseFloat(e)/100))},w=i=>{r.playClick();let o=parseFloat(e);if(n===null)a(o);else if(l){let e=n||0,r=e;l===`+`?r=e+o:l===`-`?r=e-o:l===`×`?r=e*o:l===`÷`?r=o===0?0:e/o:l===`^`&&(r=e**+o);let i=`${e} ${l} ${o} = ${r}`;g(e=>[i,...e]),a(r),t(String(r))}f(!0),u(i===`=`?null:i)},T=n=>{r.playClick();let i=parseFloat(e),a=i;switch(n){case`sin`:a=Math.sin(i);break;case`cos`:a=Math.cos(i);break;case`tan`:a=Math.tan(i);break;case`sqrt`:a=Math.sqrt(i);break;case`ln`:a=Math.log(i);break;case`log`:a=Math.log10(i);break;case`sqr`:a=i*i;break;case`pi`:a=Math.PI;break;case`e`:a=Math.E}g(e=>[`${n}(${i}) = ${a}`,...e]),t(String(a)),f(!0)};return(0,s.useEffect)(()=>{let n=n=>{n.key>=`0`&&n.key<=`9`?y(n.key):n.key===`.`?b():n.key===`+`||n.key===`-`?w(n.key):n.key===`*`?w(`×`):n.key===`/`?w(`÷`):n.key===`Enter`||n.key===`=`?w(`=`):n.key===`Escape`||n.key===`c`?x():n.key===`Backspace`&&(!d&&e.length>1?t(e.slice(0,-1)):t(`0`))};return window.addEventListener(`keydown`,n),()=>window.removeEventListener(`keydown`,n)}),(0,c.jsxs)(`div`,{className:`flex h-full w-full flex-col bg-neutral-900 text-white select-none`,children:[(0,c.jsxs)(`div`,{className:`flex h-9 items-center justify-between px-3 border-b border-white/10 bg-neutral-800/80`,children:[(0,c.jsx)(`button`,{onClick:()=>m(!p),className:`text-xs text-neutral-400 hover:text-white transition-colors`,children:p?`Basic Mode`:`Scientific Mode`}),(0,c.jsx)(`button`,{onClick:()=>v(!_),className:`p-1 rounded text-neutral-400 hover:text-white transition-colors ${_?`text-amber-400`:``}`,title:`History Tape`,children:(0,c.jsx)(i,{size:14})})]}),(0,c.jsxs)(`div`,{className:`flex flex-1 overflow-hidden relative`,children:[(0,c.jsxs)(`div`,{className:`flex flex-1 flex-col p-4 justify-between`,children:[(0,c.jsxs)(`div`,{className:`text-right py-4 px-2`,children:[(0,c.jsx)(`div`,{className:`text-xs text-neutral-400 h-4`,children:n!==null&&l?`${n} ${l}`:``}),(0,c.jsx)(`div`,{className:`text-4xl font-light tracking-tight truncate tabular-nums text-white`,children:e})]}),(0,c.jsxs)(`div`,{className:`grid gap-2 ${p?`grid-cols-6`:`grid-cols-4`}`,children:[p&&(0,c.jsxs)(c.Fragment,{children:[(0,c.jsx)(`button`,{onClick:()=>T(`sin`),className:`btn-sci`,children:`sin`}),(0,c.jsx)(`button`,{onClick:()=>T(`cos`),className:`btn-sci`,children:`cos`}),(0,c.jsx)(`button`,{onClick:()=>T(`tan`),className:`btn-sci`,children:`tan`}),(0,c.jsx)(`button`,{onClick:()=>T(`sqrt`),className:`btn-sci`,children:`√`}),(0,c.jsx)(`button`,{onClick:()=>T(`sqr`),className:`btn-sci`,children:`x²`}),(0,c.jsx)(`button`,{onClick:()=>w(`^`),className:`btn-sci`,children:`xʸ`}),(0,c.jsx)(`button`,{onClick:()=>T(`pi`),className:`btn-sci`,children:`π`}),(0,c.jsx)(`button`,{onClick:()=>T(`e`),className:`btn-sci`,children:`e`}),(0,c.jsx)(`button`,{onClick:()=>T(`ln`),className:`btn-sci`,children:`ln`}),(0,c.jsx)(`button`,{onClick:()=>T(`log`),className:`btn-sci`,children:`log`})]}),(0,c.jsx)(`button`,{onClick:x,className:`btn-func`,children:`AC`}),(0,c.jsx)(`button`,{onClick:S,className:`btn-func`,children:`±`}),(0,c.jsx)(`button`,{onClick:C,className:`btn-func`,children:`%`}),(0,c.jsx)(`button`,{onClick:()=>w(`÷`),className:`btn-op`,children:`÷`}),(0,c.jsx)(`button`,{onClick:()=>y(`7`),className:`btn-num`,children:`7`}),(0,c.jsx)(`button`,{onClick:()=>y(`8`),className:`btn-num`,children:`8`}),(0,c.jsx)(`button`,{onClick:()=>y(`9`),className:`btn-num`,children:`9`}),(0,c.jsx)(`button`,{onClick:()=>w(`×`),className:`btn-op`,children:`×`}),(0,c.jsx)(`button`,{onClick:()=>y(`4`),className:`btn-num`,children:`4`}),(0,c.jsx)(`button`,{onClick:()=>y(`5`),className:`btn-num`,children:`5`}),(0,c.jsx)(`button`,{onClick:()=>y(`6`),className:`btn-num`,children:`6`}),(0,c.jsx)(`button`,{onClick:()=>w(`-`),className:`btn-op`,children:`−`}),(0,c.jsx)(`button`,{onClick:()=>y(`1`),className:`btn-num`,children:`1`}),(0,c.jsx)(`button`,{onClick:()=>y(`2`),className:`btn-num`,children:`2`}),(0,c.jsx)(`button`,{onClick:()=>y(`3`),className:`btn-num`,children:`3`}),(0,c.jsx)(`button`,{onClick:()=>w(`+`),className:`btn-op`,children:`+`}),(0,c.jsx)(`button`,{onClick:()=>y(`0`),className:`btn-num col-span-2 text-left pl-6`,children:`0`}),(0,c.jsx)(`button`,{onClick:b,className:`btn-num`,children:`.`}),(0,c.jsx)(`button`,{onClick:()=>w(`=`),className:`btn-op bg-orange-600 hover:bg-orange-500`,children:`=`})]})]}),_&&(0,c.jsxs)(`div`,{className:`w-56 border-l border-white/10 bg-neutral-950 p-3 flex flex-col justify-between animate-fade-in`,children:[(0,c.jsxs)(`div`,{className:`flex items-center justify-between pb-2 border-b border-white/10 text-xs font-semibold text-neutral-400`,children:[(0,c.jsx)(`span`,{children:`Calculation History`}),(0,c.jsx)(`button`,{onClick:()=>g([]),className:`hover:text-white`,title:`Clear history`,children:(0,c.jsx)(o,{size:12})})]}),(0,c.jsx)(`div`,{className:`flex-1 overflow-y-auto py-2 space-y-2 text-xs font-mono text-neutral-300`,children:h.length===0?(0,c.jsx)(`div`,{className:`text-neutral-500 text-center py-6`,children:`No calculations yet`}):h.map((e,t)=>(0,c.jsx)(`div`,{className:`border-b border-white/5 pb-1`,children:e},t))})]})]}),(0,c.jsx)(`style`,{children:`
        .btn-num {
          background-color: #3f3f46;
          color: white;
          font-size: 1.1rem;
          font-weight: 500;
          height: 48px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s;
        }
        .btn-num:hover {
          background-color: #52525b;
        }
        .btn-func {
          background-color: #71717a;
          color: #18181b;
          font-size: 1rem;
          font-weight: 600;
          height: 48px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s;
        }
        .btn-func:hover {
          background-color: #a1a1aa;
        }
        .btn-op {
          background-color: #f97316;
          color: white;
          font-size: 1.25rem;
          font-weight: 500;
          height: 48px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s;
        }
        .btn-op:hover {
          background-color: #ea580c;
        }
        .btn-sci {
          background-color: #27272a;
          color: #a1a1aa;
          font-size: 0.75rem;
          font-weight: 500;
          height: 38px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s, color 0.15s;
        }
        .btn-sci:hover {
          background-color: #3f3f46;
          color: white;
        }
      `})]})};export{l as CalculatorApp};