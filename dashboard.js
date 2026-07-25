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
    where,
    orderBy,
    getDocs,
    addDoc,
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

const dashboardContent = document.getElementById("dashboardContent");

const userEmail = document.getElementById("userEmail");
const userAvatar = document.getElementById("userAvatar");

const currentDate = document.getElementById("currentDate");

const menuButton = document.getElementById("menuButton");
const sidebar = document.querySelector(".sidebar");

const logoutButton = document.getElementById("logoutButton");

const totalBalance = document.getElementById("totalBalance");
const totalIncome = document.getElementById("totalIncome");
const totalExpenses = document.getElementById("totalExpenses");
const totalSavings = document.getElementById("totalSavings");

const recentTransactions = document.getElementById("recentTransactions");

const budgetSpent = document.getElementById("budgetSpent");
const monthlyBudget = document.getElementById("monthlyBudget");
const budgetProgress = document.getElementById("budgetProgress");
const budgetMessage = document.getElementById("budgetMessage");
// ========================================
// TRANSACTION MODAL
// ========================================

const transactionModal = document.getElementById("transactionModal");

const addIncomeButton = document.getElementById("addIncomeButton");
const addExpenseButton = document.getElementById("addExpenseButton");

const closeModalButton = document.getElementById("closeModalButton");

const transactionForm = document.getElementById("transactionForm");

const modalTitle = document.getElementById("modalTitle");
const modalLabel = document.getElementById("modalLabel");

const transactionTitle = document.getElementById("transactionTitle");
const transactionAmount = document.getElementById("transactionAmount");
const transactionCategory = document.getElementById("transactionCategory");
const transactionDate = document.getElementById("transactionDate");
const paymentMethod = document.getElementById("paymentMethod");
const transactionNotes = document.getElementById("transactionNotes");
const transactionMessage = document.getElementById("transactionMessage");

// ========================================
// GLOBAL VARIABLES
// ========================================

let currentUser = null;
let transactions = [];
let transactionType = "income";

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

currentDate.textContent = getCurrentDate();


// ========================================
// MOBILE MENU
// ========================================

menuButton.addEventListener("click", () => {
    sidebar.classList.toggle("show");
});


// ========================================
// LOGOUT
// ========================================

logoutButton.addEventListener("click", async () => {

    try {

        await signOut(auth);

    } catch (error) {

        console.error(error);
        showToast("Logout failed");

    }

});


// ========================================
// AUTH CHECK
// ========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    currentUser = user;

    dashboardContent.style.display = "flex";

    loadUser();

    await loadTransactions();

});


// ========================================
// LOAD USER
// ========================================

function loadUser() {

    userEmail.textContent = currentUser.email;

    userAvatar.textContent =
        currentUser.email.charAt(0).toUpperCase();

}


// ========================================
// LOAD TRANSACTIONS
// ========================================

async function loadTransactions() {

    try {

        const q = query(
            collection(db, "transactions"),
            where("uid", "==", currentUser.uid),
            orderBy("createdAt", "desc")

        );

        const snapshot = await getDocs(q);

        transactions = [];

        snapshot.forEach((doc) => {

            transactions.push({
                id: doc.id,
                ...doc.data()
            });

        });

        updateDashboard();

    } catch (error) {

        console.error(error);

    }

}
// ========================================
// UPDATE DASHBOARD
// ========================================

function updateDashboard() {

    let income = 0;
    let expense = 0;

    transactions.forEach(transaction => {

        if (transaction.type === "income") {

            income += Number(transaction.amount);

        } else {

            expense += Number(transaction.amount);

        }

    });

    const balance = income - expense;
    const savings = balance;

    totalIncome.textContent = formatCurrency(income);
    totalExpenses.textContent = formatCurrency(expense);
    totalBalance.textContent = formatCurrency(balance);
    totalSavings.textContent = formatCurrency(savings);

    renderRecentTransactions();

    updateBudget(expense);

}
// ========================================
// RECENT TRANSACTIONS
// ========================================

