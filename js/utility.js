const isOnHomePage = window.location.pathname === "/";
function goHome() {
    window.location.href = "/";
}

function get(id) {
    return document.getElementById(id);
}

function getAll(selector) {
    return Array.from(document.querySelectorAll(selector));
}

function getFirst(selector) {
    return document.querySelector(selector);
}

function goToTheRiver() {
    window.location.href = "/theRiver";
}
