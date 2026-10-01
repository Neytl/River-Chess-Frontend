// ******************************************
//  Variables
// ******************************************

// Constants
const EMPTY = 0;
const NONE = [-99, -99];

// Global Variables
var boardElement;
var chessGameElement;
var currentBoard = [];
var currentState = null;
var whitesTurn = true;
var pickedPiece = [-99, -99];
var isYourTurn = false;

// State Variables
var flipped = false;
var autoFlipBoard = false;
var done = false;

// Elements
var mainUrl = "/api/Chess/";
var boardWidth = 0;
var boardHeight = 0;

// ******************************************
//  Initialize Chess Board
// ******************************************

function initializeChessBoard() {
    // Build the board
    get("chessContainer").appendChild(generateChessElements());

    // Setup Events
    document.onmousedown = function (event) {
        if (!clickedOn(event, "boardDiv") && !clickedOnClass(event, "launchable")) { // Clicked off the board
            unPickPiece();
            hideLegalMoves();
        }
    }

    // Key events
    document.addEventListener("keyup", function (e) {
        switch (e.key) {
            case "f":
                flipBoard();
                break;
            case "Escape":
                unPickPiece();
                hideLegalMoves();
                break;
        }
    });
}

function generateChessElements() {
    chessGameElement = make("div");
    chessGameElement.id = "chessElement";

    // Message
    let messageElement = make("div");
    messageElement.id = "message";
    messageElement.classList.add("spaceBelow");
    chessGameElement.appendChild(messageElement);

    // Top Clock Container
    let chessClock1 = make("div");
    chessClock1.classList.add("chessClockContainer");
    chessGameElement.appendChild(chessClock1);

    // Board container
    let boardContainer = make("div");
    boardContainer.id = "boardContainer";
    boardContainer.classList.add("shrink");

    // Rank and file
    let fileDiv = make("div");
    fileDiv.id = "file";
    let rankDiv = make("div");
    rankDiv.id = "rank";
    boardContainer.appendChild(fileDiv);
    boardContainer.appendChild(rankDiv);

    // Board
    boardElement = make("div");
    boardElement.id = "boardDiv";
    boardContainer.appendChild(boardElement);

    // Wrapper for board
    let centerWrapper = make("div");
    centerWrapper.classList.add("center");
    centerWrapper.appendChild(boardContainer)
    chessGameElement.appendChild(centerWrapper);

    // Graveyards
    let graveyardDiv = make("div");
    graveyardDiv.id = "GY";
    let whiteGY = make("div");
    whiteGY.id = "WhiteGY";
    let blackGY = make("div");
    blackGY.id = "BlackGY";
    graveyardDiv.appendChild(whiteGY);
    graveyardDiv.appendChild(blackGY);
    boardContainer.appendChild(graveyardDiv);

    // Bottom Clock Container
    let chessClock2 = make("div");
    chessClock2.classList.add("chessClockContainer");
    chessGameElement.appendChild(chessClock2);

    // Clocks    
    let blackClock = make("div");
    blackClock.id = "blackClock";
    blackClock.classList.add("chessClock");

    let whiteClock = make("div");
    whiteClock.id = "whiteClock";
    whiteClock.classList.add("chessClock");

    if (!flipped) {
        chessClock1.appendChild(blackClock);
        chessClock2.appendChild(whiteClock);
    } else {
        chessClock2.appendChild(blackClock);
        chessClock1.appendChild(whiteClock);
        boardContainer.classList.add("flippedBoard");
    }

    chessClock1.classList.add("hidden");
    chessClock2.classList.add("hidden");


    // Choices
    chessGameElement.appendChild(build({
        type: "div",
        class: "center",
        child: build({
            type: "div",
            id: "choicesContainer",
            class: "hidden",
            children: [
                build({
                    type: "span",
                    id: "choiceTitle"
                }),
                build({
                    type: "div",
                    id: "choices"
                })
            ]
        })
    }));

    // Secondary Message
    chessGameElement.appendChild(build({
        type: "div",
        id: "secondaryMessage"
    }));

    return chessGameElement;
}



// ******************************************
//  Utitlity Functions
// ******************************************

function removeAll(selector) {
    getAll(selector).forEach(element => element.parentNode.removeChild(element));
}

function removeAllClass(className) {
    let elements = document.getElementsByClassName(className);
    let l = elements.length;
    for (let i = 0; i < l; i++) {
        elements[0].parentNode.removeChild(elements[0]);
    }
}

function getSquareElement(row, col) {
    return boardElement.childNodes[row * numCols() + col];
}

function getSquareStyles(row, col) {
    return boardElement.childNodes[row * numCols() + col].classList;
}

function remove(element) {
    if (!!element) {
        element.parentNode.removeChild(element);
    }
}

function setupChosenGroup(selector, callback) {
    getAll(selector).forEach(element => {
        element.addEventListener("click", function () {
            if (element.classList.contains("chosen")) {
                return;
            }

            let selected = getFirst(selector + ".chosen");
            if (!!selected) {
                selected.classList.remove("chosen");
            }

            element.classList.add("chosen");
            callback(element);
        });
    });
}



// Creates an element of the specified type
function make(elementType) {
    return document.createElement(elementType);
}

function makeDiv(text) {
    let div = make("div");
    div.innerHTML = text;
    return div;
}

// Builds and returns an element
function build(properties) {
    let element = document.createElement(properties.type);

    if (!!properties.class) {
        element.classList.add(properties.class);
    } else if (!!properties.classes) {
        properties.classes.forEach(elementClass => element.classList.add(elementClass));
    }

    if (!!properties.id) {
        element.id = properties.id;
    }

    if (!!properties.title) {
        element.title = properties.title;
    }

    if (!!properties.innerHTML) {
        element.innerHTML = properties.innerHTML;
    }

    if (!!properties.value) {
        element.value = properties.value;
    }

    if (!!properties.child) {
        element.appendChild(properties.child);
    } else if (!!properties.children) {
        properties.children.forEach(child => element.appendChild(child));
    }

    if (!!properties.onclick) {
        element.addEventListener("click", properties.onclick);
    }

    return element;
}

