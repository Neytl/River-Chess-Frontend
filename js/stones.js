
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

        // Build and add the stone to the page
    for (const stone of stones) {
        container.appendChild(createStoneElement(stone, properties));

    }

    // Adjust the popups to fit on screen
    adjustPopupPositions(container)
}

function adjustPopupPositions(container) {
    Array.from(container.children).forEach(stoneElement => {
        keepPopupOnScreen(stoneElement.lastChild, stoneElement);
    });
}

function createStoneElement(stone, properties) {
    // Main wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "stone-wrapper";
    stone.cleanName = encodeURIComponent(stone.name.replace("'", ""));

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
        } else {
            wrapper.classList.add("stone-white");
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
        image.src = `/imgs/stones/burdens/${stone.cleanName}.webp`;
    } else {
        image.src = `/imgs/stones/${stone.cleanName}.webp`;
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
    // Launch button
    // -------------------------

    const launchButton = createElement(`
        <div class="stone-launch-button" id="${(!!properties && !!properties.isBlack ? "Black" : "White") + stone.name}LaunchButton">
            <svg class="checkmark-icon" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        </div>
    `);

    wrapper.appendChild(launchButton);

    // -------------------------
    // Popup click events
    // -------------------------

    wrapper.appendChild(popup);

    wrapper.addEventListener("click", event => {
        event.stopPropagation();

        // Check for launch
        console.log(wrapper);
        if (wrapper.classList.contains("launchable")) {
            wrapper.classList.remove("launchable");
            invoke(pickedPiece);
            return;
        }

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

function keepPopupOnScreen(popup, stoneWrapper) {
    if (!popup || !stoneWrapper) {
        return;
    }

    // Reset any previous positioning adjustments.
    popup.style.left = "";
    popup.style.right = "";




    // Decide whether the secondary popup appear on the right or left.
    positionTooltip(popup, popup.lastChild);

    // Position the popup as a whole
    const margin = 16;

    const popupRect = popup.getBoundingClientRect();
    const stoneRect = stoneWrapper.getBoundingClientRect();

    const viewportWidth = window.innerWidth;

    /*
     * First, use the normal CSS position.
     *
     * If the popup extends past the right edge, move it
     * far enough to the left to fit.
     */
    if (popupRect.right > viewportWidth - margin) {
        const overflow = popupRect.right - (viewportWidth - margin);

        popup.style.left =
            `${popup.offsetLeft - overflow}px`;
    }

    /*
     * Recalculate after the right-side correction.
     */
    const correctedRect = popup.getBoundingClientRect();

    /*
     * If it now extends past the left edge, move it right.
     */
    if (correctedRect.left < margin) {
        const overflow = margin - correctedRect.left;

        popup.style.left =
            `${popup.offsetLeft + overflow}px`;
    }
}


function positionTooltip(
    wrapper,
    tooltipsPopup
) {
    const wrapperRect =
        wrapper.getBoundingClientRect();

    const popupWidth =
        tooltipsPopup.offsetWidth || 242;

    const spaceOnRight =
        window.innerWidth - wrapperRect.right;

    const spaceOnLeft =
        wrapperRect.left;

    // Prefer the right side.
    if (spaceOnRight >= popupWidth + 40 || spaceOnRight >= spaceOnLeft) {

        tooltipsPopup.classList.remove(
            "tooltip-left"
        );

        tooltipsPopup.classList.add(
            "tooltip-right"
        );
    }
    else {

        tooltipsPopup.classList.remove(
            "tooltip-right"
        );

        tooltipsPopup.classList.add(
            "tooltip-left"
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
