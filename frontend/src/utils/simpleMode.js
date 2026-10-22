// Sabia: "simple view" for less technical users. Per browser, toggled from the
// user menu. Purely presentational: index.css hides [data-simple-hide] and shows
// .sabia-simple-only while <html> has the sabia-simple class.
const KEY = "sabia_simple_mode";

export function isSimpleMode() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setSimpleMode(on) {
  try {
    if (on) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {
    // storage blocked: still apply for this page view
  }
  document.documentElement.classList.toggle("sabia-simple", !!on);
}

export function applySimpleMode() {
  document.documentElement.classList.toggle("sabia-simple", isSimpleMode());
}