// Requires icon filename as 'src'
function buildImage(properties) {
    properties.type = "img";
    let img = build(properties);

    img.src = "imgs/icons/" + properties.src;

    if (!!properties.alt) {
        img.alt = properties.alt;
    } else {
        img.alt = properties.src.split('.')[0];
    }

    return img;
}

// Require full 'src'
function buildBasicImage(properties) {
    properties.type = "img";
    let img = build(properties);
    img.src = properties.src;
    return img;
}

// Builds a dropdown option element
function buildDropdownOption(imgSrc, text, onSelect) {
    let content = [];

    if (!!imgSrc) {
        content.push(
            buildBasicImage({
                src: imgSrc
            })
        );
    }

    content.push(
        build({
            type: "span",
            innerHTML: text
        })
    );

    return build({
        type: "div",
        class: "dropdownOption",
        onclick: onSelect,
        children: content
    });
}

// Builds and displays a dropdown
function buildDropdown(event, optionElements) {
    let dropdown = build({
        type: "div",
        classes: ["popup", "dropdown"],
        children: optionElements
    });

    // Destroying the dropdown
    let selfDestruct = function () {
        if (document.body.contains(dropdown)) {
            document.body.removeChild(dropdown);
        }
    };

    dropdown.addEventListener("mouseleave", selfDestruct);
    dropdown.addEventListener("click", selfDestruct);
    document.addEventListener("scroll", function handler(event) {
        // Listener removed after first triger
        event.currentTarget.removeEventListener(event.type, handler);
        selfDestruct();
    });

    // Dropdown position
    dropdown.style.right = (document.documentElement.clientWidth - window.pageXOffset - event.clientX - 10) + "px";
    dropdown.style.top = (event.clientY + window.pageYOffset - 10) + "px";
    document.body.appendChild(dropdown);
}

// Builds and displays a popup
function buildPopup(event, content) {
    let popup = build({
        type: "div",
        class: "popup",
        child: content
    });

    // Destroying the popup
    let selfDestruct = function () {
        if (document.body.contains(popup)) {
            document.body.removeChild(popup);
        }
    };

    popup.addEventListener("mouseleave", selfDestruct);
    document.addEventListener("scroll", function handler(event) {
        // Listener removed after first triger
        event.currentTarget.removeEventListener(event.type, handler);
        selfDestruct();
    });

    // Popup position
    popup.style.left = (event.clientX + window.pageXOffset - 10) + "px";
    popup.style.top = (event.clientY + window.pageYOffset - 10) + "px";
    document.body.appendChild(popup);
}

var toolTipElements = [];
function buildToolTips(popup, toolTips) {
    if (!toolTips) return;
    var toolTipStart = popup.getBoundingClientRect().top;

    toolTips.forEach(toolTip => {
        let toolTipElement = build({
            type: "div",
            classes: ["popup", "keepsakePopup", "toolTip"],
            innerHTML: toolTip
        });

        // Popup position
        toolTipElement.style.left = (popup.getBoundingClientRect().right + 5) + "px";
        toolTipElement.style.top = (toolTipStart) + "px";

        document.body.appendChild(toolTipElement);
        toolTipElements.push(toolTipElement);

        toolTipStart = toolTipElement.getBoundingClientRect().bottom + 5;
    });

}

function destroyToolTips() {
    toolTipElements.forEach(toolTip => {
        document.body.removeChild(toolTip);
    });

    toolTipElements = [];
}

// Returns an array of all elements of the specified class
function getAllClass(className) {
    return Array.from(document.getElementsByClassName(className));
}

// Removes all children from an html element
function removeChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

// Applies a function to all elements of a certain class
function forEachClassElement(className, callback) {
    getAllClass(className).forEach(element => {
        callback(element);
    });
}

// Applies a function to all elements of a certain class
function forEachElement(selector, callback) {
    Array.from(document.querySelectorAll(selector)).forEach(function (element) {
        callback(element);
    });
}





//-----------------------------
// Overlay
//-----------------------------

function buildOverlayElement(row, col, type, body) {
    let gameObjWrapper = make("div");
    gameObjWrapper.classList.add("gameObject");
    gameObjWrapper.classList.add(type);
    gameObjWrapper.id = row + "-" + col + "-" + type;
    gameObjWrapper.style.left = (col * 100 / numCols()) + "%";
    gameObjWrapper.style.top = (row * 100 / numRows()) + "%";

    if (!!body) {
        gameObjWrapper.appendChild(body);
    }

    return gameObjWrapper;
}

function buildOverlaySquareElement(row, col, type) {
    return buildOverlayElement(row, col, type, null);
}

function buildOverlaySquare(row, col, type) {
    return buildOverlay(row, col, type, null);
}

function buildSquareHighlight(row, col, type) {
    let result = buildOverlaySquare(row, col, type);
    result.classList.add("squareHighlight");
    return result;
}

function buildOverlay(row, col, type, body) {
    let overlay = buildOverlayElement(row, col, type, body);
    boardElement.appendChild(overlay);
    return overlay;
}

//-----------------------------
// Choices
//-----------------------------
var makingAChoice = false;

function setupChoice(choice, isWhitesChoice) {
    makingAChoice = true;
    get("boardDiv").classList.add("makingAChoice");
    get("choiceTitle").innerHTML = choice.title;
    get("choices").innerHTML = "";

    choice.options.forEach(option => {
        if (option.isKeepsake) {
            get("choices").appendChild(build({
                type: "div",
                class: "option",
                title: option.keepsake.ruleDescription,
                onclick: function () {
                    makeChoice(option.title);
                },
                children: [
                    build({
                        type: "span",
                        innerHTML: option.title
                    }),
                    createStoneElement(option.keepsake),
                ]
            }));
        } else if (choice.title == "Choose a Party") {
            let partyContent = [];
            option.partyChoice.pieces.forEach(piece => {
                partyContent.push(buildPieceImageForDisplay(piece));
            });
            partyContent.push(buildKeepsake(option.partyChoice.keepsake));

            get("choices").appendChild(build({
                type: "div",
                class: "option",
                title: option.partyChoice.description,
                onclick: function () {
                    makeChoice(option.title);
                },
                children: [
                    build({
                        type: "span",
                        innerHTML: option.title
                    }),
                    build({
                        type: "div",
                        children: partyContent
                    })
                ]
            }));
        }
    });

    if (isWhitesChoice) {
        get("choicesContainer").classList.remove("blacksChoice");
    } else {
        get("choicesContainer").classList.add("blacksChoice");
    }

    get("choicesContainer").classList.remove("hidden");
}

