var tickRate = 200; // ms between ticks
var clockLeniency = 100; // amount of ms the clock is allowed to be desynced before forcing an update
var activeClockColor;
var tickTimeout;
var lastTickTime;
var whiteTimeRemaining = -100 - clockLeniency;
var blackTimeRemaining = -100 - clockLeniency;

function clockUpdate(gameState) {
    // Stop the timeout and update the times
    clearTimeout(tickTimeout);
    tick();

    // Sync up the clocks
    if (gameState.whiteTimeRemaining < whiteTimeRemaining || gameState.whiteTimeRemaining - whiteTimeRemaining > clockLeniency) {
        whiteTimeRemaining = gameState.whiteTimeRemaining;
        setClock("white", whiteTimeRemaining);
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

    if (activeClockColor == "white") {
        setClock(activeClockColor, whiteTimeRemaining - elapsedTime);
    } else {
        setClock(activeClockColor, blackTimeRemaining - elapsedTime);
    }
}

function setClock(color, timeLeft) {
    if (timeLeft <= 0) {
        timeLeft = 0;
    }

    if (color === "white") {
        whiteTimeRemaining = timeLeft;
    } else {
        blackTimeRemaining = timeLeft;
    }

    let totalSeconds = Math.floor(timeLeft / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;

    if (seconds < 10) seconds = "0" + seconds;

    get(color + "Clock").innerHTML = minutes + ":" + seconds;
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
