(this.webpackJsonpmusicalsight=this.webpackJsonpmusicalsight||[]).push([[0],{112:function(e,t,n){},113:function(e,t,n){"use strict";n.r(t);n(89);var a=n(6),c=n.n(a),i=n(43),s=n.n(i),r=n(27),o=n(0),l=n(1),h=n(3),j=n(2),d=n(34),u=n(87),b=n(33),p=n(79),O=n(23),m=n(62),x=n(21),f=n(40),g=n(29),v=n(42),y=n(10),k=function(e){Object(h.a)(n,e);var t=Object(j.a)(n);function n(){return Object(o.a)(this,n),t.apply(this,arguments)}return Object(l.a)(n,[{key:"render",value:function(){return Object(y.jsxs)(y.Fragment,{children:[Object(y.jsx)(g.a,{children:Object(y.jsx)("title",{children:"Chords - Musical Sight"})}),Object(y.jsx)(x.a,{className:"text-center",children:Object(y.jsxs)(x.a.Body,{children:[Object(y.jsx)(x.a.Title,{as:"h3",children:"Chords"}),Object(y.jsx)(x.a.Text,{}),Object(y.jsx)(x.a.Text,{children:"You will find the alphabetically sorted list of all common chords below. Follow the links to find more information about the chords, including audio examples."})]})}),Object(y.jsx)("h3",{children:"Chords List"}),Object(y.jsx)(f.a,{children:m.b.names().sort().map((function(e){return Object(y.jsx)(v.LinkContainer,{to:"/chords/"+escape(e),children:Object(y.jsx)(f.a.Item,{action:!0,children:e})})}))})]})}}]),n}(a.Component),w=function(e){Object(h.a)(n,e);var t=Object(j.a)(n);function n(){return Object(o.a)(this,n),t.apply(this,arguments)}return Object(l.a)(n,[{key:"render",value:function(){return Object(y.jsxs)(y.Fragment,{children:[Object(y.jsx)(g.a,{children:Object(y.jsx)("title",{children:"Home - Musical Sight"})}),Object(y.jsx)(x.a,{className:"text-center",children:Object(y.jsxs)(x.a.Body,{children:[Object(y.jsx)(x.a.Title,{as:"h3",children:"Welcome!"}),Object(y.jsx)(x.a.Text,{children:"Musical Sight aims to provide useful information about music theory, notes, scales and alot more. Most of the stuff shown here is common knowledge to sighted people who are able to communicate knowledge via slides, video material and more, while blind people often have to stick with learning through their ears only. To help them understand things a bit better, Musical Sight will try to organize information in a way that is more useful for blind people, including note and scale sound previews. Keep in mind however that this is still a fan website. Neither do I guarantee the correctness of all the information that is shown here, nor can I be made responsible for any potential damage that is caused to you by using this website."})]})})]})}}]),n}(a.Component),C=function(e){Object(h.a)(n,e);var t=Object(j.a)(n);function n(){return Object(o.a)(this,n),t.apply(this,arguments)}return Object(l.a)(n,[{key:"render",value:function(){return Object(y.jsxs)(y.Fragment,{children:[Object(y.jsx)(g.a,{children:Object(y.jsx)("title",{children:"Imprint - Musical Sight"})}),Object(y.jsx)(x.a,{className:"text-center",children:Object(y.jsxs)(x.a.Body,{children:[Object(y.jsx)(x.a.Title,{children:"Imprint and related information"}),Object(y.jsx)(x.a.Text,{children:"Find all the relevant information here!"})]})})]})}}]),n}(a.Component),N=n(7),S=n.n(N),L=n(13),T=n(88),I=n(18),F=function(e){Object(h.a)(n,e);var t=Object(j.a)(n);function n(e){var a;return Object(o.a)(this,n),(a=t.call(this,e)).initialized=void 0,a.piano=void 0,a.initialized=!1,a.piano=new T.a,a.piano.toDestination(),a}return Object(l.a)(n,[{key:"initialize",value:function(){var e=Object(L.a)(S.a.mark((function e(){return S.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(!this.initialized){e.next=2;break}return e.abrupt("return");case 2:return e.next=4,I.n();case 4:return e.next=6,this.piano.load();case 6:this.initialized=!0;case 7:case"end":return e.stop()}}),e,this)})));return function(){return e.apply(this,arguments)}}()},{key:"playNote",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"8n",n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:I.l();this.piano.keyDown({note:e,time:n}),this.piano.keyUp({note:e,time:n+I.e(t).toSeconds()})}}]),n}(a.Component),M=function(e){Object(h.a)(n,e);var t=Object(j.a)(n);function n(e){var a;return Object(o.a)(this,n),(a=t.call(this,e)).note=void 0,a.note=a.props.match.params.note.charAt(0),a.props.match.params.note.match(/[a-g]-sharp/i)?a.note+="#":a.props.match.params.note.match(/[a-g]-flat/i)&&(a.note+="b"),a}return Object(l.a)(n,[{key:"toString",value:function(){return this.note[0].toUpperCase()+this.note.substr(1)}},{key:"render",value:function(){var e=this;return Object(y.jsxs)(y.Fragment,{children:[Object(y.jsx)(g.a,{children:Object(y.jsxs)("title",{children:[this.toString()," - Musical Sight"]})}),Object(y.jsx)("h3",{children:this.toString()}),Object(y.jsx)("button",{onClick:Object(L.a)(S.a.mark((function t(){return S.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.initialize();case 2:e.playNote(e.note+"4");case 3:case"end":return t.stop()}}),t)}))),children:"Listen now"})]})}}]),n}(F),B=Object(O.o)(M),z=function(e){if(e=e.toLowerCase(),isNaN(+e.slice(-1))||(e=e.slice(0,-1)),e.length>1){if("#"===e.slice(-1))return e[0].toUpperCase()+" sharp";if("b"===e.slice(-1))return e[0].toUpperCase()+" flat"}return e[0].toUpperCase()},K=function(e){if(e=e.toLowerCase(),isNaN(+e.slice(-1))||(e=e.slice(0,-1)),e.length>1){if("#"===e.slice(-1))return e[0]+"-sharp";if("b"===e.slice(-1))return e[0]+"-flat"}return e[0]},U=function(e){Object(h.a)(n,e);var t=Object(j.a)(n);function n(){return Object(o.a)(this,n),t.apply(this,arguments)}return Object(l.a)(n,[{key:"render",value:function(){return Object(y.jsxs)(y.Fragment,{children:[Object(y.jsx)(g.a,{children:Object(y.jsx)("title",{children:"Notes - Musical Sight"})}),Object(y.jsx)(x.a,{className:"text-center",children:Object(y.jsxs)(x.a.Body,{children:[Object(y.jsx)(x.a.Title,{as:"h3",children:"Notes"}),Object(y.jsx)(x.a.Text,{children:"All melodies and chords consist of the same 12 notes distributed over multiple octaves, starting from octave 0 up to octave 7. Notes are usually written with their corresponding octave number appended to them, the note C in octave 4 being written as C4. C4 is also known as the middle C."}),Object(y.jsx)(x.a.Text,{children:"This page lists all 12 notes in ascending order, with all the sharp/flat notes being known as the black keys on a keyboard and every other note being a white key. The highest note (B) is followed by a C again, but within the next octave and vice versa. You can click on any note listed here to open its corresponding page, where you will find listening example and more information on the note, its keys and so on."})]})}),Object(y.jsx)("h3",{children:"Notes List"}),Object(y.jsx)(f.a,{children:["c","c#","d","d#","e","f","f#","g","g#","a","a#","b"].map((function(e){return Object(y.jsx)(v.LinkContainer,{to:"/notes/"+K(e),children:Object(y.jsx)(f.a.Item,{action:!0,children:z(e)})})}))})]})}}]),n}(a.Component),D=n(16),H=n(46),Y=n(73),A=n(57),J=n(78),P=n(74),E=function(e){Object(h.a)(n,e);var t=Object(j.a)(n);function n(e){var a;return Object(o.a)(this,n),(a=t.call(this,e)).state={currentNote:"c"},a}return Object(l.a)(n,[{key:"toString",value:function(){return Object(P.a)(unescape(this.props.match.params.scale)+" scale")}},{key:"playKey",value:function(){var e=Object(L.a)(S.a.mark((function e(){var t,n,a,c,i,s;return S.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=[].concat(Object(D.a)(Y.a.get(this.state.currentNote+"4 "+unescape(this.props.match.params.scale)).notes),[this.state.currentNote+"5"],Object(D.a)(Y.a.get(this.state.currentNote+"4 "+unescape(this.props.match.params.scale)).notes.reverse())),n=t.map((function(e,t,n){return t===n.length-1?"2n":"4n"})),e.next=4,this.initialize();case 4:for(a=I.l(),c=0;c<t.length;c++)i=H.a.simplify(t[c]),s=n[c],this.playNote(i,s,a),a+=I.e(s).toSeconds();case 6:case"end":return e.stop()}}),e,this)})));return function(){return e.apply(this,arguments)}}()},{key:"renderKey",value:function(){var e=this;return Object(y.jsx)(x.a,{className:"text-center",children:Object(y.jsxs)(x.a.Body,{children:[Object(y.jsx)(x.a.Title,{as:"h4",children:z(this.state.currentNote)+" "+this.toString()}),Object(y.jsxs)(x.a.Text,{children:["The following notes are included in this key:"," ",Y.a.get(this.state.currentNote+"4 "+unescape(this.props.match.params.scale)).notes.map((function(e){return Object(y.jsx)(r.Link,{to:"/notes/"+K(H.a.simplify(e.slice(0,-1))),children:z(H.a.simplify(e.slice(0,-1)))})}))]}),Object(y.jsx)(x.a.Link,{onClick:Object(L.a)(S.a.mark((function t(){return S.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.next=2,e.playKey();case 2:return t.abrupt("return",t.sent);case 3:case"end":return t.stop()}}),t)}))),children:"Listen to the notes"})]})})}},{key:"render",value:function(){var e=this;return Object(y.jsxs)(y.Fragment,{children:[Object(y.jsx)(g.a,{children:Object(y.jsxs)("title",{children:[z(this.state.currentNote)+" "+this.toString()," ","- Musical Sight"]})}),Object(y.jsx)("h3",{children:this.toString()}),"Select the current scale:",Object(y.jsx)(J.a,{title:"Selected scale: "+Object(P.a)(unescape(this.props.match.params.scale)),children:d.b.names().sort().map((function(e){return Object(y.jsx)(v.LinkContainer,{to:"/scales/"+escape(e),children:Object(y.jsx)(A.a.Item,{children:Object(P.a)(e)})})}))}),"Select the root note to choose the key for:",Object(y.jsx)(J.a,{title:"Selected note: "+z(this.state.currentNote),children:["c","c#","d","d#","e","f","f#","g","g#","a","a#","b"].map((function(t){return Object(y.jsx)(A.a.Item,{onClick:function(){return e.setState({currentNote:t})},children:z(t)})}))}),this.renderKey()]})}}]),n}(F),R=Object(O.o)(E),W=function(e){Object(h.a)(n,e);var t=Object(j.a)(n);function n(){return Object(o.a)(this,n),t.apply(this,arguments)}return Object(l.a)(n,[{key:"render",value:function(){return Object(y.jsxs)(y.Fragment,{children:[Object(y.jsx)(g.a,{children:Object(y.jsx)("title",{children:"Scales - Musical Sight"})}),Object(y.jsx)(x.a,{className:"text-center",children:Object(y.jsxs)(x.a.Body,{children:[Object(y.jsx)(x.a.Title,{as:"h3",children:"Scales"}),Object(y.jsxs)(x.a.Text,{children:["Musical theory describes scales to be a set of intervals that can be applied to any given note to find other notes that can be used together to create a musically appealing melody. There are alot different scales, but the most common ones in western music are probably the"," ",Object(y.jsx)(r.Link,{to:"/scales/major",children:"major"})," and the"," ",Object(y.jsx)(r.Link,{to:"/scales/aeolian",children:"natural minor (also known as aeolian)"})," ","scales."]}),Object(y.jsx)(x.a.Text,{children:"You will find the alphabetically sorted list of all common scales below. Follow the links to find more information about the scales, find the keys associated with them and audio examples as well."})]})}),Object(y.jsx)("h3",{children:"Scales List"}),Object(y.jsx)(f.a,{children:d.b.names().sort().map((function(e){return Object(y.jsx)(v.LinkContainer,{to:"/scales/"+escape(e),children:Object(y.jsx)(f.a.Item,{action:!0,children:e})})}))})]})}}]),n}(a.Component),q=function(e){Object(h.a)(n,e);var t=Object(j.a)(n);function n(){return Object(o.a)(this,n),t.apply(this,arguments)}return Object(l.a)(n,[{key:"render",value:function(){return Object(y.jsxs)("div",{children:[Object(y.jsxs)(u.a,{children:[Object(y.jsx)("h2",{children:"Navigation"}),Object(y.jsx)(p.a,{className:"fixed-top",bg:"light",variant:"light",children:Object(y.jsx)(p.a.Collapse,{children:Object(y.jsxs)(b.a,{className:"mr-auto",children:[Object(y.jsx)(b.a.Item,{children:Object(y.jsx)(b.a.Link,{as:r.Link,to:"/",active:!0,children:"Home"})}),Object(y.jsx)(b.a.Item,{children:Object(y.jsx)(b.a.Link,{as:r.Link,to:"/notes",children:"Notes"})}),Object(y.jsx)(b.a.Item,{children:Object(y.jsx)(b.a.Link,{as:r.Link,to:"/scales",children:"Scales"})}),Object(y.jsx)(b.a.Item,{children:Object(y.jsx)(b.a.Link,{as:r.Link,to:"/chords",children:"Chords"})}),Object(y.jsx)(b.a.Item,{children:Object(y.jsx)(b.a.Link,{as:r.Link,to:"/imprint",children:"Imprint"})})]})})})]}),Object(y.jsx)("div",{children:Object(y.jsxs)(O.g,{children:[Object(y.jsx)(O.d,{exact:!0,path:"/",component:w}),Object(y.jsx)(O.d,{exact:!0,path:"/imprint",component:C}),Object(y.jsx)(O.d,{exact:!0,path:"/notes",component:U}),Object(y.jsx)(O.d,{path:"/notes/:note([a-g])",component:B}),Object(y.jsx)(O.d,{path:"/notes/:note([a-g]-sharp)",component:B}),Object(y.jsx)(O.d,{path:"/notes/:note([a-g]-flat)",component:B}),d.b.names().map((function(e){return Object(y.jsx)(O.d,{path:"/scales/:scale("+e.replace("#","%23")+")",component:R})})),Object(y.jsx)(O.d,{exact:!0,path:"/scales",component:W}),Object(y.jsx)(O.d,{exact:!0,path:"/chords",component:k}),Object(y.jsx)(O.d,{render:function(){return Object(y.jsx)("p",{children:"Not found"})}})]})})]})}}]),n}(a.Component);var G=function(){return Object(y.jsxs)(y.Fragment,{children:[Object(y.jsx)("h1",{children:"Musical Sight"}),Object(y.jsx)(q,{})]})},Q=(n(112),function(e){e&&e instanceof Function&&n.e(3).then(n.bind(null,118)).then((function(t){var n=t.getCLS,a=t.getFID,c=t.getFCP,i=t.getLCP,s=t.getTTFB;n(e),a(e),c(e),i(e),s(e)}))});s.a.render(Object(y.jsx)(c.a.StrictMode,{children:Object(y.jsx)(r.HashRouter,{children:Object(y.jsx)(G,{})})}),document.getElementById("root")),Q()}},[[113,1,2]]]);
//# sourceMappingURL=main.fc5e7fb7.chunk.js.map