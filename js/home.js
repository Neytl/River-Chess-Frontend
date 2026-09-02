// ******************************************
//  Load Run
// ******************************************
const newRunContainer =
    get("newRunContainer");

const startNewRunButton =
    get("startNewRunButton");

const runInfo =
    get("runInfo");

function displayRunState() {
    if (runState) {
        get("newGamePanel")
            .classList.add("hidden");

        get("continueGamePanel")
            .classList.remove("hidden");

        get("currentRound")
            .textContent = runState.round;

        get("currentLives")
            .textContent = runState.lives;

        get("currentPoints")
            .textContent = runState.points;

        displayStones(runState.stones, get("stonesContainer"));
    }
    else {
        get("newGamePanel")
            .classList.remove("hidden");

        get("continueGamePanel")
            .classList.add("hidden");
    }
}


// ******************************************
//  Abandon Run
// ******************************************

const abandonRunButton =
    get("abandonRunButton");

if (abandonRunButton) {
    abandonRunButton.addEventListener("click", abandonRun);
}

async function abandonRun() {

    const confirmed = confirm(
        "Are you sure you want to abandon this run?\n\n" +
        "This cannot be undone."
    );

    if (!confirmed) {
        return;
    }

    const button = get("abandonRunButton");

    try {
        button.style.pointerEvents = "none";
        button.textContent = "Abandoning...";

        const response = await fetch(
            `/api/run-state/${encodeURIComponent(guestId)}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok && response.status !== 404) {
            throw new Error(
                `Failed to abandon run: ${response.status}`
            );
        }

        runState = null;

        document
            .getElementById("continueGamePanel")
            .classList.add("hidden");

        document
            .getElementById("newGamePanel")
            .classList.remove("hidden");
    }
    catch (error) {
        console.error("Error abandoning run:", error);

        alert(
            "Something went wrong while abandoning the run. " +
            "Please try again."
        );
    }
    finally {
        button.style.pointerEvents = "";
        button.textContent = "Abandon Run";
    }
}


// ******************************************
//  New Run
// ******************************************

const newGameButton = get("newGameButton");
newGameButton.addEventListener("click", createNewRun);

async function createNewRun() {
    const startingPoints =
        Number(get("startingPoints").value);

    try {
        newGameButton.textContent = "Starting...";
        newGameButton.style.pointerEvents = "none";

        const response = await fetch(
            `/api/run-state/${encodeURIComponent(guestId)}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    points: startingPoints
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to create new run: ${response.status}`
            );
        }

        runState = await response.json();

        // Go to the game page.
        window.location.href = "/theRiver";
    }
    catch (error) {
        console.error("Error creating new run:", error);

        alert(
            "Something went wrong while creating the new run. Please try again."
        );

        newGameButton.textContent = "New Game";
        newGameButton.style.pointerEvents = "";
    }
}
