// =====================================================
// transactions-page.js
// Expense Tracker - Day 5
// =====================================================

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
    getDocs,
    query,
    orderBy,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import {
    formatCurrency,
    formatDate
} from "./utils.js";


// =====================================================
// STATE
// =====================================================

let currentUser = null;

let allTransactions = [];

let filteredTransactions = [];

let editingTransactionId = null;

let deletingTransactionId = null;


// =====================================================
// CATEGORIES
// =====================================================

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


// =====================================================
// PAGE ELEMENTS
// =====================================================

const transactionsPage =
    document.getElementById("transactionsPage");

const userEmail =
    document.getElementById("userEmail");

const userAvatar =
    document.getElementById("userAvatar");

const logoutButton =
    document.getElementById("logoutButton");

const menuButton =
    document.getElementById("menuButton");

const sidebar =
    document.querySelector(".sidebar");


// =====================================================
// SUMMARY ELEMENTS
// =====================================================

const transactionCount =
    document.getElementById("transactionCount");

const transactionIncome =
    document.getElementById("transactionIncome");

const transactionExpenses =
    document.getElementById("transactionExpenses");

const transactionBalance =
    document.getElementById("transactionBalance");


// =====================================================
// FILTER ELEMENTS
// =====================================================

const transactionSearch =
    document.getElementById("transactionSearch");

const typeFilter =
    document.getElementById("typeFilter");

const categoryFilter =
    document.getElementById("categoryFilter");

const dateFrom =
    document.getElementById("dateFrom");

const dateTo =
    document.getElementById("dateTo");

const clearFiltersButton =
    document.getElementById("clearFiltersButton");

const resultCount =
    document.getElementById("resultCount");


// =====================================================
// TRANSACTION DISPLAY
// =====================================================

const transactionsTableBody =
    document.getElementById("transactionsTableBody");

const mobileTransactionList =
    document.getElementById("mobileTransactionList");

const transactionsEmptyState =
    document.getElementById("transactionsEmptyState");


// =====================================================
// EDIT MODAL
// =====================================================

const editTransactionModal =
    document.getElementById("editTransactionModal");

const closeEditModalButton =
    document.getElementById("closeEditModalButton");

const cancelEditButton =
    document.getElementById("cancelEditButton");

const editTransactionForm =
    document.getElementById("editTransactionForm");

const editTransactionTitle =
    document.getElementById("editTransactionTitle");

const editTransactionAmount =
    document.getElementById("editTransactionAmount");

const editTransactionType =
    document.getElementById("editTransactionType");

const editTransactionCategory =
    document.getElementById("editTransactionCategory");

const editTransactionDate =
    document.getElementById("editTransactionDate");

const editPaymentMethod =
    document.getElementById("editPaymentMethod");

const editTransactionNotes =
    document.getElementById("editTransactionNotes");

const editTransactionMessage =
    document.getElementById("editTransactionMessage");

const updateTransactionButton =
    document.getElementById("updateTransactionButton");


// =====================================================
// DELETE MODAL
// =====================================================

const deleteModal =
    document.getElementById("deleteModal");

const deleteTransactionPreview =
    document.getElementById("deleteTransactionPreview");

const deleteMessage =
    document.getElementById("deleteMessage");

const cancelDeleteButton =
    document.getElementById("cancelDeleteButton");

const confirmDeleteButton =
    document.getElementById("confirmDeleteButton");


// =====================================================
// SECURITY: ESCAPE HTML
// Prevent stored transaction text from becoming HTML.
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =====================================================
// NORMALIZE TYPE
// =====================================================

function normalizeType(type) {

    return String(type || "")
        .trim()
        .toLowerCase();

}


// =====================================================
// GET TRANSACTION BY ID
// =====================================================

function getTransactionById(id) {

    return allTransactions.find(
        transaction => transaction.id === id
    );

}


