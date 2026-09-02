/* =========================
   SIDE MENU
========================= */
const menuButton = get("menuButton");
const closeMenuButton = get("closeMenuButton");
const sideMenu = get("sideMenu");
const menuOverlay = get("menuOverlay");

function openMenu() {

    sideMenu.classList.add(
        "open"
    );

    menuOverlay.classList.add(
        "visible"
    );
}

function closeMenu() {

    sideMenu.classList.remove(
        "open"
    );

    menuOverlay.classList.remove(
        "visible"
    );
}

menuButton.addEventListener(
    "click",
    openMenu
);

closeMenuButton.addEventListener(
    "click",
    closeMenu
);

menuOverlay.addEventListener(
    "click",
    closeMenu
);