function clearChoice() {
    makingAChoice = false;
    get("boardDiv").classList.remove("makingAChoice");
    get("choicesContainer").classList.add("hidden");
    get("choiceTitle").innerHTML = "";
    get("choices").innerHTML = "";
}

function makeChoice(optionTitle) {
    let Move = {
        Type: "MakeChoice",
        SelectedOption: optionTitle
    };

    fetch(apiUrl + mainUrl + "makeMove",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(Move)
        }
    ).then(response => response.json()).then(responseJson => {
        clearChoice();
        displayStateAnimations(responseJson);
    });
}

//-----------------------------
// Pieces
//-----------------------------

function drawPieces(pieces) {
    removeAllClass("piece");
    pieces.forEach(piece => buildPiece(piece));
}

function getPieceSrcByData(pieceColor, pieceType) {
    return getPieceSrc({
        color: pieceColor,
        type: pieceType
    });
}

function getPieceSrc(piece) {
    let directory = "./imgs/pieces/"/* + "Pixel_Pieces/"*/;

    if (piece.color == "Black") {
        directory += "black_";
    } else {
        directory += "white_";
    }

    switch (piece.type) {
        case "Pawn":
            return directory + "pawn.png"
        case "Knight":
            return directory + "knight.png"
        case "Bishop":
            return directory + "bishop.png"
        case "Rook":
            return directory + "rook.png"
        case "Queen":
            return directory + "queen.png"
        case "King":
            return directory + "king.png"
        case "Guard":
            return directory + "pawn.png"
        case "Fairy":
            return directory + "fairy.png"
        case "TheFairyKing":
            return directory + "fairy_king.png"
        case "ThePrincess":
            return directory + "princess.png"
        case "TheChampion":
            return directory + "champion.png"
        case "TheRanger":
            return directory + "ranger.png"
        case "ElPanadero":
            return directory + "panadero.png"
        case "TheHero":
            return directory + "hero.png"
        case "TheScout":
            return directory + "scout.png"
        case "Medusa":
            return directory + "medusa.png"
        default:
            return "./imgs/icons/unknown.png";
    }
}

function buildPiece(piece) {
    if (!piece) return;
    let pieceImg = make("img");
    pieceImg.src = getPieceSrc(piece);
    pieceImg.classList.add("pieceImg");
    pieceImg.classList.add(piece.color);
    let pieceContainer = buildDragableOverlay(piece.row, piece.column, "piece", pieceImg);
    checkForTraits(piece, pieceContainer);
}


function buildPieceImageForDisplay(piece) {
    if (!piece) return;
    let pieceImg = make("img");
    pieceImg.src = getPieceSrc(piece);
    pieceImg.classList.add("pieceImg");
    pieceImg.classList.add(piece.color);
    return pieceImg;
}

function getPieceImg(row, col) {
    return get(row + "-" + col + "-piece");
}

/// Move with animation
function moveImg(row1, col1, row2, col2, dontUpdateID) {
    let movingPiece = getPieceImg(row1, col1);
    if (!dontUpdateID) movingPiece.id = row2 + "-" + col2 + "-piece";
    movingPiece.style.left = (col2 * 100 / numCols()) + "%";
    movingPiece.style.top = (row2 * 100 / numRows()) + "%";
}

/// Move without animation
function hardMoveImg(row1, col1, row2, col2, dontUpdateID) {
    let movingPiece = getPieceImg(row1, col1);

    movingPiece.style.transition = "none";
    if (!dontUpdateID) movingPiece.id = row2 + "-" + col2 + "-piece";
    movingPiece.style.left = (col2 * 100 / numCols()) + "%";
    movingPiece.style.top = (row2 * 100 / numRows()) + "%";
    movingPiece.offsetHeight;
    movingPiece.style.transition = "";
}

function swapPieces(row1, col1, row2, col2) {
    let movingPiece = getPieceImg(row1, col1);
    swappedPiece = getPieceImg(row2, col2);

    // Hard move
    // if (!isEmpty(dragStart) && row1 == dragStart[0] && col1 == dragStart[1]) {
    //     movingPiece.style.transition = "none";
    //     movingPiece.id = row2 + "-" + col2 + "-piece";
    //     movingPiece.style.left = (col2 * 100 / numCols()) + "%";
    //     movingPiece.style.top = (row2 * 100 / numRows()) + "%";
    //     movingPiece.offsetHeight;
    //     movingPiece.style.transition = ".5s";
    // } else {
        movingPiece.id = row2 + "-" + col2 + "-piece";
        movingPiece.style.left = (col2 * 100 / numCols()) + "%";
        movingPiece.style.top = (row2 * 100 / numRows()) + "%";
    // }


    swappedPiece.id = row1 + "-" + col1 + "-piece";
    swappedPiece.style.left = (col1 * 100 / numCols()) + "%";
    swappedPiece.style.top = (row1 * 100 / numRows()) + "%";
}

function putPiece(pieceChoice, row, col) {
    deleteImg(row, col);
    buildPiece(pieceChoice);
}

function deleteImg(row, col) {
    remove(getPieceImg(row, col));
}

function flipPieceAt(square) {
    let flippingPiece = getPieceImg(square.row, square.column);

    if (!!flippingPiece) {
        flippingPiece.classList.toggle("flipped");
    }
}

function checkForTraits(pieceData, pieceImg) {
    if (pieceData.traits == null || pieceData.traits.length == 0) return;

    // Add the indicator
    let hasPositive = false;
    let hasNegative = false;
    let toolTips = [];

    pieceData.traits.forEach(trait => {
        if (trait.isPositive) hasPositive = true;
        else if (trait.isNegative) hasNegative = true;

        toolTips.push("<div><strong>" + trait.name + "</strong></div>" + trait.description);
    });

    let color = "gray";
    if (hasPositive && !hasNegative) color = "green"
    if (hasNegative && !hasPositive) color = "red";

    let tratisIndicator = build({
        type: "div",
        class: "indicator",
        child: build({
            type: "div",
            classes: ["trait", color],
        })
    });

    pieceImg.appendChild(tratisIndicator);

    // Add the popups
    tratisIndicator.addEventListener("mouseenter", function (event) {
        buildToolTips(pieceImg, toolTips);
    });

    tratisIndicator.addEventListener("mouseleave", function (event) {
        destroyToolTips();
    });

}

