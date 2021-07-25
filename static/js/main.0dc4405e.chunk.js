(this.webpackJsonpmusicalsight=this.webpackJsonpmusicalsight||[]).push([[0],{83:function(e,t,n){},84:function(e,t,n){"use strict";n.r(t);n(61);var c=n(7),a=n.n(c),i=n(35),r=n.n(i),s=n(29),o=n(0),j=n(1),h=n(3),l=n(2),b=n(59),d=n(28),u=n(51),O=n(17),p=n(27),x=n(25),m=n(9),f=function(e){Object(h.a)(n,e);var t=Object(l.a)(n);function n(){return Object(o.a)(this,n),t.apply(this,arguments)}return Object(j.a)(n,[{key:"render",value:function(){return Object(m.jsxs)(m.Fragment,{children:[Object(m.jsx)(x.a,{children:Object(m.jsx)("title",{children:"Home - Musical Sight"})}),Object(m.jsx)(p.a,{className:"text-center",children:Object(m.jsxs)(p.a.Body,{children:[Object(m.jsx)(p.a.Title,{children:"Welcome!"}),Object(m.jsx)(p.a.Text,{children:"Musical Sight aims to provide useful information about music theory, notes, scales and alot more. Most of the stuff shown here is common knowledge to sighted people who are able to communicate knowledge via slides, video material and more, while blind people often have to stick with learning through their ears only. To help them understand things a bit better, Musical Sight will try to organize information in a way that is more useful for blind people, including note and scale sound previews. Keep in mind however that this is still a fan website. Neither do I guarantee the correctness of all the information that is shown here, nor can I be made responsible for any potential damage that is caused to you by using this website."})]})})]})}}]),n}(c.Component),g=function(e){Object(h.a)(n,e);var t=Object(l.a)(n);function n(){return Object(o.a)(this,n),t.apply(this,arguments)}return Object(j.a)(n,[{key:"render",value:function(){return Object(m.jsxs)(m.Fragment,{children:[Object(m.jsx)(x.a,{children:Object(m.jsx)("title",{children:"Imprint - Musical Sight"})}),Object(m.jsx)(p.a,{className:"text-center",children:Object(m.jsxs)(p.a.Body,{children:[Object(m.jsx)(p.a.Title,{children:"Imprint and related information"}),Object(m.jsx)(p.a.Text,{children:"Find all the relevant information here!"})]})})]})}}]),n}(c.Component),k=n(6),v=n.n(k),y=n(11),C=n(38),I=function(e){Object(h.a)(n,e);var t=Object(l.a)(n);function n(e){var c;return Object(o.a)(this,n),(c=t.call(this,e)).note=void 0,c.note=c.props.match.params.note.charAt(0),c.props.match.params.note.match(/[a-g]-sharp/i)?c.note+="#":c.props.match.params.note.match(/[a-g]-flat/i)&&(c.note+="b"),c}return Object(j.a)(n,[{key:"toString",value:function(){return this.note[0].toUpperCase()+this.note.substr(1)}},{key:"render",value:function(){var e=this;return Object(m.jsxs)(m.Fragment,{children:[Object(m.jsx)(x.a,{children:Object(m.jsxs)("title",{children:[this.toString()," - Musical Sight"]})}),Object(m.jsx)("h3",{children:this.toString()}),Object(m.jsx)("button",{onClick:Object(y.a)(v.a.mark((function t(){return v.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.playNote(e.note+"4");case 2:case"end":return t.stop()}}),t)}))),children:"Listen now"})]})}}]),n}(function(e){Object(h.a)(n,e);var t=Object(l.a)(n);function n(e){var c;return Object(o.a)(this,n),(c=t.call(this,e)).synth=void 0,c.synth=new C.a(C.b),c.synth.toDestination(),c}return Object(j.a)(n,[{key:"playNote",value:function(){var e=Object(y.a)(v.a.mark((function e(t){return v.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,C.c();case 2:this.synth.triggerAttackRelease(t,"8n");case 3:case"end":return e.stop()}}),e,this)})));return function(t){return e.apply(this,arguments)}}()},{key:"playChord",value:function(){var e=Object(y.a)(v.a.mark((function e(t){return v.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,C.c();case 2:this.synth.triggerAttackRelease(t,"8n");case 3:case"end":return e.stop()}}),e,this)})));return function(t){return e.apply(this,arguments)}}()}]),n}(c.Component)),L=Object(O.o)(I),w=n(19),S=n(20),F=function(e){Object(h.a)(n,e);var t=Object(l.a)(n);function n(){return Object(o.a)(this,n),t.apply(this,arguments)}return Object(j.a)(n,[{key:"render",value:function(){return Object(m.jsxs)(m.Fragment,{children:[Object(m.jsx)(x.a,{children:Object(m.jsx)("title",{children:"Notes - Musical Sight"})}),Object(m.jsxs)(w.a,{children:[Object(m.jsx)(S.LinkContainer,{to:"/notes/c",children:Object(m.jsx)(w.a.Item,{action:!0,children:"C"})}),Object(m.jsx)(S.LinkContainer,{to:"/notes/c-sharp",children:Object(m.jsx)(w.a.Item,{action:!0,children:"C sharp"})}),Object(m.jsx)(S.LinkContainer,{to:"/notes/d",children:Object(m.jsx)(w.a.Item,{action:!0,children:"D"})}),Object(m.jsx)(S.LinkContainer,{to:"/notes/d-sharp",children:Object(m.jsx)(w.a.Item,{action:!0,children:"D sharp"})}),Object(m.jsx)(S.LinkContainer,{to:"/notes/e",children:Object(m.jsx)(w.a.Item,{action:!0,children:"E"})}),Object(m.jsx)(S.LinkContainer,{to:"/notes/f",children:Object(m.jsx)(w.a.Item,{action:!0,children:"F"})}),Object(m.jsx)(S.LinkContainer,{to:"/notes/f-sharp",children:Object(m.jsx)(w.a.Item,{action:!0,children:"F sharp"})}),Object(m.jsx)(S.LinkContainer,{to:"/notes/g",children:Object(m.jsx)(w.a.Item,{action:!0,children:"G"})}),Object(m.jsx)(S.LinkContainer,{to:"/notes/g-sharp",children:Object(m.jsx)(w.a.Item,{action:!0,children:"G sharp"})}),Object(m.jsx)(S.LinkContainer,{to:"/notes/a",children:Object(m.jsx)(w.a.Item,{action:!0,children:"A"})}),Object(m.jsx)(S.LinkContainer,{to:"/notes/a-sharp",children:Object(m.jsx)(w.a.Item,{action:!0,children:"A sharp"})}),Object(m.jsx)(S.LinkContainer,{to:"/notes/b",children:Object(m.jsx)(w.a.Item,{action:!0,children:"B"})})]})]})}}]),n}(c.Component),N=n(60),M=function(e){Object(h.a)(n,e);var t=Object(l.a)(n);function n(){return Object(o.a)(this,n),t.apply(this,arguments)}return Object(j.a)(n,[{key:"render",value:function(){return Object(m.jsxs)(m.Fragment,{children:[Object(m.jsx)(x.a,{children:Object(m.jsx)("title",{children:"Scales - Musical Sight"})}),Object(m.jsx)(w.a,{children:N.a.names().sort().map((function(e){return Object(m.jsx)(S.LinkContainer,{to:"/scale/"+escape(e),children:Object(m.jsx)(w.a.Item,{action:!0,children:e})})}))})]})}}]),n}(c.Component),T=function(e){Object(h.a)(n,e);var t=Object(l.a)(n);function n(){return Object(o.a)(this,n),t.apply(this,arguments)}return Object(j.a)(n,[{key:"render",value:function(){return Object(m.jsxs)("div",{children:[Object(m.jsx)(b.a,{children:Object(m.jsx)(u.a,{className:"fixed-top",bg:"light",variant:"light",children:Object(m.jsx)(u.a.Collapse,{children:Object(m.jsxs)(d.a,{className:"mr-auto",children:[Object(m.jsx)(d.a.Item,{children:Object(m.jsx)(d.a.Link,{as:s.Link,to:"/",active:!0,children:"Home"})}),Object(m.jsx)(d.a.Item,{children:Object(m.jsx)(d.a.Link,{as:s.Link,to:"/notes",children:"Notes"})}),Object(m.jsx)(d.a.Item,{children:Object(m.jsx)(d.a.Link,{as:s.Link,to:"/scales",children:"Scales"})}),Object(m.jsx)(d.a.Item,{children:Object(m.jsx)(d.a.Link,{as:s.Link,to:"/imprint",children:"Imprint"})})]})})})}),Object(m.jsx)("div",{children:Object(m.jsxs)(O.g,{children:[Object(m.jsx)(O.d,{exact:!0,path:"/",component:f}),Object(m.jsx)(O.d,{exact:!0,path:"/imprint",component:g}),Object(m.jsx)(O.d,{exact:!0,path:"/notes",component:F}),Object(m.jsx)(O.d,{path:"/notes/:note([a-g])",component:L}),Object(m.jsx)(O.d,{path:"/notes/:note([a-g]-sharp)",component:L}),Object(m.jsx)(O.d,{path:"/notes/:note([a-g]-flat)",component:L}),Object(m.jsx)(O.d,{exact:!0,path:"/scales",component:M}),Object(m.jsx)(O.d,{render:function(){return Object(m.jsx)("p",{children:"Not found"})}})]})})]})}}]),n}(c.Component);var A=function(){return Object(m.jsx)(T,{})},B=(n(83),function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,86)).then((function(t){var n=t.getCLS,c=t.getFID,a=t.getFCP,i=t.getLCP,r=t.getTTFB;n(e),c(e),a(e),i(e),r(e)}))});r.a.render(Object(m.jsx)(a.a.StrictMode,{children:Object(m.jsx)(s.HashRouter,{children:Object(m.jsx)(A,{})})}),document.getElementById("root")),B()}},[[84,1,2]]]);
//# sourceMappingURL=main.0dc4405e.chunk.js.map