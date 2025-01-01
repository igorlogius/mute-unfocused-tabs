/*global browser */

function onChange(evt) {
  const id = evt.target.id;
  const el = document.getElementById(id);

  let value = el.type === "checkbox" ? el.checked : el.value;
  let obj = {};

  if (value === "") {
    return;
  }
  if (el.type === "number") {
    try {
      value = parseInt(value);
      if (isNaN(value)) {
        value = el.min;
      }
      if (value < el.min) {
        value = el.min;
      }
    } catch (e) {
      value = el.min;
    }
  }

  obj[id] = value;
  browser.storage.local.set(obj).catch(console.error);
}

["mode", "listmatchers"].map((id) => {
  browser.storage.local
    .get(id)
    .then((obj) => {
      const el = document.getElementById(id);
      let val = obj[id];

      if (typeof val !== "undefined") {
        if (el.type === "checkbox") {
          el.checked = val;
        } else {
          el.value = val;
        }
      }
    })
    .catch((/*err*/) => {});

  let el = document.getElementById(id);
  el.addEventListener("click", onChange);
  el.addEventListener("keyup", onChange);
});