//-----------------------------
// Graveyard
//-----------------------------

function addToGraveyard(piece) {
    let pieceImg = buildPieceImageForDisplay(piece);
    pieceImg.classList.add("GYpiece");
    pieceImg.classList.add("pieceImg");
    pieceImg.dataset.color = piece.color;
    pieceImg.dataset.type = piece.type;
    get(piece.color + "GY").appendChild(pieceImg);
}

function drawGraveyard(graveyard) {
    removeAllClass("GYpiece");
    graveyard.forEach(piece => addToGraveyard(piece));
}

//-----------------------------
// Tokens
//-----------------------------

function drawTokens(tokens) {
    removeAllClass("token");
    tokens.forEach(piece => buildToken(piece));
}

function buildToken(token) {
    if (token.type === "Keepsake") {
        buildOverlay(token.row, token.column, "token", buildSimpleKeepsake(token.tokenStringData));
        return;
    }

    if (token.type === "Void") {
        //let overlay = buildOverlay(token.row, token.column, "token", null);
        //overlay.classList.add("voidToken");

        getSquareElement(token.row, token.column).classList.add("void");
        return;
    }

    let tokenImg = make("img");
    tokenImg.src = getTokenSrc(token.type);

    if (token.facing != -1) {
        tokenImg.style.transform = "rotate(" + (token.facing * 45) + "deg)";
    }

    buildOverlay(token.row, token.column, "token", tokenImg);
}

function getTokenSrc(type) {
    let directory = "./imgs/tokens/";

    switch (type) {
        case "Lava":
        case "Ice":
            return directory + type + ".jpg";
        case "Barrel":
        case "Ducky":
            return directory + type + ".webp";
        default:
            return directory + type + ".png";
    }
}

function getTokenAt(row, col) {
    return get(row + "-" + col + "-token");
}

function deleteToken(row, col) {
    remove(getTokenAt(row, col));
}

function moveToken(row1, col1, row2, col2) {
    deleteToken(row2, col2);
    let movingToken = getTokenAt(row1, col1);
    movingToken.id = row2 + "-" + col2 + "-token";
    movingToken.style.left = (col2 * 100 / numCols()) + "%";
    movingToken.style.top = (row2 * 100 / numRows()) + "%";
}

//-----------------------------
// Animations
//-----------------------------

function executeAnimations(gameState) {
    executeAnimationsFromPoint(gameState, 0);
}

function executeAnimationsFromPoint(gameState, point) {
    let animations = gameState.animations;
    let keepsakesUpdated = false;

    for (let i = point; i < animations.length; i++) {
        let animation = animations[i];

        switch (animation.type) {
            case "Checked":
                buildIndication("Checked.png", animation.from, "checked");
                break;
            case "CPUThinking":
                buildIndication("CPUThinking.png", animation.from, "thinking");
                break;
            case "CPUDoneThinking":
                remove(get("thinking"));
                break;
            case "Move":
                // Hard move
                if (!!dragRequest && dragRequest.row == animation.from.row && dragRequest.column == animation.from.column) {
                    hardMoveImg(animation.from.row, animation.from.column, animation.to.row, animation.to.column);
                    break;
                }

                // Click move
                moveImg(animation.from.row, animation.from.column, animation.to.row, animation.to.column);
                break;
            case "Remove":
                addToGraveyard(animation.pieceChoice);
                deleteImg(animation.from.row, animation.from.column);
                break;
            case "Wait":
                setTimeout(function () {
                    executeAnimationsFromPoint(gameState, i + 1);
                }, animation.animationTime * 1000);
                return;
            case "Obliderate":
                deleteImg(animation.from.row, animation.from.column);
                break;
            case "RemoveToken":
                deleteToken(animation.from.row, animation.from.column);
                break;
            case "PutToken":
                deleteToken(animation.from.row, animation.from.column);
                buildToken(animation.tokenChoice);
                break;
            case "Replace":
                putPiece(animation.pieceChoice, animation.from.row, animation.from.column);
                break;
            case "Swap":
                swapPieces(animation.from.row, animation.from.column, animation.to.row, animation.to.column);
                break;
            case "Flip":
                flipPieceAt(animation.from);
                break;
            case "MoveToken":
                moveToken(animation.from.row, animation.from.column, animation.to.row, animation.to.column);
                break;
            case "Promote":
                setTimeout(function () {
                    putPiece(animation.pieceChoice, animation.from.row, animation.from.column);
                }, 500);
                break;
            case "Convert":
                putPiece(animation.pieceChoice, animation.from.row, animation.from.column);
                break;
            case "PlaySound":
                playSound(animation.soundType);
                break;
            case "Place":
                buildPiece(animation.pieceChoice);
                break;
            case "Explosion":
                let explosion = buildSquareHighlight(animation.from.row, animation.from.column, "explode");
                setTimeout(() => { remove(explosion); }, 500);
                break;
            case "PutPiece":
                buildDraggablePiece();
                break;
            case "RemoveFromGraveyard":
                let piece = animation.pieceChoice;
                let graveyardPieces = get(piece.color + "GY").children;
                for (let i = graveyardPieces.length - 1; i >= 0; i--) {
                    let element = graveyardPieces[i];
                    if (element.dataset.color == piece.color && element.dataset.type == piece.type) {
                        remove(element);
                        break;
                    }
                };
                break;
            case "AddKeepsake":
                if (keepsakesUpdated) break;

                // TODO: implement this
                displayRules(gameState);
                keepsakesUpdated = true;

                break;
            case "KeepsakesChange":
                if (keepsakesUpdated) break;
                displayRules(gameState); // TODO: implement this with passed rules
                keepsakesUpdated = true;
                break;
            case "HardLoad":
                drawStateBoard(gameState);
                displayRules(gameState);
                i = animations.length; // Skip to the end of the animations
                i = animations.length;
                break;
        }
    }

    // After animations
    // Flip the board and CPU turn    
    if (!gameState.finished) {
        if (autoFlipBoard && gameState.isWhitesTurn === flipped) {
            setTimeout(flipBoard, 700);
        }
    }

    dragRequest = false;
}

