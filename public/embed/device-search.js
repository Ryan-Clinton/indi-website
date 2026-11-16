/*
 * INDI device search: "Is my device supported?"
 * https://indilib.org/#supported
 *
 * Use it on any website:
 *
 *   <script src="https://indilib.org/embed/device-search.js" defer></script>
 *   <indi-device-search></indi-device-search>
 *
 * Attributes (all optional):
 *   theme        "dark" (default) or "light"
 *   label        heading above the box; label="" hides it
 *   placeholder  text in the empty box
 *   src          the device list, default the EkosLive list (https://ekoslive.com/api/equipments/indi-devices)
 *   forum        link shown with "Not supported", default https://forum.indilib.org
 *   product      what the device works with, default "INDI" ("Canon 600D works with INDI.")
 *   client       where the driver is chosen, default "your INDI client"
 *                ("In your INDI client, choose the Canon DSLR driver.")
 *   share        keep ?device=<name> in the address bar, and answer it when the page opens
 *
 * Colors and fonts: set these CSS variables on the element, for example
 *   indi-device-search { --ids-accent: #d45500; }
 * --ids-font (font shorthand), --ids-label-font (font family of the heading), --ids-ink, --ids-muted, --ids-bg, --ids-panel, --ids-line,
 * --ids-hover, --ids-accent, --ids-yes, --ids-no, --ids-radius
 *
 * After each answer the element fires "indi-device-result" with
 * detail { query, supported, device, kind, driver }.
 *
 * The device list comes from EkosLive, the one source for it: its equipment catalogue, every INDI
 * driver (read from indi and indi-3rdparty each week) and the DSLRs libgphoto2 can drive.
 */
