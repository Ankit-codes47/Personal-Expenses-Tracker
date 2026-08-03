// ========================================
// IMPORTS
// ========================================

import { auth, db } from "../JS/firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

import {
    collection,
    query,
    orderBy,
    getDocs,
    addDoc,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import {
    formatCurrency,
    formatDate,
    getCurrentDate,
    showToast
} from "./utils.js";


// ========================================
// DOM ELEMENTS
// ========================================

const dashboardContent =
    document.getElementById("dashboardContent");

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

const logoutButton =
    document.getElementById("logoutButton");

const totalBalance =
    document.getElementById("totalBalance");

const totalIncome =
    document.getElementById("totalIncome");

const totalExpenses =
    document.getElementById("totalExpenses");

const totalSavings =
    document.getElementById("totalSavings");

const recentTransactions =
    document.getElementById("recentTransactions");

const budgetSpent =
    document.getElementById("budgetSpent");

const monthlyBudget =
    document.getElementById("monthlyBudget");

const budgetProgress =
    document.getElementById("budgetProgress");

const budgetMessage =
    document.getElementById("budgetMessage");


// ========================================
// TRANSACTION MODAL
// ========================================

const transactionModal =
    document.getElementById("transactionModal");

const addIncomeButton =
    document.getElementById("addIncomeButton");

const addExpenseButton =
    document.getElementById("addExpenseButton");

const closeModalButton =
    document.getElementById("closeModalButton");

const transactionForm =
    document.getElementById("transactionForm");

const modalTitle =
    document.getElementById("modalTitle");

const modalLabel =
    document.getElementById("modalLabel");

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


// ========================================
// GLOBAL VARIABLES
// ========================================

let currentUser = null;

let transactions = [];

let savingsGoals = [];

let transactionType = "income";

// Current month's Firestore budget
let currentMonthlyBudget = 0;


// ========================================
// CATEGORIES
// ========================================

const incomeCategories = [
    "Salary",
    "Business",
    "Freelancing",
    "Investment",
    "Gift",
    "Bonus",
    "Other"
];

const expenseCategories = [
    "Food",
    "Shopping",
    "Travel",
    "Bills",
    "Entertainment",
    "Health",
    "Education",
    "Rent",
    "Other"
];


// ========================================
// SHOW TODAY'S DATE
// ========================================

if (currentDate) {

    currentDate.textContent =
        getCurrentDate();

}


// ========================================
// MOBILE MENU
// ========================================

if (menuButton && sidebar) {

    menuButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            sidebar.classList.toggle(
                "open"
            );

        }
    );


    document.addEventListener(
        "click",
        (event) => {

            if (
                sidebar.classList.contains(
                    "open"
                ) &&
                !sidebar.contains(
                    event.target
                ) &&
                !menuButton.contains(
                    event.target
                )
            ) {

                sidebar.classList.remove(
                    "open"
                );

            }

        }
    );


    const navLinks =
        sidebar.querySelectorAll(
            ".nav-link"
        );


    navLinks.forEach((link) => {

        link.addEventListener(
            "click",
            () => {

                sidebar.classList.remove(
                    "open"
                );

            }
        );

    });

}


// ========================================
// LOGOUT
// ========================================

logoutButton?.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

        } catch (error) {

            console.error(error);

            showToast(
                "Logout failed"
            );

        }

    }
);


// ========================================
// AUTH CHECK
// ========================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "index.html";

            return;

        }


        currentUser = user;


        if (dashboardContent) {

            dashboardContent.style.display =
                "flex";

        }


        loadUser();


        // Load all dashboard data before
        // calculating totals and rendering UI.

        await Promise.all([
            loadTransactions(),
            loadSavingsGoals(),
            loadMonthlyBudget()
        ]);


        updateDashboard();

    }
);


// ========================================
// LOAD USER
// ========================================

