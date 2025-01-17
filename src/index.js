import { h, cloneElement, render, hydrate, Fragment } from 'preact';

export default function register(Component, tagName, propNames, options) {
	function PreactElement() {
		const inst = Reflect.construct(HTMLElement, [], PreactElement);
		inst._vdomComponent = Component;
		inst._root =
			options && options.shadow ? inst.attachShadow({ mode: 'open' }) : inst;
		inst._attrMap = attrMap;
		return inst;
	}
	PreactElement.prototype = Object.create(HTMLElement.prototype);
	PreactElement.prototype.constructor = PreactElement;
	PreactElement.prototype.connectedCallback = connectedCallback;
	PreactElement.prototype.attributeChangedCallback = attributeChangedCallback;
	PreactElement.prototype.disconnectedCallback = disconnectedCallback;
	PreactElement.prototype._deferredRender = deferredRender;

	propNames =
		propNames ||
		Component.observedAttributes ||
		Object.keys(Component.propTypes || {});

	const propNamesLc = [];
	// create an attribute map to resolve correct camelCase from lowercased strings
	const attrMap = propNames.reduce((curr, name) => {
		const nameLc = name.toLowerCase();
		if (nameLc !== name) {
			curr[nameLc] = name;
			propNamesLc.push(nameLc);
		}
		return curr;
	}, {});

	PreactElement.observedAttributes = [...new Set([...propNamesLc, ...propNames])];

	// Keep DOM properties and Preact props in sync
	propNames.forEach((name) => {
		Object.defineProperty(PreactElement.prototype, name, {
			get() {
				return this._vdom?.props?.[name] ?? this._props?.[name];
			},
			set(v) {
				if (this._vdom) {
					this.attributeChangedCallback(name, null, v);
				} else {
					if (!this._props) this._props = {};
					this._props[name] = v;
					this.connectedCallback();
				}

				// Reflect property changes to attributes if the value is a primitive
				const type = typeof v;
				if (
					v == null ||
					type === 'string' ||
					type === 'boolean' ||
					type === 'number'
				) {
					this.setAttribute(name, v);
				}
			}
		});
	});

	return customElements.define(
		tagName || Component.tagName || Component.displayName || Component.name,
		PreactElement
	);
}

function ContextProvider(props) {
	this.getChildContext = () => props.context;
	// eslint-disable-next-line no-unused-vars
	const { context, children, ...rest } = props;
	return cloneElement(children, rest);
}

function connectedCallback() {
	// Obtain a reference to the previous context by pinging the nearest
	// higher up node that was rendered with Preact. If one Preact component
	// higher up receives our ping, it will set the `detail` property of
	// our custom event. This works because events are dispatched
	// synchronously.
	const event = new CustomEvent('_preact', {
		detail: {},
		bubbles: true,
		cancelable: true
	});
	this.dispatchEvent(event);
	const context = event.detail.context;
	this._vdom = h(
		ContextProvider,
		{ ...this._props, context },
		toVdom(this, this._vdomComponent)
	);
	// clear all inner elements to prevent double render
	this.innerHTML = null;
	(this.hasAttribute('hydrate') ? hydrate : this._deferredRender.bind(this))(this._vdom, this._root);
}

function toCamelCase(str) {
	return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''));
}

function deferredRender (vdom, root) {
	if (this._renderId) {
		window.cancelAnimationFrame(this._renderId);
		this._renderId = undefined;
	}
	this._renderId = window.requestAnimationFrame(() => {
		this._renderId = undefined;
		render(vdom, root);
	});
}

function attributeChangedCallback(nameLc, oldValue, newValue) {
	const name = this._attrMap[nameLc] || nameLc;
	if (!this._vdom) return;
	// Attributes use `null` as an empty value whereas `undefined` is more
	// common in pure JS components, especially with default parameters.
	// When calling `node.removeAttribute()` we'll receive `null` as the new
	// value. See issue #50.
	const _newValue = fromString(newValue);
	const props = this._props || {};

	if (props[name] === _newValue) {
		// no rerender if values are same
		return;
	}
	props[name] = _newValue;
	props[toCamelCase(name)] = _newValue;

	this._vdom = cloneElement(this._vdom, props);
	this._deferredRender(this._vdom, this._root);
}

function disconnectedCallback() {
	this._deferredRender((this._vdom = null), this._root);
}

/**
 * Pass an event listener to each `<slot>` that "forwards" the current
 * context value to the rendered child. The child will trigger a custom
 * event, where will add the context value to. Because events work
 * synchronously, the child can immediately pull of the value right
 * after having fired the event.
 */
function Slot(props, context) {
	const ref = (r) => {
		if (!r) {
			this.ref.removeEventListener('_preact', this._listener);
		} else {
			this.ref = r;
			if (!this._listener) {
				this._listener = (event) => {
					event.stopPropagation();
					event.detail.context = context;
				};
				r.addEventListener('_preact', this._listener);
			}
		}
	};
	if (this.shadow) {
		// only make use of slot in shadow mode
		return h('slot', { ...props, ref });
	}
	// othewise keep the same DOM structure if not in shadow mode
	return h(Fragment, { ...props, ref });
}

function toVdom(element, nodeName) {
	if (element.nodeType === 3) return element.data;
	if (element.nodeType !== 1) return null;
	const children = [];
	// use `isWC` to distinguish between preact component and a web component
	const props = { isWC: true };
	const a = element.attributes;
	const cn = element.childNodes;
	let i = 0;
	for (i = a.length; i--; ) {
		if (a[i].name !== 'slot') {
			// fix attribute case and convert type from string
			const nameLc = a[i].name;
			const name = element._attrMap?.[nameLc] || nameLc;
			const value = fromString(a[i].value);
			props[name] = value;
			props[toCamelCase(name)] = value;
		}
	}

	for (i = cn.length; i--; ) {
		const vnode = toVdom(cn[i], null);
		// Move slots correctly
		const name = cn[i].slot;
		if (name) {
			props[name] = h(Slot, { name }, vnode);
		} else {
			children[i] = vnode;
		}
	}

	// Only wrap the topmost node with a slot
	const wrappedChildren = nodeName ? h(Slot, null, children) : children;
	return h(nodeName || element.nodeName.toLowerCase(), props, wrappedChildren);
}

// fix "stringified" values from setAttribute call
const RE = /^(\s*|[+-]?0\d.*)$/;
function fromString(value) {
	if (value === null) {
		return;
	}
	if (typeof value !== 'string') {
		return value;
	}
	if (value === 'true') {
		return true;
	}
	if (value === 'false') {
		return false;
	}
	if (/[{[]/.test(value[0])) {
		return jsonParse(value);
	}
	const num = Number(value);
	return isNaN(num) || RE.test(value) ? value : num;
}

function jsonParse (str) {
	try {
		return JSON.parse(str);
	} catch (e) {
	}
	return str;
}