(function () {
  "use strict";
  if (!window.customElements || customElements.get("indi-device-search")) return;

  var script = document.currentScript;
  var BASE = script && script.src ? script.src : location.href;
  var FORUM = "https://forum.indilib.org";
  var LIST = "https://ekoslive.com/api/equipments/indi-devices";

  var CSS = [
    ":host { display: block; font: var(--ids-font, inherit); color: var(--ids-ink, #f2f2f2);",
    "  --_bg: var(--ids-bg, #262525); --_panel: var(--ids-panel, #2c2b2b); --_ink: var(--ids-ink, #f2f2f2);",
    "  --_muted: var(--ids-muted, #a9a9a9); --_line: var(--ids-line, #3a3939); --_hover: var(--ids-hover, #383737);",
    "  --_accent: var(--ids-accent, #7d9bff); --_yes: var(--ids-yes, #2bc77a); --_no: var(--ids-no, #ff6b6b); --_r: var(--ids-radius, 12px); }",
    ":host([theme=light]) { color: var(--ids-ink, #1d1d1d);",
    "  --_bg: var(--ids-bg, #ffffff); --_panel: var(--ids-panel, #ffffff); --_ink: var(--ids-ink, #1d1d1d);",
    "  --_muted: var(--ids-muted, #5c5c5c); --_line: var(--ids-line, #d4d4d4); --_hover: var(--ids-hover, #f0f0f0);",
    "  --_accent: var(--ids-accent, #2359f5); --_yes: var(--ids-yes, #16804b); --_no: var(--ids-no, #c62828); }",
    ":host([hidden]) { display: none; }",
    "* { box-sizing: border-box; }",
    ".wrap { display: grid; gap: 12px; }",
    "label { font-family: var(--ids-label-font, inherit); font-weight: 650; font-size: 1.15rem; line-height: 1.2; }",
    ".field { position: relative; }",
    ".field > svg { position: absolute; left: 16px; top: 50%; width: 20px; height: 20px; transform: translateY(-50%); stroke: var(--_muted); fill: none; stroke-width: 2; stroke-linecap: round; pointer-events: none; }",
    "input { width: 100%; font: inherit; font-size: 1.05rem; line-height: 1.4; color: var(--_ink); background: var(--_bg); border: 1px solid var(--_line); border-radius: var(--_r); padding: 15px 16px 15px 46px; margin: 0; }",
    "input::placeholder { color: var(--_muted); opacity: 0.85; }",
    "input:focus { outline: none; border-color: var(--_accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--_accent) 25%, transparent); }",
    "ul { position: absolute; z-index: 5; left: 0; right: 0; top: calc(100% + 6px); margin: 0; padding: 6px; list-style: none; background: var(--_panel); border: 1px solid var(--_line); border-radius: var(--_r); box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3); max-height: 360px; overflow-y: auto; }",
    "li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border-radius: 8px; cursor: pointer; }",
    "li span { display: grid; gap: 2px; min-width: 0; }",
    "li b { font-weight: 600; }",
    "li small, li em { color: var(--_muted); font-size: 0.82rem; font-style: normal; }",
    "li em { flex: none; text-align: right; }",
    "li:hover, li[aria-selected=true] { background: var(--_hover); }",
    ".answer { display: flex; gap: 14px; align-items: flex-start; padding: 16px 18px; border-radius: var(--_r); border: 1px solid; }",
    ".answer svg { flex: none; width: 28px; height: 28px; padding: 5px; border-radius: 50%; fill: none; stroke: #fff; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }",
    ".answer b { display: block; font-size: 1.1rem; line-height: 1.3; font-weight: 700; }",
    ".answer p { margin: 0; color: var(--_ink); }",
    ".answer a { color: var(--_accent); }",
    ".yes { border-color: color-mix(in srgb, var(--_yes) 50%, transparent); background: color-mix(in srgb, var(--_yes) 10%, transparent); }",
    ".yes svg { background: var(--_yes); } .yes b { color: var(--_yes); }",
    ".no { border-color: color-mix(in srgb, var(--_no) 50%, transparent); background: color-mix(in srgb, var(--_no) 10%, transparent); }",
    ".no svg { background: var(--_no); } .no b { color: var(--_no); }",
    ".note { margin: 0; color: var(--_muted); font-size: 0.9rem; }",
    "@media (max-width: 560px) { li { flex-direction: column; align-items: flex-start; gap: 4px; } li em { text-align: left; } }",
  ].join("\n");

  var norm = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); };

  // One download per list, shared by every box on the page
  var lists = {};
  function loadList(src) {
    if (!lists[src]) {
      lists[src] = fetch(src)
        .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then(prepare)
        .catch(function (e) { delete lists[src]; throw e; });
    }
    return lists[src];
  }
  function prepare(data) {
    function make(n, k, d, a, re) {
      var w = norm([n].concat(a).join(" ")).split(" ");
      var words = w.concat(w.slice(1).map(function (x, i) { return w[i] + x; })); // Z6II finds "Z6 II"
      return { n: n, k: k, d: d, a: a, words: words.filter(function (x, i) { return words.indexOf(x) === i; }), re: re };
    }
    var entries = data.families.map(function (f) { return make(f.n, f.k, f.d, [], new RegExp(f.re)); })
      .concat(data.devices.map(function (r) { return make(r[0], r[1], r[2], r[3]); }));
    var dslr = data.devices.filter(function (r) { return r[1].indexOf("DSLR") === 0; }).length;
    return { entries: entries, count: data.devices.length, dslr: dslr, updated: data.updated };
  }

  // How well a piece of the query fits one word of the name: 0 the whole word, 1 the start of a word,
  // 2 a longer form of a model number in the name (CEM40EC finds CEM40, AM5N finds AM5), or no fit
  function fit(e, piece) {
    var best;
    for (var i = 0; i < e.words.length; i++) {
      var h = e.words[i];
      var s = h === piece ? 0 : h.indexOf(piece) === 0 ? 1 : h.length >= 3 && /\d/.test(h) && piece.indexOf(h) === 0 ? 2 : undefined;
      if (s !== undefined && (best === undefined || s < best)) best = s;
    }
    return best;
  }
  // Every query word must fit the start of a name word. Neighbors may be joined, so "a7 iii" finds A7III.
  // Tries every way of joining neighbors and keeps the closest one.
  function score(e, qw) {
    var best = [];
    best[qw.length] = 0;
    for (var i = qw.length - 1; i >= 0; i--) {
      for (var j = i + 1; j <= qw.length; j++) {
        if (best[j] === undefined) continue;
        var s = fit(e, qw.slice(i, j).join(""));
        if (s !== undefined && (best[i] === undefined || s + best[j] < best[i])) best[i] = s + best[j];
      }
    }
    return best[0];
  }
  function search(list, q) {
    var qn = norm(q);
    if (!qn) return [];
    var qw = qn.split(" ");
    var scored = [];
    list.entries.forEach(function (e) {
      // Lower is better: family rules first, then the closest words, then shorter names
      var s = e.re && e.re.test(qn) ? -1 : score(e, qw);
      if (s !== undefined) scored.push([s + e.n.length / 1000, e]);
    });
    return scored.sort(function (a, b) { return a[0] - b[0]; }).slice(0, 8).map(function (s) { return s[1]; });
  }

  var uid = 0;
  var ICON_SEARCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';
  var ICON_YES = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
  var ICON_NO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  class DeviceSearch extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      var self = this;
      var id = "ids" + ++uid;
      var root = this.attachShadow({ mode: "open" });
      var label = this.hasAttribute("label") ? this.getAttribute("label") : "Is my device supported?";
      var placeholder = this.getAttribute("placeholder") || "Type a model, like Canon 600D, ASI2600MC or EQ6-R";
      this.src = new URL(this.getAttribute("src") || LIST, BASE).href;
      this.forum = this.getAttribute("forum") || FORUM;
      this.product = this.getAttribute("product") || "INDI";
      this.client = this.getAttribute("client") || "your INDI client";
      root.innerHTML = "<style>" + CSS + "</style>" +
        '<div class="wrap">' +
        (label ? '<label for="' + id + '-q">' + esc(label) + "</label>" : "") +
        '<div class="field">' + ICON_SEARCH +
        '<input id="' + id + '-q" type="search" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="' + id + '-list" autocomplete="off" spellcheck="false"' +
        (label ? "" : ' aria-label="Is my device supported?"') + ' placeholder="' + esc(placeholder) + '">' +
        '<ul id="' + id + '-list" role="listbox" aria-label="Matching devices" hidden></ul></div>' +
        '<div class="out" aria-live="polite"></div>' +
        '<p class="note">Cameras, DSLRs, mounts, focusers, filter wheels, domes and more.</p></div>';
      this.id_ = id;
      this.input = root.querySelector("input");
      this.listbox = root.querySelector("ul");
      this.out = root.querySelector(".out");
      this.note = root.querySelector(".note");
      this.list = null;
      this.shown = [];
      this.active = -1;
      this.timer = 0;

      var input = this.input;
      input.addEventListener("focus", function () { self.load(); });
      input.addEventListener("input", function () { self.update(); });
      input.addEventListener("keydown", function (ev) { self.key(ev); });
      input.addEventListener("blur", function () { setTimeout(function () { self.close(); }, 100); });
      // mousedown, not click, so the choice lands before the input loses focus
      this.listbox.addEventListener("mousedown", function (ev) {
        var li = ev.target.closest("li");
        if (!li) return;
        ev.preventDefault();
        self.supported(self.shown[Number(li.dataset.i)]);
      });

      // Opened from a shared link
      var asked = this.hasAttribute("share") ? new URLSearchParams(location.search).get("device") : null;
      if (asked && norm(asked)) {
        input.value = asked;
        this.load().then(function () {
          if (!self.list) return;
          var found = search(self.list, asked);
          if (found.length) self.supported(found[0]); else self.notSupported(asked);
          if (self.id) self.scrollIntoView();
        });
      }
    }

    load() {
      var self = this;
      return loadList(this.src).then(function (list) {
        self.list = list;
        self.note.textContent = list.count.toLocaleString("en-US") + " devices, including " + list.dslr +
          " DSLR and mirrorless cameras. List updated " + list.updated + ".";
      }, function () {
        self.note.textContent = "The device list could not be loaded. Please try again later.";
      });
    }

    close() {
      this.listbox.hidden = true;
      this.listbox.innerHTML = "";
      this.input.setAttribute("aria-expanded", "false");
      this.input.removeAttribute("aria-activedescendant");
      this.active = -1;
    }

    render() {
      var id = this.id_, active = this.active;
      if (!this.shown.length) return this.close();
      this.listbox.innerHTML = this.shown.map(function (e, i) {
        var also = e.a.length ? "<small>Also " + esc(e.a.slice(0, 3).join(", ")) + "</small>" : "";
        return '<li role="option" id="' + id + "-opt-" + i + '" data-i="' + i + '" aria-selected="' + (i === active) + '"><span><b>' +
          esc(e.n) + "</b>" + also + "</span><em>" + esc(e.k) + "</em></li>";
      }).join("");
      this.listbox.hidden = false;
      this.input.setAttribute("aria-expanded", "true");
      if (active >= 0) this.input.setAttribute("aria-activedescendant", id + "-opt-" + active);
      else this.input.removeAttribute("aria-activedescendant");
    }

    // Keep the address bar shareable: ?device=<name> opens with the same answer
    share(device) {
      if (!this.hasAttribute("share")) return;
      var hash = this.id ? "#" + this.id : "";
      var url = device ? "?device=" + encodeURIComponent(device.trim()).replace(/%20/g, "+") + hash : location.pathname + hash;
      history.replaceState(null, "", url);
    }

    report(query, e) {
      this.dispatchEvent(new CustomEvent("indi-device-result", {
        bubbles: true, composed: true,
        detail: { query: query, supported: !!e, device: e ? e.n : null, kind: e ? e.k : null, driver: e ? e.d : null },
      }));
    }

    supported(e) {
      this.close();
      // A family answers for the model that was typed (EQ6-R), so keep that text and link to it
      var typed = this.input.value.trim();
      var name = e.re && typed ? typed : e.n;
      var covers = e.re ? " It is covered by: " + esc(e.n) + "." : "";
      if (!e.re || !typed) this.input.value = e.n;
      this.share(name);
      this.out.innerHTML = '<div class="answer yes">' + ICON_YES + "<div><b>Supported</b><p>" + esc(name) + " works with " + esc(this.product) + "." + covers +
        " In " + esc(this.client) + ", choose the <strong>" + esc(e.d) + "</strong> driver.</p></div></div>";
      this.report(typed || e.n, e);
    }

    notSupported(q) {
      this.close();
      this.share(q);
      this.out.innerHTML = '<div class="answer no">' + ICON_NO + "<div><b>Not supported</b><p>We could not find “" + esc(q.trim()) +
        '” in the ' + esc(this.product) + ' device list. Think this is wrong? <a href="' + esc(this.forum) + '">Ask on the forum</a>.</p></div></div>';
      this.report(q.trim(), null);
    }

    update() {
      var self = this, q = this.input.value;
      this.out.innerHTML = "";
      clearTimeout(this.timer);
      if (!norm(q)) { this.shown = []; if (location.search) this.share(""); return this.close(); }
      this.load().then(function () {
        if (self.input.value !== q || !self.list) return;
        self.shown = search(self.list, q);
        self.active = -1;
        self.render();
        // No match at all: answer after a short pause, once the visitor stops typing
        if (!self.shown.length && norm(q).length >= 3) self.timer = setTimeout(function () { self.notSupported(q); }, 600);
      });
    }

    key(ev) {
      var n = this.shown.length;
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        if (!n) return;
        ev.preventDefault();
        this.active = (this.active + (ev.key === "ArrowDown" ? 1 : -1) + n) % n;
        this.render();
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        if (n) this.supported(this.shown[Math.max(this.active, 0)]);
        else if (norm(this.input.value) && this.list) { clearTimeout(this.timer); this.notSupported(this.input.value); }
      } else if (ev.key === "Escape") this.close();
    }
  }

  customElements.define("indi-device-search", DeviceSearch);
})();