function playSound(type) {
    if (muted) {
        return;
    }

    let directory = "./sounds/"

    switch (type) {
        case "Place":
            directory += "move.mp3";
            break;
        case "Move":
            directory += "move.mp3";
            break;
        case "Capture":
            directory += "capture.mp3";
            break;
        case "Invoke":
            directory += "invoke.wav";
            break;
        case "Promote":
            directory += "promote.wav";
            return;
        case "Check":
            directory += "check.mp3";
            break;
        case "Finished":
            directory += "finished.mp3";
            break;
        case "IllegalMove":
            directory += "illegal.mp3";
            return;
        default:
            return;
    }

    new Audio(directory).play();
}

function buildIndication(imageFile, square, id) {
    let img = document.createElement("img");
    img.src = "imgs/icons/" + imageFile
    img.classList.add("pieceIndicator");
    if (!!id) img.id = id;
    get(square.row + "-" + square.column + "-piece").appendChild(img);
}

function flashElement(element) {
    element.classList.add('flash-white');
    setTimeout(function () {
        element.classList.remove('flash-white');
    }, 500)
}


//-----------------------------
// States
//-----------------------------

// TODO: Remove
// var turnsSinceACapture = 0;
// var turnsTaken = 0;
var currentMessage = "";

function displayNewState(gameState) {
    if (!!gameState.noChanges) return;
    displayState(gameState);
}

// Only display the animations of changed items
function displayStateAnimations(gameState) {
    if (!!gameState.noChanges) return;
    displayStateCommom(gameState);
    executeAnimations(gameState);
}

// Hard set everything for the state
function displayState(gameState) {
    // Draw a resized board
    let gameBoard = gameState.board;
    if (gameBoard.range.rows != numRows() || gameBoard.range.columns != numCols()) {
        boardHeight = gameBoard.range.rows;
        boardWidth = gameBoard.range.columns;
        createBoard();
    }

    displayStateCommom(gameState);
    drawStateBoard(gameState);
    displayRules(gameState);
}

function displayStateCommom(gameState) {
    whitesTurn = gameState.isWhitesTurn;
    clearSecondaryMessage();
    remove(get("checked"));
    currentMessage = gameState.stateDescription;
    printMessage(gameState.stateDescription);
    unPickPiece();

    if (flipped) flipGameState(gameState);
    currentBoard = gameState.board;
    currentState = gameState;
    loadInLegalMoves(gameState.legalMoves);
    isYourTurn = (gameState.isWhitesTurn ? gameState.whitePlayerID : gameState.blackPlayerID) == guestId;
    highlightPreviousMove(gameState.previousMove);

    if (gameState.ticking) {
        get("whiteClock").parentElement.classList.remove("hidden");
        get("blackClock").parentElement.classList.remove("hidden");
        clockUpdate(gameState);
    }

    // TODO - implement rewinds
    //get("whiteRewinds").innerHTML = gameState.whiteRewinds;
    //get("blackRewinds").innerHTML = gameState.blackRewinds;

    if (!gameState.finished) {
        if (gameState.makingChoice) {
            setupChoice(gameState.choiceToMake, gameState.isWhitesTurn);
        } else {
            clearChoice();
        }

        choosingSquare = gameState.choosingSquare;
        if (choosingSquare) {
            boardElement.classList.add("choosingSquare");
            seeLegalSquares();
        } else {
            boardElement.classList.remove("choosingSquare");
        }
    } else {
        onGameEnd();
    }
}


//-----------------------------
// Board
//-----------------------------

function drawBoard(gameBoard) {
    boardHeight = gameBoard.range.rows;
    boardWidth = gameBoard.range.columns;
    createBoard();
    drawBoardItems(gameBoard);
}

function drawBoardItems(gameBoard) {
    // Draw pieces and tokens
    drawPieces(gameBoard.pieces);
    drawTokens(gameBoard.tokens);
    drawGraveyard(gameBoard.graveyard);
}

function drawStateBoard(gameState) {
    drawBoard(gameState.board);
    highlightPreviousMove(gameState.previousMove);
}

function numCols() {
    return boardWidth;
}

function numRows() {
    return boardHeight;
}

function getPieceAt(row, col) {
    for (let i = currentBoard.pieces.length - 1; i >= 0; i--) {
        let piece = currentBoard.pieces[i];

        if (piece.row == row && piece.column == col) {
            return piece;
        }
    }

    return null;
}

function createBoard() {
    createSizedBoard(boardWidth, boardHeight);
}

function removeAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function createSizedBoard(width, height) {
    removeAllChildren(boardElement);
    boardElement.style = "grid-template-columns: repeat(" + width + ", 1fr)";

    // Build Squares
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            let square = make("div");
            square.id = i * width + j;
            square.classList.add("square");

            square.addEventListener('click', (function (row, col) {
                return function () {
                    clickedSquare(row, col);
                }
            })(i, j));

            if ((!flipped && ((i + j) % 2 == 0)) || (flipped && ((height - i + width - j - 2) % 2 == 0))) {
                square.classList.add("light");
            } else {
                square.classList.add("dark");
            }

            boardElement.appendChild(square);
        }
    }

    // Rank and File indicators
    fileDiv = get("file");
    rankDiv = get("rank");
    fileDiv.innerHTML = "";
    rankDiv.innerHTML = "";

    for (let i = 0; i < width; i++) {
        let a = make("div");
        a.innerHTML = String.fromCharCode(97 + i);
        if (i % 2 == 1) a.classList.add("lightSquare");
        else a.classList.add("darkSquare");
        fileDiv.appendChild(a);
    }

    for (let i = 0; i < height; i++) {
        let a = make("div");
        a.innerHTML = (height - i);
        if (i % 2 == 0) a.classList.add("lightSquare");
        else a.classList.add("darkSquare");
        rankDiv.appendChild(a);
    }
}

// ******************************************
//  Chess functionality
// ******************************************
var pieceChoice = {};
var tokenChoice = {};
var seeLegalMoves = true;
var moveType;
var legalMoves = [];
var ambiguousMoves = [];
var regularMoves = [];
var launchableStones = [];
var choosingSquare = false;
var muted = false;

