import{r as n,e as j,j as e,N as S,H as P,F as w}from"./index-DtJkVUgN.js";import{C as F,n as v}from"./CatalogService-D_Wtv2lj.js";import{D as A}from"./filesize.esm-CM59BMzv.js";import{P as C,a as E}from"./ProductCard-BmJRCsxL.js";import{c as b}from"./ProductFilter-BwDY8ny3.js";import{L as M}from"./Loading-BYjkhBjV.js";const o=20;function U(){let d=n.useMemo(()=>new F,[]),m=n.useMemo(()=>v(),[]),[c,u]=n.useState(""),[i,g]=n.useState(0),{vendorId:l}=j(),[t,p]=n.useState(void 0),[r,f]=n.useState([]),[h,x]=n.useState(!0);return n.useEffect(()=>{if(l!==void 0&&l!==""){let s=d.getVendorById(l);p(s),f(d.getProducts({...b(),vendors:[l]})),x(!1)}},[l,d]),h?e.jsx(M,{}):!h&&t===void 0?e.jsx(S,{}):e.jsxs(e.Fragment,{children:[e.jsx(P,{title:`${t.name} - vendor`}),e.jsx(w,{title:`Vendor details for ${t.name}`}),e.jsxs("p",{children:["Website: ",e.jsx("a",{href:t.url,children:t.url})]}),t.aaf?e.jsxs("p",{children:[t.name," is partnered with the"," ",e.jsx("a",{href:"https://www.ableartist.org/",children:"Able Artist Foundation"})]}):e.jsxs("p",{children:[t.name," is not partnered with the"," ",e.jsx("a",{href:"https://www.ableartist.org/",children:"Able Artist Foundation"})]}),r.length>0?e.jsxs("h3",{children:["Showing ",(i+1).toString()," to"," ",Math.min(i+o,r.length).toString()," ","out of ",r.length.toString()," products"]}):e.jsx("h3",{children:"No products in this catalog!"}),e.jsx(A,{url:c,onClose:()=>u("")}),[...r].sort((s,a)=>m(s.name,a.name)).filter((s,a)=>a>=i&&a<Math.min(i+o,r.length+1)).map(s=>e.jsx(C,{id:s.id,catalog:d,playDemo:a=>{u(a)}})),r.length>o?e.jsx(E,{pages:Math.floor(r.length/o)+(r.length%o>0?1:0),currentPage:i/o+1,setPage:s=>g(s*o)}):""]})}export{U as Component};