function renderRecentTransactions() {

    if (transactions.length === 0) {

        recentTransactions.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">↔</div>
                <h3>No transactions yet</h3>
                <p>Add your first transaction.</p>
            </div>
        `;

        return;

    }

    const latest = transactions.slice(0, 5);

    recentTransactions.innerHTML = latest.map(transaction => `

        <div class="transaction-item">

            <div>

                <strong>${transaction.title}</strong>

                <p>${transaction.category}</p>

            </div>

            <div>

                <strong class="${
                    transaction.type === "income"
                        ? "income-text"
                        : "expense-text"
                }">

                    ${transaction.type === "income" ? "+" : "-"}
                    ${formatCurrency(transaction.amount)}

                </strong>

                <small>${formatDate(transaction.date)}</small>

            </div>

        </div>

    `).join("");

}
// ========================================
// MONTHLY BUDGET
// ========================================

function updateBudget(expense) {

    const budget = Number(localStorage.getItem("monthlyBudget")) || 0;

    budgetSpent.textContent = formatCurrency(expense);

    monthlyBudget.textContent = formatCurrency(budget);

    if (budget === 0) {

        budgetProgress.style.width = "0%";

        budgetMessage.textContent =
            "Set your monthly budget to start tracking.";

        return;

    }

    const percent = Math.min((expense / budget) * 100, 100);

    budgetProgress.style.width = percent + "%";

    const remaining = budget - expense;

    if (remaining >= 0) {

        budgetMessage.textContent =
            `${formatCurrency(remaining)} remaining this month`;

    } else {

        budgetMessage.textContent =
            `Budget exceeded by ${formatCurrency(Math.abs(remaining))}`;

    }

}
// ========================================
// TRANSACTION MODAL
// ========================================

// Open Income Modal
addIncomeButton.addEventListener("click", () => {
    openTransactionModal("income");
});

// Open Expense Modal
addExpenseButton.addEventListener("click", () => {
    openTransactionModal("expense");
});

// Close Modal Button
closeModalButton.addEventListener("click", closeTransactionModal);

// Save Transaction
transactionForm.addEventListener("submit", saveTransaction);

// Close Modal when clicking outside
transactionModal.addEventListener("click", (event) => {

    if (event.target === transactionModal) {

        transactionForm.reset();

        closeTransactionModal();


    }

});

// ========================================
// OPEN MODAL
// ========================================

function openTransactionModal(type) {

    transactionType = type;

    transactionForm.reset();

    transactionDate.value = new Date().toISOString().split("T")[0];

    transactionMessage.textContent = "";

    if (type === "income") {

        modalTitle.textContent = "Add Income";
        modalLabel.textContent = "NEW INCOME";

        loadCategories(incomeCategories);

    } else {

        modalTitle.textContent = "Add Expense";
        modalLabel.textContent = "NEW EXPENSE";

        loadCategories(expenseCategories);

    }

    transactionModal.style.display = "flex";

    transactionTitle.focus();
}

// ========================================
// CLOSE MODAL
// ========================================

function closeTransactionModal() {

    transactionModal.style.display = "none";
}

// ========================================
// LOAD CATEGORY OPTIONS
// ========================================

function loadCategories(categories) {

    transactionCategory.innerHTML = "";

    categories.forEach(category => {

        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        transactionCategory.appendChild(option);

    });

}
// ========================================
// SAVE TRANSACTION
// ========================================

async function saveTransaction(event) {

    event.preventDefault();

    transactionMessage.textContent = "";

    const title = transactionTitle.value.trim();
    const amount = Number(transactionAmount.value);
    const category = transactionCategory.value;
    const date = transactionDate.value;
    const payment = paymentMethod.value;
    const notes = transactionNotes.value.trim();

    if (!title || amount <= 0 || !category || !date || !payment) {

        transactionMessage.textContent =
            "Please fill all required fields.";

        return;

    }

    try {

        await addDoc(collection(db, "transactions"), {

            uid: currentUser.uid,

            title,

            amount,

            category,

            type: transactionType,

            date,

            payment,

            notes: notes.trim(),

            createdAt: serverTimestamp()

        });

        showToast("Transaction Added Successfully");

        transactionForm.reset();

        closeTransactionModal();

        await loadTransactions();

    } catch (error) {

        console.error(error);

        transactionMessage.textContent =
            "Failed to save transaction.";

    }

}