//-----------------------------
// Legal Mvoes
//-----------------------------

function showLegalMoves(piece) {
    if (!isYourTurn || currentState.finished) return;

    let square = {
        row: piece[0],
        column: piece[1]
    }

    if (flipped) {
        flipSquare(square);
    }

    moveType = "Unspecified";
    showLegalMoveSquares(square); 
    showLaunchableStones(square);
}

function showLaunchableStones(square) {
    multiplayerClient.getLaunchableStones(square).then(responseJson => {
        launchableStones = responseJson;

        // Show launchable stones
        launchableStones.forEach(launchButtonID => {
            get(launchButtonID).parentElement.classList.add("launchable");
        });
    });
}

function loadInLegalMoves(moves) {
    legalMoves = new Map();
    ambiguousMoves = new Map();
    regularMoves = new Map();

    let toSquareCounts = new Map();

    moves.forEach(move => {
        if (!move.from || !move.to) return;
        let pieceKey = squareToKey(move.from);
        let movekey = squareToKey(move.to);

        if (!legalMoves.has(pieceKey)) {
            legalMoves.set(pieceKey, []);
            ambiguousMoves.set(pieceKey, []);
            regularMoves.set(pieceKey, []);
            toSquareCounts.set(pieceKey, new Map());
        }

        let pieceMoveCounts = toSquareCounts.get(pieceKey);
        pieceMoveCounts.set(movekey, (pieceMoveCounts.get(movekey) || 0) + 1);
        legalMoves.get(pieceKey).push(move);
    });

    moves.forEach(move => {
        if (!move.from || !move.to) return;
        let pieceKey = squareToKey(move.from);
        let movekey = squareToKey(move.to);
        let pieceMoveCounts = toSquareCounts.get(pieceKey);

        if (pieceMoveCounts.get(movekey) > 1) {
            ambiguousMoves.get(pieceKey).push(move);
        } else {
            regularMoves.get(pieceKey).push(move);
        }
    });
}

function squareToKey(square) {
    return `${square.row},${square.column}`;
}

function showLegalMoveSquares(piece) {
    let pieceKey = squareToKey(piece);
    if (!legalMoves.get(pieceKey)) return;

    regularMoves.get(pieceKey).forEach(move => {
                

        if (flipped) {
            let square = {
                row: move.to.row,
                column: move.to.column
            };

            flipSquare(square);
            setLegalMove(square);
        } else {
            setLegalMove(move.to);
        }
    });

    ambiguousMoves.get(pieceKey).forEach(move => {
        if (flipped) {
            let square = {
                row: move.to.row,
                column: move.to.column
            };

            flipSquare(square);
            setLegalMove(square, true);
        } else {
            setLegalMove(move.to, true);
        }
    });
}

function setLegalMove(square, special) {
    if (!!special) {
        // Don't overwrite a square that is already shown as legal
        let alreadyLegalElement = get(square.row + "-" + square.column + "-legalMove");
        if (!!alreadyLegalElement) return;
    }

    let element = buildSquareHighlight(square.row, square.column, "legalMove");
    if (!!special) element.classList.add("special");
}

function hideLegalMoves() {
    removeAllClass("legalMove");
}

function highlightPreviousMove(move) {
    removeAll("#boardDiv .previousMove");

    let hasFromSquare = false;
    if (!!move.from && move.from.row >= 0 && move.from.column >= 0) {
        hasFromSquare = true;
        buildSquareHighlight(move.from.row, move.from.column, "previousMove");
    }

    if (!!move.to && move.to.row >= 0 && move.to.column >= 0) {
        if (hasFromSquare && move.from.column == move.to.column && move.from.row == move.to.row) return;
        buildSquareHighlight(move.to.row, move.to.column, "previousMove");
    }
}

function seeLegalSquares() {
    if (!isYourTurn || currentState.finished) return;

    multiplayerClient.getLegalSquares().then(responseJson => {
        unPickPiece();

        responseJson.forEach(function (square) {
            if (flipped) {
                flipSquare(square);
            }

            setLegalMove(square);
        });
    });
}

//-----------------------------
// Rule Builders
//-----------------------------
const playerStonesContainer = get("playerStonesContainer");
const opponentStonesContainer = get("opponentStonesContainer");

function displayRules(state) {
    if (!flipped) {
        displayStones(state.whiteStones, playerStonesContainer);
        displayStones(state.blackStones, opponentStonesContainer, { isBlack: true, isFlipped: true });
    } else {
        displayStones(state.blackStones, playerStonesContainer, { isBlack: true });
        displayStones(state.whiteStones, opponentStonesContainer, { isFlipped: true });
    }
}

//-----------------------------
// Messages
//-----------------------------

function printMessage(message) {
    get("message").innerHTML = message;
}

function clearSecondaryMessage() {
    get("secondaryMessage").innerHTML = "";
}

function setSecondaryMessage(messageElement) {
    clearSecondaryMessage();
    get("secondaryMessage").appendChild(messageElement);
}

//-----------------------------
// Flipping
//-----------------------------

// "F" - flip everything
function flipBoard() {
    flipped = !flipped;

    // Flip Keepsakes
    displayRules(currentState);

    // Flip Board
    if (!currentBoard) return;
    unPickPiece();
    flipStateBoard(currentBoard);
    drawBoardItems(currentBoard);

    // Flip Extra Board Stuff
    boardContainer.classList.toggle("flippedBoard");

    // Hide legal moves
    hideLegalMoves();

    // Flip square colors if needed
    if ((currentBoard.range.rows + currentBoard.range.columns) % 2 == 1) {
        getAllClass("square").forEach(square => {
            if (square.classList.contains("light")) {
                square.classList.remove("light");
                square.classList.add("dark");
            } else {
                square.classList.remove("dark");
                square.classList.add("light");
            }

        });
    }

    // Flip the clocks
    if (currentState.ticking) {
        flipClocks();
    }
}

function flipSquare(square) {
    if (!!square && !isEmpty(square)) {
        square.row = numRows() - 1 - square.row;
        square.column = numCols() - 1 - square.column;
    }
}

