!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t(require("preact"));else if("function"==typeof define&&define.amd)define(["preact"],t);else{var r=t("object"==typeof exports?require("preact"):e.preact);for(var o in r)("object"==typeof exports?exports:e)[o]=r[o]}}(this,function(e){return function(e){function t(o){if(r[o])return r[o].exports;var n=r[o]={exports:{},id:o,loaded:!1};return e[o].call(n.exports,n,n.exports,t),n.loaded=!0,n.exports}var r={};return t.m=e,t.c=r,t.p="",t(0)}([function(e,t,r){"use strict";function o(e,t){function r(){var t=[].slice.call(this.attributes).reduce(function(e,t){return e[t.nodeName]=t.nodeValue,e},{});(0,n.render)((0,n.h)(e,t),this)}var o=Object.create(HTMLElement.prototype);return o.attachedCallback=r,o.detachedCallback=function(){(0,n.unmountComponentAtNode)(this)},o.attributeChangedCallback=r,document.registerElement(t||e.displayName,{prototype:o})}Object.defineProperty(t,"__esModule",{value:!0}),t["default"]=o;var n=r(1)},function(t,r){t.exports=e}])});