// =====================================================
// AUTHENTICATION
// =====================================================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace("index.html");

            return;

        }

        currentUser = user;

        if (userEmail) {

            userEmail.textContent =
                user.email || "User";

        }

        if (userAvatar) {

            const name =
                user.displayName ||
                user.email ||
                "User";

            userAvatar.textContent =
                name.charAt(0).toUpperCase();

        }

        if (transactionsPage) {

            transactionsPage.style.display =
                "flex";

        }

        await loadAllTransactions();

    }
);


// =====================================================
// LOGOUT
// =====================================================

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
                    "Unable to logout. Please try again."
                );

            }

        }
    );

}


// =====================================================
// MOBILE MENU
// =====================================================

if (menuButton && sidebar) {

    menuButton.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle("open");

        }
    );

}


// =====================================================
// LOAD TRANSACTIONS
// =====================================================

async function loadAllTransactions() {

    if (!currentUser) return;

    showLoadingState();

    try {

        const transactionsReference =
            collection(
                db,
                "users",
                currentUser.uid,
                "transactions"
            );

        const transactionsQuery =
            query(
                transactionsReference,
                orderBy(
                    "createdAt",
                    "desc"
                )
            );

        const snapshot =
            await getDocs(
                transactionsQuery
            );

        allTransactions =
            snapshot.docs.map(
                documentSnapshot => ({
                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()
                })
            );

        updateCategoryFilter();

        updateSummary();

        applyFilters();

    }

    catch (error) {

        console.error(
            "Unable to load transactions:",
            error
        );

        allTransactions = [];

        filteredTransactions = [];

        renderTransactions();

        if (resultCount) {

            resultCount.textContent =
                "Unable to load transactions.";

        }

    }

}


// =====================================================
// LOADING STATE
// =====================================================

