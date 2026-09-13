
const optionMenu = document.getElementById("optionMenu");
const mainOption = document.getElementById("mainOption");
const optionList = optionMenu.querySelector(".option-list");

let options = [
    {
        id: "option0",
        timeControl: "Untimed",
        image: "imgs/icons/NoTimeControl.png"
    },
    {
        id: "option1",
        timeControl: "Rapid",
        image: "imgs/icons/rapid.png"
    },
    {
        id: "option2",
        timeControl: "Blitz",
        image: "imgs/icons/blitz.png"
    },
    {
        id: "option3",
        timeControl: "Bullet",
        image: "imgs/icons/bullet.png"
    }
];

let isAnimating = false;


// =========================================
// Render current state
// =========================================

function renderOptions() {

    // Main option
    mainOption.dataset.option = options[0].id;

    mainOption.querySelector("img").src = options[0].image;


    // Other options
    const buttons =
        optionList.querySelectorAll(".option-button");

    buttons.forEach((button, index) => {

        const option = options[index + 1];

        button.dataset.option = option.id;

        button.querySelector("img").src = option.image;
    });
}


// =========================================
// Desktop hover
// =========================================

const isTouchDevice =
    window.matchMedia("(hover: none)").matches;


if (!isTouchDevice) {

    optionMenu.addEventListener("mouseenter", () => {

        if (!isAnimating) {
            optionMenu.classList.add("open");
        }

    });

    optionMenu.addEventListener("mouseleave", () => {

        if (!isAnimating) {
            optionMenu.classList.remove("open");
        }

    });
}


// =========================================
// Mobile main button
// =========================================

mainOption.addEventListener("click", () => {

    if (isTouchDevice) {
        optionMenu.classList.toggle("open");
    }

});


// =========================================
// Selecting an option
// =========================================

optionList.addEventListener("click", (event) => {

    const button =
        event.target.closest(".option-button");

    if (!button || isAnimating) {
        return;
    }

    selectOption(button.dataset.option);
});




function selectOption(optionId) {

    const selectedIndex =
        options.findIndex(option => option.id === optionId);

    if (selectedIndex <= 0) {
        return;
    }

    isAnimating = true;


    /*
     * Current positions:
     *
     *       option3
     *       option2
     *       option1
     *       MAIN
     *
     * Suppose option2 was clicked.
     *
     * We want:
     *
     *       option3
     *       option1
     *       option0
     *       option2 <- MAIN
     */


    const buttons =
        [...optionList.querySelectorAll(".option-button")];


    const clickedButton = buttons[selectedIndex - 1];


    // -------------------------------------------------
    // STEP 1
    // Make the clicked button travel to the main button
    // -------------------------------------------------

    clickedButton.style.zIndex = "20";

    clickedButton.style.transform =
        "translateY(0) scale(1.05)";


    // -------------------------------------------------
    // STEP 2
    // Move the other buttons into their new positions
    // -------------------------------------------------

    buttons.forEach((button, index) => {

        if (button === clickedButton) {
            return;
        }

        /*
         * Their new location will be one slot lower.
         */
        const oldOptionIndex = index + 1;

        let newOptionIndex;

        if (oldOptionIndex < selectedIndex) {
            newOptionIndex = oldOptionIndex + 1;
        }
        else {
            newOptionIndex = oldOptionIndex;
        }

        const y = -70 * newOptionIndex;

        button.style.transform =
            `translateY(${y}px) scale(1)`;
    });


    // -------------------------------------------------
    // Move the current main button upward
    // -------------------------------------------------

    mainOption.style.transform =
        "translateY(-75px) scale(1)";


    // -------------------------------------------------
    // Wait for animation
    // -------------------------------------------------

    setTimeout(() => {

        // Update the logical ordering

        const selectedOption =
            options.splice(selectedIndex, 1)[0];

        options.unshift(selectedOption);


        // Reset all inline animation styles

        buttons.forEach(button => {

            button.style.transform = "";
            button.style.zIndex = "";

        });

        mainOption.style.transform = "";


        // Re-render with the new order

        renderOptions();


        // Close the menu

        optionMenu.classList.remove("open");


        isAnimating = false;

        localStorage.setItem("timeControl", selectedOption.timeControl);
    }, 350);
}

// TODO - load in saved time control on page load instead of resetting it
localStorage.setItem("timeControl", "Untimed");