function flipGameState(state) {
    // Board board objects
    flipStateBoard(state.board);

    // Flip animations
    state.animations.forEach(function (animation) {
        flipSquare(animation.from);
        flipSquare(animation.to);
        flipSquare(animation.pieceChoice);
        flipSquare(animation.tokenChoice);
    });

    // Flip Only Move
    if (!!state.onlyMove) {
        flipSquare(state.onlyMove.from);
        flipSquare(state.onlyMove.to);
    }

    // Flip Previous Move
    if (!!state.previousMove) {
        flipSquare(state.previousMove.from);
        flipSquare(state.previousMove.to);
    }
}

function flipStateBoard(gameBoard) {
    boardHeight = gameBoard.range.rows;
    boardWidth = gameBoard.range.columns;

    gameBoard.pieces.forEach(piece => flipSquare(piece));
    gameBoard.tokens.forEach(token => flipSquare(token));
}

//-----------------------------
// Picked Piece
//-----------------------------

function isEmpty(piece) {
    return piece[0] == NONE[0];
}

function setEmpty(piece) {
    piece[0] = NONE[0];
}

function pickPiece(row, col) {
    if (!isYourTurn) return;
    pickedPiece = [row, col];
    buildSquareHighlight(row, col, "picked");
}

function unPickPiece(dontResetMoveData) {
    if (!isEmpty(pickedPiece)) {
        remove(get(pickedPiece[0] + "-" + pickedPiece[1] + "-picked"));
        setEmpty(pickedPiece);

        if (seeLegalMoves) {
            hideLegalMoves();
            getAll(".stone-wrapper.launchable").forEach(launchableStone => {
                launchableStone.classList.remove("launchable");
            });
        }
    }

    if (!dontResetMoveData) {
        pieceChoice = {};
        tokenChoice = {};
        moveType = "Unspecified";
    }
}

//-----------------------------
// Events
//-----------------------------

function clickedSquare(row, col) {
    // Special Moves
    if (makingAChoice) { // Cancel any clicked square
        return;
    }

    if (choosingSquare) {
        hideLegalMoves();
        chooseSquare(row, col);
        return;
    }

    // Clear highlights
    hideLegalMoves();

    // Selecting a piece
    if (isEmpty(pickedPiece)) {
        if (!!getPieceAt(row, col)) {
            pickPiece(row, col);
            moveType = "Unspecified";
            showLegalMoves(pickedPiece);
        }
    }
    else { // Moving a piece (A piece is already selected)
        if (row == pickedPiece[0] && col == pickedPiece[1]) { // Clicked on the selected piece
            // Un-pick the piece 
            unPickPiece();
        } else {
            // Move
            move(pickedPiece[0], pickedPiece[1], row, col);
        }
    }
}


//---------------------------------
// Show available moves dropdowns
//---------------------------------
let movePopup = null;
function buildMovePopup(row, column, options, remakeMove) {
    let popup = build({
        type: "div",
        classes: ["popup", "movePopup"],
    });

    // Build the options
    options.forEach(option => {
        let optionName = option.type;
        if (optionName === "EnPassant") optionName = "En Passant";
        // else if (option === "Promote") option = "Under-Promote";

        if (optionName === "Promote") {
            let optionElement = createElement(`<div class="promoteMove"><span>${optionName}</span></div>`);
            popup.appendChild(optionElement);
            optionElement = popup.lastChild;
            // console.log(option.pieceChoice);
            optionElement.prepend(buildPieceImageForDisplay(option.pieceChoice));
            optionElement.addEventListener("click", () => {
                popup.parentElement.removeChild(popup);
                moveType = option.type;
                pieceChoice = option.pieceChoice;
                remakeMove();
            });
        } else {
            let optionElement = createElement(`<div>${optionName}</div>`);
            popup.appendChild(optionElement);
            optionElement = popup.lastChild;
            optionElement.addEventListener("click", () => {
                popup.parentElement.removeChild(popup);
                moveType = option.type;
                remakeMove();
            });
        }
    });

    // Position the popup
    let square = {
        row: row,
        column: column
    };

    if (flipped) flipSquare(square);

    let squareElement = getSquareElement(square.row, square.column).getBoundingClientRect();;

    const pageHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
    );

    popup.style.left = (squareElement.left - 5) + "px";
    popup.style.bottom = (pageHeight - squareElement.top + 5) + "px";

    closeMovePopup();
    movePopup = popup;
    document.body.appendChild(popup);
}

document.addEventListener("click", event => {
    closeMovePopup(true);
});
function closeMovePopup(fromDocumentClick) {
    if (!movePopup) return;

    if (!!fromDocumentClick && !movePopup.classList.contains("initialized")) {
        movePopup.classList.add("initialized")
        return;
    }

    if (!!movePopup.parentElement) movePopup.parentElement.removeChild(movePopup);
    movePopup = null;
}


//-----------------------------
// Moving
//-----------------------------
let tryingMove = false;
function move(row1, col1, row2, col2) {
    if (!isYourTurn || tryingMove) return false;
    unPickPiece(true);

    let from = {
        row: row1,
        column: col1
    };
    let to = {
        row: row2,
        column: col2
    };

    if (flipped) {
        flipSquare(from);
        flipSquare(to);
    }

    let pieceKey = squareToKey(from);
    let legalMovesList = legalMoves.get(pieceKey);
    if (!legalMovesList) return false;

    let requestedMove = {
        From: {
            Row: from.row,
            Column: from.column
        },
        To: {
            Row: to.row,
            Column: to.column
        },
        Type: (!!moveType ? moveType : "Unspecified"),
        PieceChoice: pieceChoice,
        TokenChoice: tokenChoice
    };

    // Check for an ambiguous move
    if (!isEmpty(requestedMove.To) && requestedMove.Type == "Unspecified") {
        let matchingMoves = [];

        for (let i = 0; i < legalMovesList.length; i++) {
            let legalMove = legalMovesList[i];
            if (legalMove.to.row == requestedMove.To.Row && legalMove.to.column == requestedMove.To.Column) {
                matchingMoves.push(legalMove);
            }
        }

        if (matchingMoves.length == 0) return false; // Illegal Move

        if (matchingMoves.length > 1) {
            // Ambiguous Move
            // console.log(matchingMoves);
            buildMovePopup(requestedMove.To.Row, requestedMove.To.Column, matchingMoves, () => {
                move(row1, col1, row2, col2);
            });
            return true;
        }

        if (matchingMoves[0].type == "Invoke") return false;
        requestedMove.Type = matchingMoves[0].type;
    }

    // Animate the move instantly
    if (requestedMove.Type != "Strike") {
        if (!!dragRequest && dragRequest.row == row1 && dragRequest.column == col1) {
            hardMoveImg(row1, col1, row2, col2, true);
        }
        else {
            moveImg(row1, col1, row2, col2, true);
        }
    }

    // Execute the move
    console.log("Making move: ", requestedMove);
    tryingMove = true;

    try {
        multiplayerClient.sendAction(
            "Move",
            requestedMove
        );
    }
    catch (error) {
        console.error("Failed to make move:", error);
    }
    finally {
        tryingMove = false;
    }

    return true;
}

