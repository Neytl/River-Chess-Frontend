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

function clickedOnClass(event, className) {
    return !!event.target.closest("." + className);
}

// Checks if an event clicked on the specified element
function clickedOn(event, id) {
    return event.target.closest("#" + id) === get(id);
}

function goToTheRiver() {
    window.location.href = "/theRiver";
}

function createElement(elementString) {
    var frag = document.createDocumentFragment();

    var elem = document.createElement('div');
    elem.innerHTML = elementString;

    while (elem.childNodes[0]) {
        frag.appendChild(elem.childNodes[0]);
    }
    return frag;
}
 