import {
    auth,
    db
} from "./firebase-config.js";


import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";


import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";



// ==========================================
// CURRENT USER
// ==========================================

let currentUser = null;

let transactionType = null;



// ==========================================
// HTML ELEMENTS
// ==========================================

const dashboardContent =
    document.getElementById("dashboardContent");

const logoutButton =
    document.getElementById("logoutButton");

const userEmail =
    document.getElementById("userEmail");

const userAvatar =
    document.getElementById("userAvatar");

const currentDate =
    document.getElementById("currentDate");


const menuButton =
    document.getElementById("menuButton");

const sidebar =
    document.querySelector(".sidebar");



// Transaction buttons

const addIncomeButton =
    document.getElementById("addIncomeButton");

const addExpenseButton =
    document.getElementById("addExpenseButton");



// Modal

const transactionModal =
    document.getElementById("transactionModal");

const closeModalButton =
    document.getElementById("closeModalButton");

const modalLabel =
    document.getElementById("modalLabel");

const modalTitle =
    document.getElementById("modalTitle");



// Form

const transactionForm =
    document.getElementById("transactionForm");

const transactionTitle =
    document.getElementById("transactionTitle");

const transactionAmount =
    document.getElementById("transactionAmount");

const transactionCategory =
    document.getElementById("transactionCategory");

const transactionDate =
    document.getElementById("transactionDate");

const paymentMethod =
    document.getElementById("paymentMethod");

const transactionNotes =
    document.getElementById("transactionNotes");

const transactionMessage =
    document.getElementById("transactionMessage");

const saveTransactionButton =
    document.getElementById("saveTransactionButton");



// ==========================================
// TRANSACTION CATEGORIES
// ==========================================

const incomeCategories = [

    "Salary",

    "Freelancing",

    "Business",

    "Investment",

    "Gift",

    "Other"

];


const expenseCategories = [

    "Food",

    "Shopping",

    "Transportation",

    "Education",

    "Bills",

    "Entertainment",

    "Health",

    "Travel",

    "Other"

];



// ==========================================
// AUTHENTICATION
// ==========================================

onAuthStateChanged(

    auth,

    (user) => {


        if (user) {


            currentUser = user;


            // Display email

            if (userEmail) {

                userEmail.textContent =
                    user.email || "User";

            }


            // Display avatar letter

            if (userAvatar) {


                const name =

                    user.displayName ||
                    user.email ||
                    "User";


                userAvatar.textContent =

                    name
                        .charAt(0)
                        .toUpperCase();

            }


            // Show dashboard

            if (dashboardContent) {

                dashboardContent.style.display =
                    "block";

            }


        }

        else {


            currentUser = null;


            window.location.replace(
                "index.html"
            );


        }


    }

);



// ==========================================
// LOGOUT
// ==========================================

if (logoutButton) {


    logoutButton.addEventListener(

        "click",

        async () => {


            try {


                await signOut(auth);


                window.location.replace(
                    "index.html"
                );


            }

            catch (error) {


                console.error(
                    "Logout error:",
                    error
                );


                alert(
                    "Unable to logout."
                );


            }


        }

    );


}



// ==========================================
// CURRENT DATE
// ==========================================

if (currentDate) {


    const today =
        new Date();


    currentDate.textContent =

        today.toLocaleDateString(

            "en-IN",

            {

                day: "numeric",

                month: "short",

                year: "numeric"

            }

        );


}



// ==========================================
// MOBILE MENU
// ==========================================

if (
    menuButton &&
    sidebar
) {


    menuButton.addEventListener(

        "click",

        () => {


            sidebar.classList.toggle(
                "open"
            );


        }

    );


}



// ==========================================
// SET TODAY AS DEFAULT DATE
// ==========================================

function setTodayDate() {


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    transactionDate.value =

        `${year}-${month}-${day}`;


}



// ==========================================
// LOAD CATEGORIES
// ==========================================

function loadCategories(categories) {


    transactionCategory.innerHTML =

        `<option value="">
            Select category
        </option>`;



    categories.forEach(

        (category) => {


            const option =

                document.createElement(
                    "option"
                );


            option.value =
                category;


            option.textContent =
                category;


            transactionCategory.appendChild(
                option
            );


        }

    );


}



// ==========================================
// OPEN TRANSACTION MODAL
// ==========================================

