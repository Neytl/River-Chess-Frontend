var tickRate = 200; // ms between ticks
var clockLeniency = 100; // amount of ms the clock is allowed to be desynced before forcing an update
var activeClockColor;
var tickTimeout;
var lastTickTime;
var whiteTimeRemaining = -100 - clockLeniency;
var blackTimeRemaining = -100 - clockLeniency;
var prepTimeRemaining = -100 - clockLeniency;

function clockUpdate(gameState) {
    // Stop the timeout and update the times
    clearTimeout(tickTimeout);
    tick();

    // Sync up the clocks
    if (gameState.whiteTimeRemaining < whiteTimeRemaining || gameState.whiteTimeRemaining - whiteTimeRemaining > clockLeniency) {
        whiteTimeRemaining = gameState.whiteTimeRemaining;
        prepTimeRemaining = gameState.prepTimeRemaining;
        setClock("white", whiteTimeRemaining, prepTimeRemaining);
    }
    else if (gameState.prepTimeRemaining < prepTimeRemaining || gameState.prepTimeRemaining - prepTimeRemaining > clockLeniency) {
        prepTimeRemaining = gameState.prepTimeRemaining;
        setClock("white", whiteTimeRemaining, prepTimeRemaining);
    }

    if (gameState.blackTimeRemaining < blackTimeRemaining || gameState.blackTimeRemaining - blackTimeRemaining > clockLeniency) {
        blackTimeRemaining = gameState.blackTimeRemaining;
        setClock("black", blackTimeRemaining);
    }

    // Clock stop
    if (!gameState.ticking) {
        let activeClock = getFirst(".chessClock.active");
        if (activeClock) activeClock.classList.remove("active");
        return;
    }

    // Continue clock
    startClock(gameState.isWhitesTurn ? "white" : "black");
}

function tick() {
    let now = Date.now();

    if (!lastTickTime) {
        lastTickTime = now;
        return;
    }

    let elapsedTime = now - lastTickTime;
    lastTickTime = now;

    // Calculate prep time
    if (prepTimeRemaining > 0) {
        if (elapsedTime > prepTimeRemaining) {
            elapsedTime -= prepTimeRemaining;
            prepTimeRemaining = 0;
        } else {
            prepTimeRemaining -= elapsedTime;
            elapsedTime = 0;
        }
    }

    // Update the time based on the active clock color
    if (activeClockColor == "white") {
        setClock(activeClockColor, whiteTimeRemaining - elapsedTime, prepTimeRemaining);
    } else {
        setClock(activeClockColor, blackTimeRemaining - elapsedTime, prepTimeRemaining);
    }
}

function setClock(color, timeLeft, prepTimeLeft) {
    if (timeLeft <= 0) {
        timeLeft = 0;
    }

    if (color === "white") {
        whiteTimeRemaining = timeLeft;
    } else {
        blackTimeRemaining = timeLeft;
    }

    // Calculate the player time
    let totalSeconds = Math.floor(timeLeft / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;

    if (seconds < 10) seconds = "0" + seconds;

    // Calculate the prep time if provided
    let prepTimeDisplay = "";
    if (prepTimeLeft !== undefined && prepTimeLeft > 0) {
        prepTimeRemaining = prepTimeLeft;
        let totalPrepSeconds = Math.floor(prepTimeLeft / 1000);
        prepTimeDisplay = " + " + totalPrepSeconds;
    }

    // Update the clock display
    get(color + "Clock").innerHTML = minutes + ":" + seconds + prepTimeDisplay;
}

function startClock(color) {
    activeClockColor = color;
    let activeClock = getFirst(".chessClock.active");
    if (activeClock) activeClock.classList.remove("active");
    get(color + "Clock").classList.add("active");
    startRepeatingTick();
}

function startRepeatingTick() {
    tickTimeout = setTimeout(repeatingTick, tickRate);
}

function repeatingTick() {
    tick();
    startRepeatingTick();
}

function flipClocks() {
    // Stop the timeout
    if (tickTimeout) clearTimeout(tickTimeout);

    // Flip the clocks
    var whiteClock = document.getElementById("whiteClock");
    whiteClock.id = ""; // Prevent duplicate id conflict
    document.getElementById("blackClock").id = "whiteClock";
    whiteClock.id = "blackClock";
    tick(); // Update the clocks

    // Start the clocks again
    if (currentState.ticking) startClock(currentState.isWhitesTurn ? "white" : "black");
}
