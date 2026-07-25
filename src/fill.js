// src/fill.js
(function (root) {
  root.JobFiller = root.JobFiller || {};

  const NATIVE_SETTER = Object.getOwnPropertyDescriptor(
    root.HTMLInputElement.prototype, "value"
  )?.set;

  // value may be string | boolean | null
  function fill(el, value, inputType) {
    if (value == null || value === "") return false;
    const tag = el.tagName.toLowerCase();

    if (tag === "select") {
      return fillSelect(el, String(value));
    }
    if (tag === "textarea") {
      return fillText(el, String(value));
    }
    if (inputType === "checkbox" || inputType === "radio") {
      const want = Boolean(value);
      if (el.checked !== want) { el.click(); }
      return true;
    }
    // text / email / tel / contenteditable
    if (el.isContentEditable) {
      el.focus();
      // execCommand is deprecated but still the most reliable for contenteditable in extensions
      root.document.execCommand("insertText", false, String(value));
      return true;
    }
    return fillText(el, String(value));
  }

  function fillText(el, str) {
    // Use native setter so React/Vue controlled inputs see the change.
    if (NATIVE_SETTER && el instanceof root.HTMLInputElement) {
      NATIVE_SETTER.call(el, str);
    } else {
      el.value = str;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function fillSelect(el, str) {
    const opts = Array.from(el.options);
    const hit = opts.find((o) => o.textContent.trim().toLowerCase() === str.toLowerCase())
             || opts.find((o) => o.value.toLowerCase() === str.toLowerCase());
    if (!hit) return false;
    el.value = hit.value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  root.JobFiller.fill = { fill };
})(typeof globalThis !== "undefined" ? globalThis : this);