function invokePiece(piece) {
    moveType = "Invoke";
    move(piece[0], piece[1], piece[0], piece[1]);
}

function chooseSquare(row, col) {
    choosingSquare = false;
    moveType = "MakeChoice";
    move(row, col, row, col);
}

var premove;
function savePremove(moveToSave) {
    if (isEmpty(moveToSave.From) || isEmpty(moveToSave.To)) {
        return;
    }

    // Draw the premove
    setLegalMove(moveToSave.From);
    setLegalMove(moveToSave.To);

    // Save the move
    if (flipped) {
        flipSquare(moveToSave.From);
        flipSquare(moveToSave.To);
    }

    premove = moveToSave;
}

function executePremove() {
    fetch(apiUrl + mainUrl + "makeMove",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(premove)
        }
    ).then(response => response.json()).then(responseJson => {
        displayStateAnimations(responseJson);
    });
}

premove = null;


//-----------------------------
// Dragging
//-----------------------------
var dragRequest = null;

function buildDragableOverlay(row, col, type, body) {
    let gameObjWrapper = buildOverlayElement(row, col, type, body);

    setupPieceDragging(gameObjWrapper);

    boardElement.appendChild(gameObjWrapper);
    return gameObjWrapper;
}

function setupPieceDragging(piece) {
    const DRAG_THRESHOLD = 5;
    let dragging = false;

    let pointerId = null;

    let startX = 0;
    let startY = 0;

    let currentX = 0;
    let currentY = 0;

    piece.addEventListener("pointerdown", onPointerDown);
    piece.addEventListener("pointermove", onPointerMove);
    piece.addEventListener("pointerup", onPointerUp);
    piece.addEventListener("pointercancel", onPointerCancel);

    function onPointerDown(e) {
        if (makingAChoice) {
            return;
        }

        // Only respond to primary pointer.
        if (!e.isPrimary) {
            return;
        }

        // Mouse: only left click.
        if (e.pointerType === "mouse" && e.button !== 0) {
            return;
        }

        e.preventDefault();

        let currentRow = parseInt(piece.id.split("-")[0]);
        let currentColumn = parseInt(piece.id.split("-")[1]);

        if (choosingSquare) {
            hideLegalMoves();
            chooseSquare(currentRow, currentColumn);
            return;
        }

        // Already picked piece - make a move
        if (!isEmpty(pickedPiece)) {
            remove(get(pickedPiece[0] + "-" + pickedPiece[1] + "-picked"));

            // Clicked on different square
            if (pickedPiece[0] != currentRow || pickedPiece[1] != currentColumn) {
                let hasLegalMoves = move(pickedPiece[0],
                    pickedPiece[1],
                    currentRow,
                    currentColumn
                );

                if (hasLegalMoves) return;
            }

            // Clicked on same square
            // unPickPiece();
        }

        pickedPiece = [
            currentRow,
            currentColumn
        ];

        moveType = "Unspecified";
        hideLegalMoves();
        closeMovePopup();
        showLegalMoves(pickedPiece);

        dragging = true;
        pointerId = e.pointerId;

        startX = e.clientX;
        startY = e.clientY;

        currentX = 0;
        currentY = 0;

        piece.classList.add("dragging");

        // Make sure we continue receiving pointer events even when
        // the pointer leaves the piece.
        piece.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {

        if (!dragging || e.pointerId !== pointerId) {
            return;
        }

        e.preventDefault();

        currentX = e.clientX - startX;
        currentY = e.clientY - startY;

        piece.style.transform =
            `translate(${currentX}px, ${currentY}px)`;
    }

    function onPointerUp(e) {

        if (!dragging || e.pointerId !== pointerId) {
            return;
        }

        e.preventDefault();

        finishDrag(e);
    }

    function onPointerCancel(e) {

        if (!dragging || e.pointerId !== pointerId) {
            return;
        }

        cancelDrag();
    }

    function finishDrag(e) {

        dragging = false;

        piece.classList.remove("dragging");

        if (piece.hasPointerCapture(e.pointerId)) {
            piece.releasePointerCapture(e.pointerId);
        }

        // Determine which board square the pointer is over
        // and attempt the move.
        const dropSquare = getSquareFromPointer(
            e.clientX,
            e.clientY
        );

        const startSquare = {
            row: pickedPiece[0],
            column: pickedPiece[1]
        }

        resetPiece();

        if (!dropSquare) {
            unPickPiece();
            return;
        }

        if (startSquare.row == dropSquare.row && startSquare.column == dropSquare.column) {
            pickPiece(startSquare.row, startSquare.column);
            return;
        }

        dragRequest = startSquare;
        move(startSquare.row, startSquare.column, dropSquare.row, dropSquare.column);
    }

    function cancelDrag() {

        dragging = false;

        piece.classList.remove("dragging");

        resetPiece();
    }

    function resetPiece() {
        piece.style.transform = "";

        pointerId = null;
        currentX = 0;
        currentY = 0;
    }
}

function getSquareFromPointer(clientX, clientY) {
    let board = get("boardDiv");
    const rect = board.getBoundingClientRect();

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Outside board
    if (
        x < 0 ||
        y < 0 ||
        x >= rect.width ||
        y >= rect.height
    ) {
        return null;
    }

    const squareWidth = rect.width / currentBoard.range.columns;
    const squareHeight = rect.height / currentBoard.range.rows;

    const column = Math.floor(x / squareWidth);
    const row = Math.floor(y / squareHeight);

    return {
        row: row,
        column: column
    };
}