function loadUser() {

    if (userEmail) {

        userEmail.textContent =
            currentUser.email ||
            "User";

    }


    if (userAvatar) {

        const name =
            currentUser.displayName ||
            currentUser.email ||
            "User";


        userAvatar.textContent =
            name
                .charAt(0)
                .toUpperCase();

    }

}


// ========================================
// LOAD TRANSACTIONS
// ========================================

async function loadTransactions() {

    try {

        if (!currentUser) {

            transactions = [];

            return;

        }


        const transactionReference =
            collection(
                db,
                "users",
                currentUser.uid,
                "transactions"
            );


        const q =
            query(
                transactionReference,
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(q);


        transactions = [];


        snapshot.forEach(
            (documentSnapshot) => {

                transactions.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );

    } catch (error) {

        console.error(
            "Failed to load transactions:",
            error
        );


        transactions = [];

    }

}


// ========================================
// LOAD SAVINGS GOALS
// ========================================

async function loadSavingsGoals() {

    try {

        if (!currentUser) {

            savingsGoals = [];

            return;

        }


        const goalsReference =
            collection(
                db,
                "users",
                currentUser.uid,
                "savingsGoals"
            );


        const snapshot =
            await getDocs(
                goalsReference
            );


        savingsGoals = [];


        snapshot.forEach(
            (documentSnapshot) => {

                savingsGoals.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );

    } catch (error) {

        console.error(
            "Failed to load savings goals:",
            error
        );


        savingsGoals = [];

    }

}


// ========================================
// CALCULATE TOTAL SAVINGS
// ========================================

function calculateTotalSavings() {

    return savingsGoals.reduce(
        (total, goal) => {

            const amount =
                Number(
                    goal.savedAmount
                );


            if (
                !Number.isFinite(
                    amount
                ) ||
                amount < 0
            ) {

                return total;

            }


            return total + amount;

        },
        0
    );

}


// ========================================
// LOAD CURRENT MONTHLY BUDGET
// ========================================

async function loadMonthlyBudget() {

    try {

        if (!currentUser) {

            currentMonthlyBudget = 0;

            return;

        }


        const now =
            new Date();


        const year =
            now.getFullYear();


        const month =
            String(
                now.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const budgetId =
            `${year}-${month}`;


        const budgetReference =
            doc(
                db,
                "users",
                currentUser.uid,
                "budgets",
                budgetId
            );


        const snapshot =
            await getDoc(
                budgetReference
            );


        if (!snapshot.exists()) {

            currentMonthlyBudget = 0;

            return;

        }


        const data =
            snapshot.data();


        const amount =
            Number(
                data.amount
            );


        currentMonthlyBudget =
            Number.isFinite(amount) &&
            amount >= 0
                ? amount
                : 0;

    } catch (error) {

        console.error(
            "Failed to load monthly budget:",
            error
        );


        currentMonthlyBudget = 0;

    }

}


// ========================================
// UPDATE DASHBOARD
// ========================================

function updateDashboard() {

    let income = 0;

    let expense = 0;


    transactions.forEach(
        (transaction) => {

            const amount =
                Number(
                    transaction.amount
                );


            if (
                !Number.isFinite(
                    amount
                ) ||
                amount < 0
            ) {

                return;

            }


            if (
                transaction.type ===
                "income"
            ) {

                income += amount;

            } else if (
                transaction.type ===
                "expense"
            ) {

                expense += amount;

            }

        }
    );


    // Actual money saved in Savings Goals.

    const savings =
        calculateTotalSavings();


    // Spendable balance after expenses
    // and allocated savings.

    const balance =
        income -
        expense -
        savings;


    if (totalIncome) {

        totalIncome.textContent =
            formatCurrency(
                income
            );

    }


    if (totalExpenses) {

        totalExpenses.textContent =
            formatCurrency(
                expense
            );

    }


    if (totalSavings) {

        totalSavings.textContent =
            formatCurrency(
                savings
            );

    }


    if (totalBalance) {

        totalBalance.textContent =
            formatCurrency(
                balance
            );

    }


    renderRecentTransactions();

    updateBudget();

}


// ========================================
// RECENT TRANSACTIONS
// ========================================

function renderRecentTransactions() {

    if (!recentTransactions) {

        return;

    }


    if (
        transactions.length === 0
    ) {

        recentTransactions.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ↔
                </div>

                <h3>
                    No transactions yet
                </h3>

                <p>
                    Add your first transaction.
                </p>

            </div>
        `;

        return;

    }


    const latest =
        transactions.slice(
            0,
            5
        );


    recentTransactions.innerHTML =
        latest
            .map(
                (transaction) => `

                    <div class="transaction-item">

                        <div>

                            <strong>
                                ${escapeHTML(
                                    transaction.title ||
                                    ""
                                )}
                            </strong>

                            <p>
                                ${escapeHTML(
                                    transaction.category ||
                                    ""
                                )}
                            </p>

                        </div>


                        <div>

                            <strong class="${
                                transaction.type ===
                                "income"
                                    ? "income-text"
                                    : "expense-text"
                            }">

                                ${
                                    transaction.type ===
                                    "income"
                                        ? "+"
                                        : "-"
                                }

                                ${formatCurrency(
                                    Number(
                                        transaction.amount
                                    ) || 0
                                )}

                            </strong>

                            <small>
                                ${formatDate(
                                    transaction.date
                                )}
                            </small>

                        </div>

                    </div>

                `
            )
            .join("");

}


// ========================================
// CURRENT MONTH EXPENSE TOTAL
// ========================================

function calculateCurrentMonthExpense() {

    const now =
        new Date();


    const currentYear =
        now.getFullYear();


    const currentMonth =
        now.getMonth() + 1;


    return transactions.reduce(
        (total, transaction) => {

            if (
                transaction.type !==
                "expense"
            ) {

                return total;

            }


            const amount =
                Number(
                    transaction.amount
                );


            if (
                !Number.isFinite(amount) ||
                amount < 0
            ) {

                return total;

            }


            const dateValue =
                transaction.date;


            if (!dateValue) {

                return total;

            }


            let transactionYear = null;
            let transactionMonth = null;


            if (
                typeof dateValue ===
                "string"
            ) {

                const parts =
                    dateValue.split("-");


                if (
                    parts.length >= 2
                ) {

                    transactionYear =
                        Number(
                            parts[0]
                        );

                    transactionMonth =
                        Number(
                            parts[1]
                        );

                }

            } else if (
                dateValue?.toDate
            ) {

                const date =
                    dateValue.toDate();


                transactionYear =
                    date.getFullYear();

                transactionMonth =
                    date.getMonth() + 1;

            }


            if (
                transactionYear !==
                    currentYear ||
                transactionMonth !==
                    currentMonth
            ) {

                return total;

            }


            return total + amount;

        },
        0
    );

}


// ========================================
// MONTHLY BUDGET
// ========================================

function updateBudget() {

    const budget =
        currentMonthlyBudget;


    // Only current month's expenses
    // should affect current month's budget.

    const expense =
        calculateCurrentMonthExpense();


    if (budgetSpent) {

        budgetSpent.textContent =
            formatCurrency(
                expense
            );

    }


    if (monthlyBudget) {

        monthlyBudget.textContent =
            formatCurrency(
                budget
            );

    }


    if (budget === 0) {

        if (budgetProgress) {

            budgetProgress.style.width =
                "0%";

        }


        if (budgetMessage) {

            budgetMessage.textContent =
                "Set your monthly budget to start tracking.";

        }


        return;

    }


    const percent =
        Math.min(
            (
                expense /
                budget
            ) * 100,
            100
        );


    if (budgetProgress) {

        budgetProgress.style.width =
            percent + "%";

    }


    const remaining =
        budget - expense;


    if (!budgetMessage) {

        return;

    }


    if (remaining >= 0) {

        budgetMessage.textContent =
            `${formatCurrency(
                remaining
            )} remaining this month`;

    } else {

        budgetMessage.textContent =
            `Budget exceeded by ${formatCurrency(
                Math.abs(
                    remaining
                )
            )}`;

    }

}


// ========================================
// TRANSACTION MODAL EVENTS
// ========================================

addIncomeButton?.addEventListener(
    "click",
    () => {

        openTransactionModal(
            "income"
        );

    }
);


addExpenseButton?.addEventListener(
    "click",
    () => {

        openTransactionModal(
            "expense"
        );

    }
);


closeModalButton?.addEventListener(
    "click",
    closeTransactionModal
);


transactionForm?.addEventListener(
    "submit",
    saveTransaction
);


// ========================================
// CLOSE MODAL WHEN CLICKING OUTSIDE
// ========================================

transactionModal?.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            transactionModal
        ) {

            transactionForm?.reset();

            closeTransactionModal();

        }

    }
);


// ========================================
// OPEN TRANSACTION MODAL
// ========================================

function openTransactionModal(type) {

    transactionType = type;


    transactionForm?.reset();


    if (transactionDate) {

        transactionDate.value =
            new Date()
                .toISOString()
                .split("T")[0];

    }


    if (transactionMessage) {

        transactionMessage.textContent =
            "";

    }


    if (type === "income") {

        if (modalTitle) {

            modalTitle.textContent =
                "Add Income";

        }


        if (modalLabel) {

            modalLabel.textContent =
                "NEW INCOME";

        }


        loadCategories(
            incomeCategories
        );

    } else {

        if (modalTitle) {

            modalTitle.textContent =
                "Add Expense";

        }


        if (modalLabel) {

            modalLabel.textContent =
                "NEW EXPENSE";

        }


        loadCategories(
            expenseCategories
        );

    }


    if (transactionModal) {

        transactionModal.style.display =
            "flex";

    }


    transactionTitle?.focus();

}


// ========================================
// CLOSE TRANSACTION MODAL
// ========================================

function closeTransactionModal() {

    if (transactionModal) {

        transactionModal.style.display =
            "none";

    }

}


// ========================================
// LOAD CATEGORY OPTIONS
// ========================================

function loadCategories(categories) {

    if (!transactionCategory) {

        return;

    }


    transactionCategory.innerHTML =
        "";


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


// ========================================
// SAVE TRANSACTION
// ========================================

async function saveTransaction(event) {

    event.preventDefault();


    if (!currentUser) {

        return;

    }


    if (transactionMessage) {

        transactionMessage.textContent =
            "";

    }


    const title =
        transactionTitle?.value
            .trim() ||
        "";


    const amount =
        Number(
            transactionAmount?.value
        );


    const category =
        transactionCategory?.value ||
        "";


    const date =
        transactionDate?.value ||
        "";


    const payment =
        paymentMethod?.value ||
        "";


    const notes =
        transactionNotes?.value
            .trim() ||
        "";


    if (
        !title ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !category ||
        !date ||
        !payment
    ) {

        if (transactionMessage) {

            transactionMessage.textContent =
                "Please fill all required fields.";

        }


        return;

    }


    try {

        await addDoc(
            collection(
                db,
                "users",
                currentUser.uid,
                "transactions"
            ),
            {

                uid:
                    currentUser.uid,

                title,

                amount,

                category,

                type:
                    transactionType,

                date,

                payment,

                notes,

                createdAt:
                    serverTimestamp()

            }
        );


        showToast(
            "Transaction Added Successfully"
        );


        transactionForm?.reset();


        closeTransactionModal();


        await loadTransactions();


        updateDashboard();

    } catch (error) {

        console.error(
            "Failed to save transaction:",
            error
        );


        if (transactionMessage) {

            transactionMessage.textContent =
                "Failed to save transaction.";

        }

    }

}


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}