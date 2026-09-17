
getAll(".hover-popup-parent").forEach(element => {
    element.addEventListener("click", event => {
        element.classList.add("open");
    });
    element.addEventListener("mouseenter", event => {
        element.classList.add("open");
    });
    element.addEventListener("mouseleave", event => {
        element.classList.remove("open");
    });
});

document.addEventListener("click", event => {
    if (clickedOnClass(event, "hover-popup-parent.open")) return;
    getAll(".hover-popup-parent.open").forEach(element => {
        element.classList.remove("open");
    });
});