function openTransactionModal(type) {


    transactionType =
        type;


    transactionForm.reset();


    transactionMessage.textContent =
        "";


    transactionMessage.className =
        "transaction-message";


    setTodayDate();



    if (type === "income") {


        modalLabel.textContent =
            "NEW INCOME";


        modalTitle.textContent =
            "Add New Income";


        saveTransactionButton.textContent =
            "Save Income";


        loadCategories(
            incomeCategories
        );


    }

    else {


        modalLabel.textContent =
            "NEW EXPENSE";


        modalTitle.textContent =
            "Add New Expense";


        saveTransactionButton.textContent =
            "Save Expense";


        loadCategories(
            expenseCategories
        );


    }



    transactionModal.style.display =
        "flex";


    transactionTitle.focus();


}



// ==========================================
// CLOSE MODAL
// ==========================================

function closeTransactionModal() {


    transactionModal.style.display =
        "none";


    transactionForm.reset();


    transactionType =
        null;


}



// ==========================================
// OPEN INCOME FORM
// ==========================================

if (addIncomeButton) {


    addIncomeButton.addEventListener(

        "click",

        () => {


            openTransactionModal(
                "income"
            );


        }

    );


}



// ==========================================
// OPEN EXPENSE FORM
// ==========================================

if (addExpenseButton) {


    addExpenseButton.addEventListener(

        "click",

        () => {


            openTransactionModal(
                "expense"
            );


        }

    );


}



// ==========================================
// CLOSE BUTTON
// ==========================================

if (closeModalButton) {


    closeModalButton.addEventListener(

        "click",

        closeTransactionModal

    );


}



// ==========================================
// CLOSE WHEN CLICKING OUTSIDE
// ==========================================

if (transactionModal) {


    transactionModal.addEventListener(

        "click",

        (event) => {


            if (
                event.target ===
                transactionModal
            ) {


                closeTransactionModal();


            }


        }

    );


}



// ==========================================
// ESCAPE KEY
// ==========================================

document.addEventListener(

    "keydown",

    (event) => {


        if (
            event.key === "Escape" &&
            transactionModal.style.display ===
                "flex"
        ) {


            closeTransactionModal();


        }


    }

);



// ==========================================
// SAVE TRANSACTION TO FIRESTORE
// ==========================================

transactionForm.addEventListener(

    "submit",

    async (event) => {


        event.preventDefault();



        // Check authentication

        if (!currentUser) {


            transactionMessage.textContent =

                "You must be logged in.";


            transactionMessage.className =

                "transaction-message error";


            return;


        }



        // Get amount

        const amount =

            Number(
                transactionAmount.value
            );



        // Validate amount

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {


            transactionMessage.textContent =

                "Please enter a valid amount.";


            transactionMessage.className =

                "transaction-message error";


            return;


        }



        // Disable submit button

        saveTransactionButton.disabled =
            true;


        saveTransactionButton.textContent =

            "Saving...";


        transactionMessage.textContent =

            "Saving transaction...";


        transactionMessage.className =

            "transaction-message";



        try {


            // User-specific transactions collection

            const transactionsReference =

                collection(

                    db,

                    "users",

                    currentUser.uid,

                    "transactions"

                );



            // Add transaction

            await addDoc(

                transactionsReference,

                {


                    title:
                        transactionTitle
                            .value
                            .trim(),


                    amount:
                        amount,


                    type:
                        transactionType,


                    category:
                        transactionCategory
                            .value,


                    date:
                        transactionDate
                            .value,


                    paymentMethod:
                        paymentMethod
                            .value,


                    notes:
                        transactionNotes
                            .value
                            .trim(),


                    createdAt:
                        serverTimestamp()


                }

            );



            transactionMessage.textContent =

                `${
                    transactionType ===
                    "income"
                        ? "Income"
                        : "Expense"
                } saved successfully.`;


            transactionMessage.className =

                "transaction-message success";



            setTimeout(

                () => {


                    closeTransactionModal();


                },

                700

            );


        }

        catch (error) {


            console.error(

                "Firestore error:",

                error

            );


            transactionMessage.textContent =

                "Unable to save transaction. Please try again.";


            transactionMessage.className =

                "transaction-message error";


        }

        finally {


            saveTransactionButton.disabled =
                false;


            saveTransactionButton.textContent =

                transactionType === "income"

                    ? "Save Income"

                    : "Save Expense";


        }


    }

);