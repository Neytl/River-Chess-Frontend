const isOnHomePage = window.location.pathname === "/";
function goHome() {
    window.location.href = "/";
}

function get(id) {
    return document.getElementById(id);
}

function goToTheRiver() {
    window.location.href = "/theRiver";
}
