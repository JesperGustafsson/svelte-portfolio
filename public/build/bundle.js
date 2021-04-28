
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\Navbar.svelte generated by Svelte v3.37.0 */

    const file$5 = "src\\components\\Navbar.svelte";

    function create_fragment$5(ctx) {
    	let nav;
    	let a0;
    	let t1;
    	let div;
    	let a1;
    	let t3;
    	let a2;
    	let t5;
    	let a3;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			a0 = element("a");
    			a0.textContent = "Home";
    			t1 = space();
    			div = element("div");
    			a1 = element("a");
    			a1.textContent = "About";
    			t3 = space();
    			a2 = element("a");
    			a2.textContent = "Portfolio";
    			t5 = space();
    			a3 = element("a");
    			a3.textContent = "Contact";
    			attr_dev(a0, "class", "link svelte-lndgv7");
    			attr_dev(a0, "href", "/");
    			add_location(a0, file$5, 1, 4, 11);
    			attr_dev(a1, "class", "link svelte-lndgv7");
    			attr_dev(a1, "href", "#about");
    			add_location(a1, file$5, 3, 8, 66);
    			attr_dev(a2, "class", "link svelte-lndgv7");
    			attr_dev(a2, "href", "#portfolio");
    			add_location(a2, file$5, 4, 8, 117);
    			attr_dev(a3, "class", "link svelte-lndgv7");
    			attr_dev(a3, "href", "/");
    			add_location(a3, file$5, 5, 8, 176);
    			add_location(div, file$5, 2, 4, 51);
    			attr_dev(nav, "class", "svelte-lndgv7");
    			add_location(nav, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, a0);
    			append_dev(nav, t1);
    			append_dev(nav, div);
    			append_dev(div, a1);
    			append_dev(div, t3);
    			append_dev(div, a2);
    			append_dev(div, t5);
    			append_dev(div, a3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\Header.svelte generated by Svelte v3.37.0 */

    const file$4 = "src\\components\\Header.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let h1;
    	let span1;
    	let t0;
    	let strong;
    	let t2;
    	let span0;
    	let a0;
    	let i0;
    	let t3;
    	let a1;
    	let i1;
    	let t4;
    	let a2;
    	let i2;
    	let t5;
    	let br;
    	let t6;
    	let t7;
    	let div;
    	let i3;
    	let t8;
    	let i4;
    	let t9;
    	let i5;
    	let t10;
    	let i6;
    	let t11;
    	let i7;
    	let t12;
    	let span2;
    	let t13;
    	let i8;
    	let t14;
    	let i9;
    	let t15;
    	let i10;

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			span1 = element("span");
    			t0 = text("I am ");
    			strong = element("strong");
    			strong.textContent = "Jesper";
    			t2 = text(", ");
    			span0 = element("span");
    			a0 = element("a");
    			i0 = element("i");
    			t3 = space();
    			a1 = element("a");
    			i1 = element("i");
    			t4 = space();
    			a2 = element("a");
    			i2 = element("i");
    			t5 = space();
    			br = element("br");
    			t6 = text(" \r\n        Full-Stack Developer");
    			t7 = space();
    			div = element("div");
    			i3 = element("i");
    			t8 = space();
    			i4 = element("i");
    			t9 = space();
    			i5 = element("i");
    			t10 = space();
    			i6 = element("i");
    			t11 = space();
    			i7 = element("i");
    			t12 = space();
    			span2 = element("span");
    			t13 = space();
    			i8 = element("i");
    			t14 = space();
    			i9 = element("i");
    			t15 = space();
    			i10 = element("i");
    			add_location(strong, file$4, 48, 19, 925);
    			attr_dev(i0, "class", "fab fa-github svelte-1d5pwpi");
    			add_location(i0, file$4, 49, 54, 1026);
    			attr_dev(a0, "href", "https://github.com/JesperGustafsson");
    			add_location(a0, file$4, 49, 8, 980);
    			attr_dev(i1, "class", "fab fa-linkedin svelte-1d5pwpi");
    			add_location(i1, file$4, 50, 74, 1135);
    			attr_dev(a1, "href", "https://www.linkedin.com/in/jesper-gustafsson-61618312a");
    			add_location(a1, file$4, 50, 8, 1069);
    			attr_dev(i2, "class", "fas fa-envelope svelte-1d5pwpi");
    			add_location(i2, file$4, 51, 54, 1228);
    			attr_dev(a2, "href", "mailto:jesper95gustafsson@gmail.com");
    			add_location(a2, file$4, 51, 8, 1182);
    			attr_dev(span0, "class", "sns svelte-1d5pwpi");
    			add_location(span0, file$4, 48, 44, 950);
    			add_location(span1, file$4, 48, 8, 914);
    			add_location(br, file$4, 53, 18, 1287);
    			attr_dev(h1, "class", "svelte-1d5pwpi");
    			add_location(h1, file$4, 48, 4, 910);
    			attr_dev(i3, "class", "fab fa-html5 svelte-1d5pwpi");
    			add_location(i3, file$4, 57, 8, 1371);
    			attr_dev(i4, "class", "fab fa-css3-alt svelte-1d5pwpi");
    			add_location(i4, file$4, 58, 8, 1411);
    			attr_dev(i5, "class", "fab fa-js svelte-1d5pwpi");
    			add_location(i5, file$4, 59, 8, 1454);
    			attr_dev(i6, "class", "fab fa-node-js svelte-1d5pwpi");
    			add_location(i6, file$4, 60, 8, 1491);
    			attr_dev(i7, "class", "fab fa-react svelte-1d5pwpi");
    			add_location(i7, file$4, 61, 8, 1531);
    			attr_dev(span2, "class", "space svelte-1d5pwpi");
    			add_location(span2, file$4, 62, 8, 1571);
    			attr_dev(i8, "class", "fas fa-database svelte-1d5pwpi");
    			add_location(i8, file$4, 63, 8, 1608);
    			attr_dev(i9, "class", "fab fa-python svelte-1d5pwpi");
    			add_location(i9, file$4, 64, 8, 1649);
    			attr_dev(i10, "class", "fab fa-java svelte-1d5pwpi");
    			add_location(i10, file$4, 65, 8, 1690);
    			attr_dev(div, "class", "skills svelte-1d5pwpi");
    			add_location(div, file$4, 56, 4, 1339);
    			attr_dev(main, "class", "svelte-1d5pwpi");
    			add_location(main, file$4, 47, 0, 898);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, span1);
    			append_dev(span1, t0);
    			append_dev(span1, strong);
    			append_dev(span1, t2);
    			append_dev(span1, span0);
    			append_dev(span0, a0);
    			append_dev(a0, i0);
    			append_dev(span0, t3);
    			append_dev(span0, a1);
    			append_dev(a1, i1);
    			append_dev(span0, t4);
    			append_dev(span0, a2);
    			append_dev(a2, i2);
    			append_dev(span0, t5);
    			append_dev(h1, br);
    			append_dev(h1, t6);
    			append_dev(main, t7);
    			append_dev(main, div);
    			append_dev(div, i3);
    			append_dev(div, t8);
    			append_dev(div, i4);
    			append_dev(div, t9);
    			append_dev(div, i5);
    			append_dev(div, t10);
    			append_dev(div, i6);
    			append_dev(div, t11);
    			append_dev(div, i7);
    			append_dev(div, t12);
    			append_dev(div, span2);
    			append_dev(div, t13);
    			append_dev(div, i8);
    			append_dev(div, t14);
    			append_dev(div, i9);
    			append_dev(div, t15);
    			append_dev(div, i10);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\About.svelte generated by Svelte v3.37.0 */

    const file$3 = "src\\components\\About.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let content;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let h1;
    	let t2;
    	let hr;
    	let t3;
    	let p;

    	const block = {
    		c: function create() {
    			main = element("main");
    			content = element("content");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "About me";
    			t2 = space();
    			hr = element("hr");
    			t3 = space();
    			p = element("p");
    			p.textContent = "I studied Computer Science at Lund University, Sweden (2014 - 2017). Afterwards, I decided to study Japanese, also at Lund Univeristy (2017 - 2020), partly because I wanted to come into contact with a wide variety of people and their ideas/perspectives, rather than spend most of my young adulthood with mostly coders. After coming back to Sweden from my exchange year, I started dabbling in front-end development as it was something my education lacked. I would ideally want to work towards building a sustainable future or help people in need.";
    			if (img.src !== (img_src_value = "portfolioPhoto.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "me");
    			attr_dev(img, "class", "svelte-jd3ad0");
    			add_location(img, file$3, 3, 12, 75);
    			attr_dev(div0, "class", "image");
    			add_location(div0, file$3, 2, 8, 42);
    			add_location(h1, file$3, 6, 12, 175);
    			attr_dev(hr, "class", "svelte-jd3ad0");
    			add_location(hr, file$3, 7, 12, 206);
    			add_location(p, file$3, 8, 12, 224);
    			attr_dev(div1, "class", "text svelte-jd3ad0");
    			add_location(div1, file$3, 5, 8, 143);
    			attr_dev(content, "class", "svelte-jd3ad0");
    			add_location(content, file$3, 1, 4, 23);
    			attr_dev(main, "id", "about");
    			attr_dev(main, "class", "svelte-jd3ad0");
    			add_location(main, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, content);
    			append_dev(content, div0);
    			append_dev(div0, img);
    			append_dev(content, t0);
    			append_dev(content, div1);
    			append_dev(div1, h1);
    			append_dev(div1, t2);
    			append_dev(div1, hr);
    			append_dev(div1, t3);
    			append_dev(div1, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("About", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\Project.svelte generated by Svelte v3.37.0 */

    const file$2 = "src\\components\\Project.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let content;
    	let div0;
    	let a;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let h1;
    	let t1;
    	let t2;
    	let h2;
    	let t3;
    	let p;
    	let t4;

    	const block = {
    		c: function create() {
    			main = element("main");
    			content = element("content");
    			div0 = element("div");
    			a = element("a");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			t1 = text(/*title*/ ctx[1]);
    			t2 = space();
    			h2 = element("h2");
    			t3 = space();
    			p = element("p");
    			t4 = text(/*desc*/ ctx[2]);
    			if (img.src !== (img_src_value = /*imgSource*/ ctx[5])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "chess project");
    			attr_dev(img, "class", "svelte-ca04co");
    			add_location(img, file$2, 58, 25, 862);
    			attr_dev(a, "href", /*link*/ ctx[3]);
    			add_location(a, file$2, 58, 8, 845);
    			attr_dev(div0, "class", "image svelte-ca04co");
    			add_location(div0, file$2, 57, 4, 815);
    			add_location(h1, file$2, 61, 8, 954);
    			attr_dev(h2, "class", "svelte-ca04co");
    			add_location(h2, file$2, 62, 8, 980);
    			attr_dev(p, "class", "svelte-ca04co");
    			add_location(p, file$2, 63, 8, 1012);
    			attr_dev(div1, "class", "text svelte-ca04co");
    			add_location(div1, file$2, 60, 4, 925);
    			attr_dev(content, "class", "svelte-ca04co");
    			add_location(content, file$2, 55, 4, 798);
    			set_style(main, "background", /*bgColor*/ ctx[0]);
    			attr_dev(main, "class", "svelte-ca04co");
    			add_location(main, file$2, 54, 0, 756);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, content);
    			append_dev(content, div0);
    			append_dev(div0, a);
    			append_dev(a, img);
    			append_dev(content, t0);
    			append_dev(content, div1);
    			append_dev(div1, h1);
    			append_dev(h1, t1);
    			append_dev(div1, t2);
    			append_dev(div1, h2);
    			h2.innerHTML = /*tools*/ ctx[4];
    			append_dev(div1, t3);
    			append_dev(div1, p);
    			append_dev(p, t4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*imgSource*/ 32 && img.src !== (img_src_value = /*imgSource*/ ctx[5])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*link*/ 8) {
    				attr_dev(a, "href", /*link*/ ctx[3]);
    			}

    			if (dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);
    			if (dirty & /*tools*/ 16) h2.innerHTML = /*tools*/ ctx[4];			if (dirty & /*desc*/ 4) set_data_dev(t4, /*desc*/ ctx[2]);

    			if (dirty & /*bgColor*/ 1) {
    				set_style(main, "background", /*bgColor*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Project", slots, []);
    	let { bgColor } = $$props;
    	let { title } = $$props;
    	let { desc } = $$props;
    	let { link } = $$props;
    	let { tools } = $$props;
    	let { imgSource } = $$props;
    	const writable_props = ["bgColor", "title", "desc", "link", "tools", "imgSource"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Project> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("bgColor" in $$props) $$invalidate(0, bgColor = $$props.bgColor);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("desc" in $$props) $$invalidate(2, desc = $$props.desc);
    		if ("link" in $$props) $$invalidate(3, link = $$props.link);
    		if ("tools" in $$props) $$invalidate(4, tools = $$props.tools);
    		if ("imgSource" in $$props) $$invalidate(5, imgSource = $$props.imgSource);
    	};

    	$$self.$capture_state = () => ({
    		bgColor,
    		title,
    		desc,
    		link,
    		tools,
    		imgSource
    	});

    	$$self.$inject_state = $$props => {
    		if ("bgColor" in $$props) $$invalidate(0, bgColor = $$props.bgColor);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("desc" in $$props) $$invalidate(2, desc = $$props.desc);
    		if ("link" in $$props) $$invalidate(3, link = $$props.link);
    		if ("tools" in $$props) $$invalidate(4, tools = $$props.tools);
    		if ("imgSource" in $$props) $$invalidate(5, imgSource = $$props.imgSource);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [bgColor, title, desc, link, tools, imgSource];
    }

    class Project extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			bgColor: 0,
    			title: 1,
    			desc: 2,
    			link: 3,
    			tools: 4,
    			imgSource: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Project",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*bgColor*/ ctx[0] === undefined && !("bgColor" in props)) {
    			console.warn("<Project> was created without expected prop 'bgColor'");
    		}

    		if (/*title*/ ctx[1] === undefined && !("title" in props)) {
    			console.warn("<Project> was created without expected prop 'title'");
    		}

    		if (/*desc*/ ctx[2] === undefined && !("desc" in props)) {
    			console.warn("<Project> was created without expected prop 'desc'");
    		}

    		if (/*link*/ ctx[3] === undefined && !("link" in props)) {
    			console.warn("<Project> was created without expected prop 'link'");
    		}

    		if (/*tools*/ ctx[4] === undefined && !("tools" in props)) {
    			console.warn("<Project> was created without expected prop 'tools'");
    		}

    		if (/*imgSource*/ ctx[5] === undefined && !("imgSource" in props)) {
    			console.warn("<Project> was created without expected prop 'imgSource'");
    		}
    	}

    	get bgColor() {
    		throw new Error("<Project>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<Project>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Project>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Project>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get desc() {
    		throw new Error("<Project>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set desc(value) {
    		throw new Error("<Project>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get link() {
    		throw new Error("<Project>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set link(value) {
    		throw new Error("<Project>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tools() {
    		throw new Error("<Project>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tools(value) {
    		throw new Error("<Project>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get imgSource() {
    		throw new Error("<Project>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imgSource(value) {
    		throw new Error("<Project>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const projects = [
        {
            "title": "Chess",
            "desc": "A multiplayer Chess game built using React and Socket.io. A user enters a game room name, and after connecting the server they are prompted with a screen telling them to share the game room name to another player. When both players connect to the same room, the game starts. The server is hosted separately from the client.",
            "tools": `
            <i class="fab fa-react"></i> React,
            Styled Components,
            Socket.io`,
            
            "link": "https://hungry-franklin-438ea6.netlify.app/",
            "image": "project_thumb_chess.png"
        }, 
        {
            "title": "Currency Exchanger",
            "desc": "A currency exchanger, utilizing a free API to find conversion rates. This was my first time developing something meant for my portfolio and my first time using Styled Components.",
            "tools": `
        <i class="fab fa-react"></i> React,
        Styled Components`,

            "link": "https://jespergustafsson.github.io/currency-exchanger-v2/",
            "image": "project_thumb_currency.png"
        },
        {
            "title": "Anonymous Chat",
            "desc": "An anonymous chat, using Firebase (NoSQL style database) to store messages and handle authorization.",
            "tools": `
        <i class="fab fa-react"></i> React,
        Styled Components,
        Firebase`,

            "link": "https://jespergustafsson.github.io/chat-app/",
            "image": "project_thumb_chat.png"

        },
        {
            "title": "TripToken",
            "desc": "A transportation application. Traffic, users and bills are stored and accessed via a PostgreSQL database. Includes a simulator page that simulates traffic, altering the database with CRUD operations. I used the bcrypt library to salt and hash passwords before storing.",
            "tools": `
        <i class="fab fa-react"></i> React,
        Styled Components,
        PostgreSQL`,
            
            "link": "https://powerful-meadow-92316.herokuapp.com/",
            "image": "project_thumb_triptoken.png"

        }
    ];

    /* src\components\Portfolio.svelte generated by Svelte v3.37.0 */
    const file$1 = "src\\components\\Portfolio.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	child_ctx[2] = i;
    	return child_ctx;
    }

    // (33:8) {:else}
    function create_else_block(ctx) {
    	let project;
    	let current;

    	project = new Project({
    			props: {
    				title: /*project*/ ctx[0].title,
    				desc: /*project*/ ctx[0].desc,
    				link: /*project*/ ctx[0].link,
    				tools: /*project*/ ctx[0].tools,
    				imgSource: /*project*/ ctx[0].image
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(project.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(project, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(project.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(project.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(project, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(33:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (28:8) {#if i % 2}
    function create_if_block(ctx) {
    	let project;
    	let current;

    	project = new Project({
    			props: {
    				title: /*project*/ ctx[0].title,
    				desc: /*project*/ ctx[0].desc,
    				bgColor: "#2f2f2f",
    				link: /*project*/ ctx[0].link,
    				tools: /*project*/ ctx[0].tools,
    				imgSource: /*project*/ ctx[0].image
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(project.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(project, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(project.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(project.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(project, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(28:8) {#if i % 2}",
    		ctx
    	});

    	return block;
    }

    // (27:4) {#each projects as project, i}
    function create_each_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*i*/ ctx[2] % 2) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(27:4) {#each projects as project, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let current;
    	let each_value = projects;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "My Portfolio";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Most of my projects are built using React. This portfolio itself, however, is my first time experimenting with Svelte.";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "svelte-1emo95e");
    			add_location(h1, file$1, 24, 4, 381);
    			attr_dev(p, "class", "svelte-1emo95e");
    			add_location(p, file$1, 25, 4, 408);
    			attr_dev(main, "id", "portfolio");
    			attr_dev(main, "class", "svelte-1emo95e");
    			add_location(main, file$1, 23, 0, 354);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, p);
    			append_dev(main, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*projects*/ 0) {
    				each_value = projects;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(main, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Portfolio", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Portfolio> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Project, projects });
    	return [];
    }

    class Portfolio extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Portfolio",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.37.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let script;
    	let script_src_value;
    	let link;
    	let t0;
    	let body;
    	let navbar;
    	let t1;
    	let header;
    	let t2;
    	let about;
    	let t3;
    	let portfolio;
    	let current;
    	navbar = new Navbar({ $$inline: true });
    	header = new Header({ $$inline: true });
    	about = new About({ $$inline: true });
    	portfolio = new Portfolio({ $$inline: true });

    	const block = {
    		c: function create() {
    			script = element("script");
    			link = element("link");
    			t0 = space();
    			body = element("body");
    			create_component(navbar.$$.fragment);
    			t1 = space();
    			create_component(header.$$.fragment);
    			t2 = space();
    			create_component(about.$$.fragment);
    			t3 = space();
    			create_component(portfolio.$$.fragment);
    			if (script.src !== (script_src_value = "https://kit.fontawesome.com/4b80321256.js")) attr_dev(script, "src", script_src_value);
    			attr_dev(script, "crossorigin", "anonymous");
    			add_location(script, file, 8, 4, 248);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "src\\global.css");
    			add_location(link, file, 9, 4, 342);
    			add_location(body, file, 12, 0, 404);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, script);
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, body, anchor);
    			mount_component(navbar, body, null);
    			append_dev(body, t1);
    			mount_component(header, body, null);
    			append_dev(body, t2);
    			mount_component(about, body, null);
    			append_dev(body, t3);
    			mount_component(portfolio, body, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(about.$$.fragment, local);
    			transition_in(portfolio.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(about.$$.fragment, local);
    			transition_out(portfolio.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(script);
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(body);
    			destroy_component(navbar);
    			destroy_component(header);
    			destroy_component(about);
    			destroy_component(portfolio);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Navbar, Header, About, Portfolio });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