function showLoadingState() {

    if (transactionsTableBody) {

        transactionsTableBody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="loading-row"
                >
                    Loading your transactions...
                </td>
            </tr>
        `;

    }

    if (mobileTransactionList) {

        mobileTransactionList.innerHTML = "";

    }

    if (transactionsEmptyState) {

        transactionsEmptyState.hidden = true;

    }

    if (resultCount) {

        resultCount.textContent =
            "Loading transactions...";

    }

}


// =====================================================
// SUMMARY
// =====================================================

function updateSummary() {

    let income = 0;

    let expenses = 0;

    allTransactions.forEach(
        transaction => {

            const amount =
                Number(transaction.amount) || 0;

            const type =
                normalizeType(
                    transaction.type
                );

            if (type === "income") {

                income += amount;

            }

            if (type === "expense") {

                expenses += amount;

            }

        }
    );

    const balance =
        income - expenses;

    if (transactionCount) {

        transactionCount.textContent =
            allTransactions.length;

    }

    if (transactionIncome) {

        transactionIncome.textContent =
            formatCurrency(income);

    }

    if (transactionExpenses) {

        transactionExpenses.textContent =
            formatCurrency(expenses);

    }

    if (transactionBalance) {

        transactionBalance.textContent =
            formatCurrency(balance);

    }

}


// =====================================================
// CATEGORY FILTER
// =====================================================

function updateCategoryFilter() {

    if (!categoryFilter) return;

    const previousValue =
        categoryFilter.value;

    const categories =
        [
            ...new Set(
                allTransactions
                    .map(
                        transaction =>
                            transaction.category
                    )
                    .filter(Boolean)
            )
        ].sort(
            (a, b) =>
                a.localeCompare(b)
        );

    categoryFilter.innerHTML = `
        <option value="all">
            All Categories
        </option>
    `;

    categories.forEach(category => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            category;

        option.textContent =
            category;

        categoryFilter.appendChild(
            option
        );

    });

    const stillExists =
        categories.includes(
            previousValue
        );

    if (
        previousValue === "all" ||
        stillExists
    ) {

        categoryFilter.value =
            previousValue;

    }

}


// =====================================================
// FILTER TRANSACTIONS
// =====================================================

function applyFilters() {

    const searchValue =
        transactionSearch
            ?.value
            .trim()
            .toLowerCase() || "";

    const selectedType =
        typeFilter?.value || "all";

    const selectedCategory =
        categoryFilter?.value || "all";

    const fromDate =
        dateFrom?.value || "";

    const toDate =
        dateTo?.value || "";

    filteredTransactions =
        allTransactions.filter(
            transaction => {

                const title =
                    String(
                        transaction.title || ""
                    ).toLowerCase();

                const category =
                    String(
                        transaction.category || ""
                    ).toLowerCase();

                const payment =
                    String(
                        transaction.paymentMethod || ""
                    ).toLowerCase();

                const notes =
                    String(
                        transaction.notes || ""
                    ).toLowerCase();

                const transactionType =
                    normalizeType(
                        transaction.type
                    );

                const transactionDate =
                    String(
                        transaction.date || ""
                    );

                const matchesSearch =
                    !searchValue ||
                    title.includes(searchValue) ||
                    category.includes(searchValue) ||
                    payment.includes(searchValue) ||
                    notes.includes(searchValue);

                const matchesType =
                    selectedType === "all" ||
                    transactionType ===
                        selectedType;

                const matchesCategory =
                    selectedCategory === "all" ||
                    transaction.category ===
                        selectedCategory;

                const matchesFromDate =
                    !fromDate ||
                    (
                        transactionDate &&
                        transactionDate >=
                            fromDate
                    );

                const matchesToDate =
                    !toDate ||
                    (
                        transactionDate &&
                        transactionDate <=
                            toDate
                    );

                return (
                    matchesSearch &&
                    matchesType &&
                    matchesCategory &&
                    matchesFromDate &&
                    matchesToDate
                );

            }
        );

    renderTransactions();

}


// =====================================================
// RENDER TRANSACTIONS
// =====================================================

function renderTransactions() {

    if (resultCount) {

        if (
            filteredTransactions.length ===
            allTransactions.length
        ) {

            resultCount.textContent =
                `${allTransactions.length} transaction${
                    allTransactions.length === 1
                        ? ""
                        : "s"
                }`;

        }

        else {

            resultCount.textContent =
                `${filteredTransactions.length} of ${allTransactions.length} transactions`;

        }

    }

    if (
        filteredTransactions.length === 0
    ) {

        if (transactionsTableBody) {

            transactionsTableBody.innerHTML =
                "";

        }

        if (mobileTransactionList) {

            mobileTransactionList.innerHTML =
                "";

        }

        if (transactionsEmptyState) {

            transactionsEmptyState.hidden =
                false;

        }

        return;

    }

    if (transactionsEmptyState) {

        transactionsEmptyState.hidden =
            true;

    }

    renderDesktopTable();

    renderMobileCards();

}


// =====================================================
// DESKTOP TABLE
// =====================================================

function renderDesktopTable() {

    if (!transactionsTableBody) return;

    transactionsTableBody.innerHTML =
        filteredTransactions
            .map(
                transaction =>
                    createTableRow(
                        transaction
                    )
            )
            .join("");

}


// =====================================================
// CREATE TABLE ROW
// =====================================================

function createTableRow(transaction) {

    const type =
        normalizeType(
            transaction.type
        );

    const safeType =
        type === "income"
            ? "income"
            : "expense";

    const sign =
        safeType === "income"
            ? "+"
            : "-";

    const title =
        escapeHTML(
            transaction.title ||
            "Untitled"
        );

    const notes =
        escapeHTML(
            transaction.notes || ""
        );

    const category =
        escapeHTML(
            transaction.category ||
            "Other"
        );

    const payment =
        escapeHTML(
            transaction.paymentMethod ||
            "Other"
        );

    const date =
        transaction.date
            ? formatDate(
                transaction.date
            )
            : "--";

    return `
        <tr>

            <td>

                <div class="transaction-name">

                    <strong>
                        ${title}
                    </strong>

                    ${
                        notes
                            ? `
                                <small>
                                    ${notes}
                                </small>
                              `
                            : ""
                    }

                </div>

            </td>


            <td>

                <span class="category-badge">
                    ${category}
                </span>

            </td>


            <td>
                ${escapeHTML(date)}
            </td>


            <td>
                ${payment}
            </td>


            <td>

                <span
                    class="type-badge ${safeType}"
                >
                    ${safeType}
                </span>

            </td>


            <td>

                <span
                    class="transaction-amount ${safeType}"
                >
                    ${sign}${formatCurrency(
                        Number(
                            transaction.amount
                        ) || 0
                    )}
                </span>

            </td>


            <td>

                <div class="transaction-actions">

                    <button
                        type="button"
                        class="edit-transaction-btn"
                        data-action="edit"
                        data-id="${escapeHTML(
                            transaction.id
                        )}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="delete-transaction-btn"
                        data-action="delete"
                        data-id="${escapeHTML(
                            transaction.id
                        )}"
                    >
                        Delete
                    </button>

                </div>

            </td>

        </tr>
    `;

}


// =====================================================
// MOBILE CARDS
// =====================================================

function renderMobileCards() {

    if (!mobileTransactionList) return;

    mobileTransactionList.innerHTML =
        filteredTransactions
            .map(
                transaction =>
                    createMobileCard(
                        transaction
                    )
            )
            .join("");

}


// =====================================================
// CREATE MOBILE CARD
// =====================================================

function createMobileCard(transaction) {

    const type =
        normalizeType(
            transaction.type
        );

    const safeType =
        type === "income"
            ? "income"
            : "expense";

    const sign =
        safeType === "income"
            ? "+"
            : "-";

    const title =
        escapeHTML(
            transaction.title ||
            "Untitled"
        );

    const category =
        escapeHTML(
            transaction.category ||
            "Other"
        );

    const payment =
        escapeHTML(
            transaction.paymentMethod ||
            "Other"
        );

    const date =
        transaction.date
            ? formatDate(
                transaction.date
            )
            : "--";

    return `
        <article
            class="mobile-transaction-card"
        >

            <div class="mobile-transaction-top">

                <div class="mobile-transaction-title">

                    <strong>
                        ${title}
                    </strong>

                    <small>
                        ${category}
                    </small>

                </div>


                <span
                    class="transaction-amount ${safeType}"
                >
                    ${sign}${formatCurrency(
                        Number(
                            transaction.amount
                        ) || 0
                    )}
                </span>

            </div>


            <div class="mobile-transaction-details">

                <div class="mobile-detail">

                    <span>
                        Date
                    </span>

                    <strong>
                        ${escapeHTML(date)}
                    </strong>

                </div>


                <div class="mobile-detail">

                    <span>
                        Payment
                    </span>

                    <strong>
                        ${payment}
                    </strong>

                </div>


                <div class="mobile-detail">

                    <span>
                        Type
                    </span>

                    <strong>
                        ${safeType}
                    </strong>

                </div>


                <div class="mobile-detail">

                    <span>
                        Category
                    </span>

                    <strong>
                        ${category}
                    </strong>

                </div>

            </div>


            <div class="mobile-transaction-actions">

                <button
                    type="button"
                    class="edit-transaction-btn"
                    data-action="edit"
                    data-id="${escapeHTML(
                        transaction.id
                    )}"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="delete-transaction-btn"
                    data-action="delete"
                    data-id="${escapeHTML(
                        transaction.id
                    )}"
                >
                    Delete
                </button>

            </div>

        </article>
    `;

}


// =====================================================
// SEARCH + FILTER EVENTS
// =====================================================

transactionSearch?.addEventListener(
    "input",
    applyFilters
);

typeFilter?.addEventListener(
    "change",
    applyFilters
);

categoryFilter?.addEventListener(
    "change",
    applyFilters
);

dateFrom?.addEventListener(
    "change",
    applyFilters
);

dateTo?.addEventListener(
    "change",
    applyFilters
);


// =====================================================
// CLEAR FILTERS
// =====================================================

clearFiltersButton?.addEventListener(
    "click",
    () => {

        if (transactionSearch) {

            transactionSearch.value = "";

        }

        if (typeFilter) {

            typeFilter.value = "all";

        }

        if (categoryFilter) {

            categoryFilter.value = "all";

        }

        if (dateFrom) {

            dateFrom.value = "";

        }

        if (dateTo) {

            dateTo.value = "";

        }

        applyFilters();

    }
);


// =====================================================
// ACTION DELEGATION
// Works for desktop + mobile buttons.
// =====================================================

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-action][data-id]"
            );

        if (!button) return;

        const id =
            button.dataset.id;

        const action =
            button.dataset.action;

        if (action === "edit") {

            openEditModal(id);

        }

        if (action === "delete") {

            openDeleteModal(id);

        }

    }
);


// =====================================================
// EDIT CATEGORY OPTIONS
// =====================================================

function loadEditCategories(
    type,
    selectedCategory = ""
) {

    if (!editTransactionCategory) return;

    const categories =
        type === "income"
            ? incomeCategories
            : expenseCategories;

    editTransactionCategory.innerHTML =
        "";

    categories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                category;

            option.textContent =
                category;

            if (
                category ===
                selectedCategory
            ) {

                option.selected =
                    true;

            }

            editTransactionCategory
                .appendChild(option);

        }
    );

}


// =====================================================
// OPEN EDIT MODAL
// =====================================================

function openEditModal(id) {

    const transaction =
        getTransactionById(id);

    if (!transaction) return;

    editingTransactionId = id;

    const type =
        normalizeType(
            transaction.type
        ) === "income"
            ? "income"
            : "expense";

    editTransactionTitle.value =
        transaction.title || "";

    editTransactionAmount.value =
        Number(transaction.amount) || "";

    editTransactionType.value =
        type;

    loadEditCategories(
        type,
        transaction.category
    );

    editTransactionDate.value =
        transaction.date || "";

    editPaymentMethod.value =
        transaction.paymentMethod ||
        "Other";

    editTransactionNotes.value =
        transaction.notes || "";

    editTransactionMessage.textContent =
        "";

    editTransactionMessage.className =
        "transaction-message";

    editTransactionModal.style.display =
        "flex";

    editTransactionTitle.focus();

}


// =====================================================
// CHANGE EDIT TYPE
// =====================================================

editTransactionType?.addEventListener(
    "change",
    () => {

        loadEditCategories(
            editTransactionType.value
        );

    }
);


// =====================================================
// CLOSE EDIT MODAL
// =====================================================

function closeEditModal() {

    if (!editTransactionModal) return;

    editTransactionModal.style.display =
        "none";

    editTransactionForm?.reset();

    editingTransactionId = null;

    if (editTransactionMessage) {

        editTransactionMessage.textContent =
            "";

        editTransactionMessage.className =
            "transaction-message";

    }

}


// =====================================================
// EDIT MODAL CLOSE EVENTS
// =====================================================

closeEditModalButton?.addEventListener(
    "click",
    closeEditModal
);

cancelEditButton?.addEventListener(
    "click",
    closeEditModal
);

editTransactionModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            editTransactionModal
        ) {

            closeEditModal();

        }

    }
);


// =====================================================
// UPDATE TRANSACTION
// =====================================================

editTransactionForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        if (
            !currentUser ||
            !editingTransactionId
        ) {

            return;

        }

        const title =
            editTransactionTitle.value
                .trim();

        const amount =
            Number(
                editTransactionAmount.value
            );

        const type =
            normalizeType(
                editTransactionType.value
            );

        const category =
            editTransactionCategory.value;

        const date =
            editTransactionDate.value;

        const paymentMethod =
            editPaymentMethod.value;

        const notes =
            editTransactionNotes.value
                .trim();

        if (!title) {

            showEditError(
                "Please enter a transaction title."
            );

            return;

        }

        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            showEditError(
                "Please enter a valid amount."
            );

            return;

        }

        if (
            type !== "income" &&
            type !== "expense"
        ) {

            showEditError(
                "Please select a valid transaction type."
            );

            return;

        }

        if (
            !category ||
            !date ||
            !paymentMethod
        ) {

            showEditError(
                "Please complete all required fields."
            );

            return;

        }

        updateTransactionButton.disabled =
            true;

        updateTransactionButton.textContent =
            "Updating...";

        editTransactionMessage.textContent =
            "Updating transaction...";

        editTransactionMessage.className =
            "transaction-message";

        try {

            const transactionReference =
                doc(
                    db,
                    "users",
                    currentUser.uid,
                    "transactions",
                    editingTransactionId
                );

            await updateDoc(
                transactionReference,
                {
                    title,
                    amount,
                    type,
                    category,
                    date,
                    paymentMethod,
                    notes,

                    updatedAt:
                        serverTimestamp()
                }
            );

            editTransactionMessage.textContent =
                "Transaction updated successfully.";

            editTransactionMessage.className =
                "transaction-message success";

            await loadAllTransactions();

            setTimeout(
                closeEditModal,
                500
            );

        }

        catch (error) {

            console.error(
                "Update error:",
                error
            );

            showEditError(
                "Unable to update transaction. Please try again."
            );

        }

        finally {

            updateTransactionButton.disabled =
                false;

            updateTransactionButton.textContent =
                "Update Transaction";

        }

    }
);


// =====================================================
// EDIT ERROR
// =====================================================

function showEditError(message) {

    if (!editTransactionMessage) return;

    editTransactionMessage.textContent =
        message;

    editTransactionMessage.className =
        "transaction-message error";

}


// =====================================================
// OPEN DELETE MODAL
// =====================================================

function openDeleteModal(id) {

    const transaction =
        getTransactionById(id);

    if (!transaction) return;

    deletingTransactionId = id;

    const type =
        normalizeType(
            transaction.type
        );

    const sign =
        type === "income"
            ? "+"
            : "-";

    deleteTransactionPreview.textContent =
        `${transaction.title || "Transaction"} — ${sign}${formatCurrency(
            Number(transaction.amount) || 0
        )}`;

    deleteMessage.textContent =
        "";

    deleteMessage.className =
        "transaction-message";

    deleteModal.style.display =
        "flex";

}


// =====================================================
// CLOSE DELETE MODAL
// =====================================================

function closeDeleteModal() {

    if (!deleteModal) return;

    deleteModal.style.display =
        "none";

    deletingTransactionId = null;

    if (deleteTransactionPreview) {

        deleteTransactionPreview.textContent =
            "";

    }

    if (deleteMessage) {

        deleteMessage.textContent =
            "";

        deleteMessage.className =
            "transaction-message";

    }

}


// =====================================================
// DELETE MODAL EVENTS
// =====================================================

cancelDeleteButton?.addEventListener(
    "click",
    closeDeleteModal
);

deleteModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            deleteModal
        ) {

            closeDeleteModal();

        }

    }
);


// =====================================================
// CONFIRM DELETE
// =====================================================

confirmDeleteButton?.addEventListener(
    "click",
    async () => {

        if (
            !currentUser ||
            !deletingTransactionId
        ) {

            return;

        }

        confirmDeleteButton.disabled =
            true;

        confirmDeleteButton.textContent =
            "Deleting...";

        deleteMessage.textContent =
            "Deleting transaction...";

        deleteMessage.className =
            "transaction-message";

        try {

            const transactionReference =
                doc(
                    db,
                    "users",
                    currentUser.uid,
                    "transactions",
                    deletingTransactionId
                );

            await deleteDoc(
                transactionReference
            );

            deleteMessage.textContent =
                "Transaction deleted.";

            deleteMessage.className =
                "transaction-message success";

            await loadAllTransactions();

            setTimeout(
                closeDeleteModal,
                400
            );

        }

        catch (error) {

            console.error(
                "Delete error:",
                error
            );

            deleteMessage.textContent =
                "Unable to delete transaction. Please try again.";

            deleteMessage.className =
                "transaction-message error";

        }

        finally {

            confirmDeleteButton.disabled =
                false;

            confirmDeleteButton.textContent =
                "Delete";

        }

    }
);


// =====================================================
// ESCAPE KEY
// =====================================================

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {

            return;

        }

        if (
            editTransactionModal?.style
                .display === "flex"
        ) {

            closeEditModal();

        }

        if (
            deleteModal?.style
                .display === "flex"
        ) {

            closeDeleteModal();

        }

    }
);