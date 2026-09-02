// ******************************************
//  Load Run
// ******************************************

function displayRunState() {
    "use strict";
    if (!runState) goHome();

    const roundDisplay = get("roundDisplay");
    const livesContainer = get("livesContainer");

    const shopStonesContainer = get("shopStones");
    const playerStonesContainer = get("stonesContainer");

    const nextGameButton = get("nextGameButton");
    const rerollButton = get("rerollButton");
    const rewindsDisplay = get("rewinds");

    let activeStone = null;


    /* =========================
       PAGE INITIALIZATION
    ========================= */

    async function initialize() {

        // Wait until guest.js has finished restoring/creating the guest.
        // await window.guestReady;

        // If your runState.js already has a function that loads the run,
        // call it here.
        // await loadCurrentRun();

        renderRiver();
    }


    async function loadCurrentRun() {

        const response = await fetch(apiUrl + 
            `/api/run-state/${guestId}`
        );

        if (!response.ok) {
            console.error("Failed to load run state.");

            return;
        }

        runState = await response.json();
    }


    /* =========================
       RENDER ENTIRE PAGE
    ========================= */

    function renderRiver() {
        if (!runState) {
            return;
        }

        renderRunInfo();
        displayStones(runState.shop, get("shopStones"), { buyable: true });
        renderPoints();
        displayStones(runState.stones, get("stonesContainer"), { sellable: true });
    }


    /* =========================
       ROUND / LIVES
    ========================= */

    function renderRunInfo() {
        roundDisplay.textContent =
            `Round ${runState.round}`;

        livesContainer.innerHTML = "";

        for (let i = 0; i < runState.lives; i++) {

            const heart = document.createElement("span");

            heart.className = "heart";

            heart.textContent = "♥";

            livesContainer.appendChild(heart);
        }

        rewindsDisplay.innerHTML = runState.rewinds;
    }


    /* =========================
       SHOP BUTTONS
    ========================= */

    nextGameButton.addEventListener(
        "click",
        () => {
            nextGame();
        }
    );


    rerollButton.addEventListener(
        "click",
        () => {
            rerollShop();
        }
    );


    async function nextGame() {
        nextGameButton.style.pointerEvents = "none";

        try {
            console.log("Connected to multiplayer server.");
            await window.multiplayerClient.joinQueue();
        }
        catch (error) {
            console.error("Failed to start multiplayer:", error);
            nextGameButton.style.pointerEvents = "";
        }
    }

    async function rerollShop() {
        if (runState.rewinds == 0) {
            shakeElement(get("rerollButton"));
            return;
        }

        rerollButton.style.pointerEvents = "none";

        // Send request to the server
        const response =
            await fetch(apiUrl + 
                `/api/run-state/${guestId}/rerollShop`,
                {
                    method: "POST"
                }
            );

        rerollButton.style.pointerEvents = "";

        if (!response.ok) {
            throw new Error(
                "Failed to buy stone."
            );
        }

        runState = await response.json();
        get("rewinds").innerHTML = runState.rewinds;
        displayStones(runState.shop, get("shopStones"), { buyable: true });
    }


    /* =========================
       START
    ========================= */

    initialize()
        .catch(error => {

            console.error(
                "Failed to initialize The River:",
                error
            );
        });

}

/* =========================
   POINT DICE
========================= */
const pointsDiceContainer = get("pointsDice");

function renderPoints() {

    pointsDiceContainer.innerHTML = "";

    let remainingPoints =
        runState.points;

    if (remainingPoints == 0) {
        pointsDiceContainer.appendChild(createDie(0));
        return;
    }

    while (remainingPoints > 0) {

        const dieValue =
            Math.min(
                remainingPoints,
                5
            );

        const die =
            createDie(dieValue);

        pointsDiceContainer
            .appendChild(die);

        remainingPoints -=
            dieValue;
    }
}


function createDie(value) {

    const die =
        document.createElement("div");

    die.className = "die";


    const patterns = {
        0: [
            0, 0, 0,
            0, 0, 0,
            0, 0, 0
        ],

        1: [
            0, 0, 0,
            0, 1, 0,
            0, 0, 0
        ],

        2: [
            1, 0, 0,
            0, 0, 0,
            0, 0, 1
        ],

        3: [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ],

        4: [
            1, 0, 1,
            0, 0, 0,
            1, 0, 1
        ],

        5: [
            1, 0, 1,
            0, 1, 0,
            1, 0, 1
        ]
    };


    const pattern =
        patterns[value];


    pattern.forEach(
        hasPip => {

            const pip =
                document.createElement("div");

            pip.className =
                hasPip
                    ? "pip"
                    : "pip empty";

            die.appendChild(pip);
        }
    );

    if (value == 0) die.classList.add("no-points");

    return die;
}


/* =========================
   BUY STONE
========================= */

async function buyStone(stone, stoneElement) {
    let valid = true;

    if (runState.points < stone.points) {
        shakeDie();
        valid = false;
    }

    if (runState.stones.length == 5) {
        shakePlayerStones();
        valid = false;
    }

    if (!valid) return;

    // Update the UI
    stoneElement.classList.add("stone-purchased");
    get("stonesContainer").appendChild(createStoneElement(stone, { sellable: true }));    
    runState.points -= stone.points;
    renderPoints();
    runState.stones.push({});

    // Send request to the server
    const response =
        await fetch(apiUrl + 
            `/api/run-state/${guestId}/buyStone`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify(stone.name)
            }
        );

    if (!response.ok) {
        throw new Error(
            "Failed to buy stone."
        );

        location.reload();
    }
}

function shakeDie() {
    let elements = Array.from(document.querySelectorAll(".die"));
    elements.push(document.querySelector(".points-label"));
    shakeElements(elements);
}

function shakePlayerStones() {
    let elements = Array.from(document.querySelectorAll("#stonesContainer .stone-wrapper"));
    shakeElements(elements);
}

function shakeElement(element) {
    shakeElements([element]);
}

function shakeElements(elements) {
    // Remove the animation first so it can be triggered
    // repeatedly, even if the player clicks quickly.
    elements.forEach(element => {
        element.classList.remove(
            "shake-animation"
        );
    });

    // Force the browser to recognize the removal before
    // adding the class again.
    elements.forEach(element => {
        element.classList.add(
            "shake-animation"
        );
    });

    // Clean up after the animation finishes.
    setTimeout(() => {
        elements.forEach(element => {
            element.classList.remove(
                "shake-animation"
            );
        });

    }, 550);
}


/* =========================
   SELL STONE
========================= */

async function sellStone(stone, stoneElement) {
    // Update the UI
    stoneElement.parentElement.removeChild(stoneElement);
    runState.points += stone.points;
    renderPoints();
    runState.stones.pop();

    // Send request to the server
    const response =
        await fetch(apiUrl + 
            `/api/run-state/${guestId}/sellStone`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify(stone.name)
            }
        );

    if (!response.ok) {
        throw new Error(
            "Failed to sell stone."
        );

        location.reload();
    }
}
