
function displayStones(stones, container, properties) {
    if (!stones || !container) {
        return;
    }

    container.innerHTML = "";

    // No stones owned. // TODO - move this out
    if (isOnHomePage && stones.length === 0) {
        container.innerHTML =
            `<div class="no-stones">No stones collected yet.</div>`;
        return;
    }

    for (const stone of stones) {
        const stoneElement = createStoneElement(stone, properties);
        container.appendChild(stoneElement);

        // Adjust the popup
        /*let leftness = 50;
        while (getRightness(stoneElement.lastChild) < 150) {
            leftness -= 5;
            stoneElement.lastChild.style = `left: ${leftness}%;`;
        }

        while (getLeftness(stoneElement.lastChild) < 150) {
            leftness += 5;
            stoneElement.lastChild.style = `left: ${leftness}%;`;
        }*/
    }
}

function getLeftness(element) {
    return getXPosition(element);
}

function getRightness(element) {
    return window.outerWidth - getXPosition(element);
}

function getXPosition(element) {
    var xPosition = 0;

    while (element) {
        if (element.tagName == "BODY") {
            // deal with browser quirks with body/window/document and page scroll
            var xScrollPos = element.scrollLeft || document.documentElement.scrollLeft;

            xPosition += (element.offsetLeft - xScrollPos + element.clientLeft);
        } else {
            xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
        }

        element = element.offsetParent;
    }

    return xPosition;
}


function createStoneElement(stone, properties) {
    // Main wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "stone-wrapper";

    if (stone.isPurchased) {
        wrapper.classList.add("stone-purchased");
        return wrapper;
    }

    if (!!properties) {
        if (!!properties.isFlipped) {
            wrapper.classList.add("stone-flipped");
        }

        if (!!properties.isBlack) {
            wrapper.classList.add("stone-black");
        }
    }

    // -------------------------
    // Point dots
    // -------------------------

    const pointsContainer = document.createElement("div");

    pointsContainer.className = "stone-points";

    for (let i = 0; i < stone.points; i++) {
        const dot = document.createElement("div");

        dot.className = "stone-point-dot";

        pointsContainer.appendChild(dot);
    }

    wrapper.appendChild(pointsContainer);


    // -------------------------
    // Stone image
    // -------------------------

    const image = document.createElement("img");

    image.className = "stone-image";

    if (stone.isBurden) {
        wrapper.classList.add("burden");
        image.src = `/imgs/stones/burdens/${encodeURIComponent(stone.name.replace("'", ""))}.webp`;
    } else {
        image.src = `/imgs/stones/${encodeURIComponent(stone.name.replace("'", ""))}.webp`;
    }

    image.alt = stone.name;

    wrapper.appendChild(image);


    // -------------------------
    // Main popup
    // -------------------------

    const popup = document.createElement("div");

    popup.className = "stone-popup";

    const title = document.createElement("div");

    title.className = "stone-popup-title";
    title.textContent = stone.name;

    popup.appendChild(title);


    const description = document.createElement("div");

    description.className = "stone-popup-description";
    description.innerHTML = stone.ruleDescription;

    popup.appendChild(description);


    // -------------------------
    // Tooltip popup
    // -------------------------

    if (stone.toolTips && stone.toolTips.length > 0) {

        const tooltipsPopup =
            document.createElement("div");

        tooltipsPopup.className =
            "stone-tooltips-popup";

        for (const tooltip of stone.toolTips) {

            const tooltipElement =
                document.createElement("div");

            tooltipElement.className =
                "stone-tooltip";

            /*
             * Your tooltip data contains HTML such as:
             *
             * <div>King Movement</div>
             * <div>Move one square in any direction</div>
             *
             * So innerHTML is intentional here.
             *
             * Only do this if tooltip HTML is trusted and generated
             * by your own game data.
             */
            tooltipElement.innerHTML = tooltip;

            tooltipsPopup.appendChild(
                tooltipElement
            );
        }

        popup.appendChild(tooltipsPopup);


        /*
         * Decide whether the secondary popup should
         * appear on the right or left.
         */
        wrapper.addEventListener(
            "mouseenter",
            () => positionTooltipPopup(wrapper, tooltipsPopup)
        );
    }


    // -------------------------
    // Buy/Sell
    // -------------------------

    let actionText;

    if (!!properties) {
        if (!!properties.buyable) actionText = "Buy";
        if (!!properties.sellable) actionText = "Sell";
    }

    if (!!actionText) {
        const actionButton =
            document.createElement("button");

        actionButton.className =
            "stone-action-button";

        actionButton.textContent =
            actionText;

        actionButton.classList.add(
            actionText === "Buy"
                ? "buy-button"
                : "sell-button"
        );

        actionButton.addEventListener("click", async event => {
            event.stopPropagation();
            closeActiveStonePopup();

            if (actionText === "Buy") {
                await buyStone(stone, wrapper);
            }
            else if (actionText === "Sell") {
                await sellStone(stone, wrapper);
            }
        }
        );

        popup.appendChild(
            actionButton
        );
    }

    // -------------------------
    // Counters
    // -------------------------

    if (stone.counter > 0) {
        const counterContainer = document.createElement("div");

        counterContainer.className = "stone-counter";
        counterContainer.innerHTML = stone.counter;

            // const dot = document.createElement("div");
            //     dot.className = "stone-point-dot";
            //     pointsContainer.appendChild(dot);

            wrapper.appendChild(counterContainer);
    }


    // -------------------------
    // Popup click events
    // -------------------------

    wrapper.appendChild(popup);

    wrapper.addEventListener("click", event => {
        event.stopPropagation();

        // If this stone is already open, close it.
        if (activeStone === wrapper) {
            closeStonePopup(wrapper);
            activeStone = null;
            return;
        }

        // Close any previously open stone.
        if (activeStone) {
            closeStonePopup(activeStone);
        }

        // Open this stone.
        openStonePopup(wrapper);
        activeStone = wrapper;
    });

    return wrapper;
}


function positionTooltipPopup(
    wrapper,
    tooltipsPopup
) {
    const wrapperRect =
        wrapper.getBoundingClientRect();

    const popupWidth =
        tooltipsPopup.offsetWidth || 220;

    const spaceOnRight =
        window.innerWidth - wrapperRect.right;

    const spaceOnLeft =
        wrapperRect.left;

    // Prefer the right side.
    if (spaceOnRight >= popupWidth + 20) {

        tooltipsPopup.classList.remove(
            "tooltip-left"
        );

        tooltipsPopup.classList.add(
            "tooltip-right"
        );
    }
    else if (spaceOnLeft >= popupWidth + 20) {

        tooltipsPopup.classList.remove(
            "tooltip-right"
        );

        tooltipsPopup.classList.add(
            "tooltip-left"
        );
    }
    else {

        // Not enough room on either side.
        // Default to the right.
        tooltipsPopup.classList.remove(
            "tooltip-left"
        );

        tooltipsPopup.classList.add(
            "tooltip-right"
        );
    }
}


// -------------------------
// Mobile Stone popups
// -------------------------

let activeStone = null;


// Close popup when tapping/clicking anywhere else.
document.addEventListener("click", () => {
    if (activeStone) {
        closeStonePopup(activeStone);
        activeStone = null;
    }
});

function openStonePopup(stone) {
    stone.classList.add("stone-popup-open");
}

function closeStonePopup(stone) {
    stone.classList.remove("stone-popup-open");
}

function closeActiveStonePopup() {
    if (!activeStone) return;
    closeStonePopup(activeStone);
    activeStone = null;
}
