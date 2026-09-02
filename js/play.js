// ******************************************
//  Load Run
// ******************************************

function displayRunState() {
    if (!runState) goHome();
    loadSession();
}

async function loadSession() {
    multiplayerClient.onGameStateUpdated(broadcast => {
        console.log(broadcast.snapshot.gameState);
        displayStateAnimations(broadcast.snapshot.gameState);
    });

    try {
        const gameState =
            await window.multiplayerClient.connectToSession();

        console.log(
            "Current GameStateEntity:"
        );

        console.log(gameState);

        flipped = (guestId != gameState.whitePlayerID);
        initializeChessBoard();
        displayNewState(gameState);
    }
    catch (error) {
        console.error(
            "Failed to connect to game session:",
            error
        );

        goHome();
    }
}


// ******************************************
//  Page Buttons
// ******************************************

const resignButton = document.getElementById("resignButton");
resignButton.addEventListener("click", () => {
    const confirmed = confirm(
        "Are you sure you want to resign?"
    );

    if (!confirmed) {
        return;
    }

    window.multiplayerClient.sendAction("Resign", {});
});
