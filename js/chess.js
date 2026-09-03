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
var dragStart = [-99, -99];
var isYourTurn = false;

// State Variables
var flipped = false;
var autoFlipBoard = false;
var done = false;
var dragging = false;

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
        if (!clickedOn(event, "boardDiv")) { // Clicked off the board
            unPickPiece();
            hideLegalMoves();
        }
    }

    // TODO - check if this is needed
    getFirst(".river-page").ondragover = function (event) {
        event.preventDefault();
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

// Returns an array of all elements matching the selector
function getAll(selector) {
    return Array.from(document.querySelectorAll(selector));
}

// Returns the first element matching the selector
function getFirst(selector) {
    return document.querySelector(selector);
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

// Checks if an event clicked on the specified element
function clickedOn(event, id) {
    return event.target.closest("#" + id) === get(id);
}


// ******************************************
//  Chess functionality
// ******************************************
var pieceChoice = {};
var tokenChoice = {};
var seeLegalMoves = true;
var moveType;
var legalMoves = [];
var choosingSquare = false;
var muted = false;



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

function buildDragableOverlay(row, col, type, body) {
    let gameObjWrapper = buildOverlayElement(row, col, type, body);

    // Square events
    gameObjWrapper.onclick = function (event) {
        clickedSquare(parseInt(this.id.split("-")[0]), parseInt(this.id.split("-")[1]), event);
    }

    gameObjWrapper.ondragover = function (event) {
        event.preventDefault();
    }

    gameObjWrapper.ondrop = function (event) {
        pieceDropEvent(event, parseInt(this.id.split("-")[0]), parseInt(this.id.split("-")[1]));
    }

    // Dragable
    gameObjWrapper.draggable = "true";
    gameObjWrapper.ondragstart = function (event) {
        event.dataTransfer.effectAllowed = "move";
        startDrag(this);
    }

    gameObjWrapper.ondragend = function (event) {
        event.preventDefault();
        this.classList.remove("dragging");
        unPickPiece();
        dragging = false;
    }

    boardElement.appendChild(gameObjWrapper);
    return gameObjWrapper;
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
function moveImg(row1, col1, row2, col2) {
    let movingPiece = getPieceImg(row1, col1);
    movingPiece.id = row2 + "-" + col2 + "-piece";
    movingPiece.style.left = (col2 * 100 / numCols()) + "%";
    movingPiece.style.top = (row2 * 100 / numRows()) + "%";
}

/// Move without animation
function hardMoveImg(row1, col1, row2, col2) {
    let movingPiece = getPieceImg(row1, col1);

    movingPiece.style.transition = "none";
    movingPiece.id = row2 + "-" + col2 + "-piece";
    movingPiece.style.left = (col2 * 100 / numCols()) + "%";
    movingPiece.style.top = (row2 * 100 / numRows()) + "%";
    movingPiece.offsetHeight;
    movingPiece.style.transition = ".5s";
}

function swapPieces(row1, col1, row2, col2) {
    let movingPiece = getPieceImg(row1, col1);
    swappedPiece = getPieceImg(row2, col2);

    // Hard move
    if (!isEmpty(dragStart) && row1 == dragStart[0] && col1 == dragStart[1]) {
        movingPiece.style.transition = "none";
        movingPiece.id = row2 + "-" + col2 + "-piece";
        movingPiece.style.left = (col2 * 100 / numCols()) + "%";
        movingPiece.style.top = (row2 * 100 / numRows()) + "%";
        movingPiece.offsetHeight;
        movingPiece.style.transition = ".5s";
    } else {
        movingPiece.id = row2 + "-" + col2 + "-piece";
        movingPiece.style.left = (col2 * 100 / numCols()) + "%";
        movingPiece.style.top = (row2 * 100 / numRows()) + "%";
    }


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
                if (!isEmpty(dragStart) && animation.from.row == dragStart[0] && animation.from.column == dragStart[1]) {
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
                let explosion = buildOverlaySquare(animation.from.row, animation.from.column, "explode");
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
                setEmpty(dragStart);
                drawStateBoard(gameState);
                displayRules(gameState);
                i = animations.length; // Skip to the end of the animations
                i = animations.length;
                break;
        }
    }

    // After animations
    setEmpty(dragStart);

    // Flip the board and CPU turn    
    if (!gameState.finished) {
        if (autoFlipBoard && gameState.isWhitesTurn === flipped) {
            setTimeout(flipBoard, 700);
        }
    }
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

function getSquare(square) {
    let id = square.row * currentBoard.range.columns + square.column;
    return get(id);
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

    if (flipped && !gameState.tavern) {
        flipGameState(gameState);
    }

    currentBoard = gameState.board;
    currentState = gameState;
    isYourTurn = (gameState.isWhitesTurn ? gameState.whitePlayerID : gameState.blackPlayerID) == guestId;
    // clockUpdate(gameState);

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
        setTimeout(() => {
            if (confirm("Game finished! Continue?")) {
                goToTheRiver();
            }
        }, 1500);
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

            square.ondragover = function (event) {
                event.preventDefault();
            }

            square.ondrop = function (event) {
                pieceDropEvent(event, (this.id - this.id % width) / width, this.id % width);
            }

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
        if (!flipped) fileDiv.appendChild(a);
        else fileDiv.prepend(a);
    }

    for (let i = 0; i < height; i++) {
        let a = make("div");
        a.innerHTML = (height - i);
        if (!flipped) rankDiv.appendChild(a);
        else rankDiv.prepend(a);
    }
}


//-----------------------------
// Legal Mvoes
//-----------------------------

function showLegalMoves(piece, afterGetMoves) {
    if (!isYourTurn || currentState.finished) return;

    let square = {
        row: piece[0],
        column: piece[1]
    }

    if (flipped) {
        flipSquare(square);
    }

    multiplayerClient.getLegalMoves(square).then(responseJson => {
        legalMoves = responseJson;
        moveType = "Move";

        showLegalMovesForType();

        if (afterGetMoves) {
            afterGetMoves();
        }
    });


    // fetch(apiUrl + mainUrl + "getLegalMoves",
    //     {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json"
    //         },
    //         body: JSON.stringify(Square)
    //     }
    // ).then(response => response.json()).then(responseJson => {
    //     legalMoves = responseJson;
    //     moveType = "Move";
    //     showLegalMovesForType();
    //     if (!!afterGetMoves) afterGetMoves();
    // });
}


function checkAndShowLegalMoves() {
    if (seeLegalMoves) { showLegalMovesForType(); }
}

function showLegalMovesForType() {
    let movesToShow = [];
    let specialMoves = [];

    legalMoves.forEach(move => {
        if (move.type == moveType) movesToShow.push(move);
        else if (moveType == "Move" && !!move.to) specialMoves.push(move);
    });

    movesToShow.forEach(move => {
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

    specialMoves.forEach(move => {
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

    let element = buildOverlaySquare(square.row, square.column, "legalMove");
    if (!!special) element.classList.add("special");
}

function hideLegalMoves() {
    removeAllClass("legalMove");
}

function showLegalMoves(piece, afterGetMoves) {
    if (!isYourTurn || currentState.finished) return;

    let square = {
        row: piece[0],
        column: piece[1]
    }

    if (flipped) {
        flipSquare(square);
    }

    multiplayerClient.getLegalMoves(square).then(responseJson => {
        legalMoves = responseJson;
        moveType = "Move";

        showLegalMovesForType();

        if (afterGetMoves) {
            afterGetMoves();
        }
    });
// fetch(apiUrl + mainUrl + "getLegalMoves",
//     {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify(Square)
//     }
// ).then(response => response.json()).then(responseJson => {
//     legalMoves = responseJson;
//     moveType = "Move";
//     showLegalMovesForType();
//     if (!!afterGetMoves) afterGetMoves();
// });
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

    // fetch(apiUrl + mainUrl + "legalMoveSquares").then(response => response.json()).then(responseJson => {
    //     unPickPiece();
    //     responseJson.forEach(function (square) {
    //         if (flipped) {
    //             flipSquare(square);
    //         }

    //         setLegalMove(square);
    //     });
    // });
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
    flipClocks();
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
    buildOverlaySquare(row, col, "picked");
}

function unPickPiece() {
    if (!isEmpty(pickedPiece)) {
        remove(get(pickedPiece[0] + "-" + pickedPiece[1] + "-picked"));
        setEmpty(pickedPiece);
        if (seeLegalMoves) {
            hideLegalMoves();
        }
    }

    pieceChoice = {};
    tokenChoice = {};
    moveType = "Move";
}

//-----------------------------
// Events
//-----------------------------

// Right Click
document.addEventListener('contextmenu', function (event) {
    if (clickedOn(event, "boardContainer")) {
        let pieceImg = event.target.closest(".piece");

        if (!!pieceImg) {
            let row = parseInt(pieceImg.id.split("-")[0]);
            let col = parseInt(pieceImg.id.split("-")[1]);
            unPickPiece();
            pickPiece(row, col);
            showLegalMoves(pickedPiece, () => {
                buildMovesDropdown(event, row, col);
            });
        }

        event.preventDefault();
    }
}, false);

function clickedSquare(row, col, event) {
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
            moveType = "Move";

            if (!dragging) {
                showLegalMoves(pickedPiece);
            }
        }
    }
    else { // Moving a piece (A piece is already selected)
        if (row == pickedPiece[0] && col == pickedPiece[1]) { // Clicked on the selected piece
            if (dragging) {
                return;
            }

            // Un-pick the piece 
            unPickPiece();
        } else {
            // Move
            move(pickedPiece[0], pickedPiece[1], row, col);
        }
    }
}

function startDrag(pieceImg) {
    unPickPiece();

    dragging = true;
    pieceImg.classList.add("dragging");

    let id = pieceImg.id;
    row = parseInt(id.split("-")[0]);
    col = parseInt(id.split("-")[1]);
    dragStart[0] = row;
    dragStart[1] = col;
    pickedPiece[0] = row;
    pickedPiece[1] = col;
    showLegalMoves(pickedPiece);
}

function pieceDropEvent(event, row, col) {
    event.preventDefault();

    hideLegalMoves();

    if (row == dragStart[0] && col == dragStart[1]) {
        return;
    }

    move(dragStart[0], dragStart[1], row, col);
}

//---------------------------------
// Show available moves dropdowns
//---------------------------------

function buildMovesDropdown(event, row, col) {
    if (!seeLegalMoves) {
        buildAllMovesDropdown(event, row, col);
        return;
    }

    let moveTypes = [];

    legalMoves.forEach(legalMove => {
        if (!moveTypes.includes(legalMove.type)) {
            moveTypes.push(legalMove.type);
        }
    });

    if (moveTypes.length == 0) {
        buildPopup(event, makeDiv("No Moves"));
        return;
    }

    let dropdownOptions = moveTypes.map(moveTypeName => {
        let displayName = moveTypeName;
        if (displayName === "EnPassant") displayName = "En Passant";

        return buildDropdownOption(null, displayName, function () {
            pickPiece(row, col);

            if (moveTypeName === "Invoke") {
                invoke(pickedPiece);
                return;
            } else if (moveTypeName === "Promote") {
                buildPromoteDropdown(event, row, col);
                return;
            }

            moveType = moveTypeName;
            checkAndShowLegalMoves();
        });
    });

    buildDropdown(event, dropdownOptions);
}

function buildAllMovesDropdown(event, row, col) {
    let primaryMoveTypes = ["Move", "Invoke"];
    let secondaryMoveTypes = ["Promote", "Castle", "En Passant", "Strike", "Push", "Swap"];

    // Build the dropdowns
    let primaryDropdownOptions = primaryMoveTypes.map(moveTypeName => {
        return buildDropdownOption(null, moveTypeName, function () {
            pickPiece(row, col);

            if (moveTypeName === "Invoke") {
                invoke(pickedPiece);
                return;
            }

            moveType = moveTypeName;
            checkAndShowLegalMoves();
        });
    });


    let secondaryDropdownOptions = secondaryMoveTypes.map(moveTypeName => {
        let displayName = moveTypeName;
        if (displayName === "EnPassant") displayName = "En Passant";

        return buildDropdownOption(null, displayName, function () {
            pickPiece(row, col);

            if (moveTypeName === "Promote") {
                buildPromoteDropdown(event, row, col);
                return;
            }

            moveType = moveTypeName;
            checkAndShowLegalMoves();
        });
    });

    primaryDropdownOptions.push(buildDropdownOption(null, "More...", function () {
        buildDropdown(event, secondaryDropdownOptions);
    }));

    buildDropdown(event, primaryDropdownOptions);
}

function buildPromoteDropdown(event, row, col) {
    let promoteTypes = ["Knight", "Bishop", "Rook", "Queen"];
    let color = getPieceAt(pickedPiece[0], pickedPiece[1]).color;

    let dropdownOptions = promoteTypes.map(promoteType => {
        return buildDropdownOption(getPieceSrcByData(color, promoteType), promoteType, function () {
            pieceChoice = {
                "Type": promoteType
            }

            moveType = "Move";
            pickPiece(row, col);
            checkAndShowLegalMoves();
        });
    });

    buildDropdown(event, dropdownOptions);
}

//-----------------------------
// Moving
//-----------------------------

function move(row1, col1, row2, col2) {
    if (!isYourTurn) return;

    let Move = {
        From: {
            row: row1,
            column: col1
        },
        To: {
            row: row2,
            column: col2
        },
        Type: (!!moveType ? moveType : "Move"),
        PieceChoice: pieceChoice,
        TokenChoice: tokenChoice
    };

    unPickPiece();

    if (flipped) {
        flipSquare(Move.From);
        flipSquare(Move.To);
    }

    try {
        multiplayerClient.sendAction(
            "Move",
            Move
        );
    }
    catch (error) {
        console.error("Failed to make move:", error);
    }

    // fetch(apiUrl + mainUrl + "makeMove",
    //    {
    //        method: "POST",
    //        headers: {
    //            "Content-Type": "application/json"
    //        },
    //        body: JSON.stringify(Move)
    //    }
    // ).then(response => response.json()).then(responseJson => {
    //    displayStateAnimations(responseJson);
    // });
}

function invoke(piece) {
    moveType = "Invoke";
    move(piece[0], piece[1], -99, -99);
}

function chooseSquare(row, col) {
    choosingSquare = false;
    moveType = "MakeChoice";
    move(row, col, -99, -99);
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

    premove = null;
}
