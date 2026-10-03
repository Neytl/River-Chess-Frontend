function onGameEnd() {
    console.log(currentState);
    resignButton.classList.add("hidden");
    drawOfferButton.style.opacity = "0";
    get("homeButton").classList.remove("hidden");

    let playerIsWhite = currentState.whitePlayerID == guestId;

    if (currentState.winner == "None") {
        // Draw
        get("gameOverTitle").innerHTML = "Game Drawn";
    } else if ((currentState.winner == "White") == playerIsWhite || currentState.winner == "Both") {
        // Win
        get("gameOverTitle").innerHTML = "You Won!";
    } else {
        // Loss
        get("gameOverTitle").innerHTML = currentState.winner + " Wins";
    }

    if (!!currentState.gameMode) {
        get("gameOverPopupGameModeIcon").src = `imgs/icons/${currentState.gameMode}.png`;
    }

    get("gameOverSubtitle").innerHTML = currentState.gameEndReason;
    get("timeControlDisplay").innerHTML = currentState.timeControl;

    let ratingIsNegative = false;

    if (playerIsWhite) {
        get("eloContainer").innerHTML = currentState.whitePlayerElo;
        ratingIsNegative = currentState.whitePlayerRatingChange < 0;
        get("eloChange").innerHTML = (ratingIsNegative ? "" : "+") + currentState.whitePlayerRatingChange;
    } else {
        get("eloContainer").innerHTML = currentState.blackPlayerElo;
        ratingIsNegative = currentState.blackPlayerRatingChange < 0;
        get("eloChange").innerHTML = (ratingIsNegative ? "" : "+") + currentState.blackPlayerRatingChange;
    }

    if (ratingIsNegative) {
        get("eloChange").classList.add("negative");
    }

    setTimeout(() => {
        get("gameOverPopupContainer").classList.remove("hidden");
    }, 1500);
}

// ******************************************
//  Load Run
// ******************************************

function afterLoadGuest() {
    // if (!runState) goHome();
    loadSession();
}

async function loadSession() {
    window.multiplayerClient.onGameStateUpdated(broadcast => {
        console.log(broadcast);
        displayStateAnimations(broadcast.snapshot.gameState);
    });

    try {
        const gameState =
            await window.multiplayerClient.connectToSession();

        // console.log(
        //     "Current GameStateEntity:"
        // );

        // console.log(gameState);

        flipped = (guestId != gameState.whitePlayerID);
        initializeChessBoard();
        displayNewState(gameState);
    }
    catch (error) {
        console.error(
            "Failed to connect to game session:",
            error
        );

        // goHome();
    }
}


// ******************************************
//  Page Buttons
// ******************************************

const resignButton = document.getElementById("resignButton");
resignButton.addEventListener("click", () => {
    if (!confirm(
        "Are you sure you want to resign?"
    )) return;
    
    window.multiplayerClient.sendAction("Resign", {});
});


const drawOfferButton = document.getElementById("drawOfferButton");
drawOfferButton.addEventListener("click", () => {
    let offeredDraw = drawOfferButton.classList.contains("offeredDraw");

    if (!confirm(
        offeredDraw ?
        "Are you sure you want to accept the draw offer?"
        : "Are you sure you want to offer a draw?"
    )) return;

    window.multiplayerClient.sendAction("DrawOffer", {});
});

get("closeGameOverPopupButton").addEventListener("click", () => {
    get("gameOverPopupContainer").classList.add("hidden");
});

get("gameOverPopupContainer").addEventListener("click", event => {
    if (!clickedOn(event, "gameOverPopup")) {
        get("gameOverPopupContainer").classList.add("hidden");
        window.multiplayerClient.leaveQueue();
    }
});

get("newGameButton").addEventListener("click", () => {
    if (get("newGameButton").classList.toggle("searching")) {
        window.multiplayerClient.joinQueue(currentState.gameMode, currentState.timeControl);
    } else {
        window.multiplayerClient.leaveQueue();
    }
});
