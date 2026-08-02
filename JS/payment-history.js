// =====================================================
// PAYMENT-HISTORY.JS
// Expense Tracker - Day 12
// Payment Confirmation + UTR + Expense Integration
// =====================================================


// =====================================================
// FIREBASE
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
    addDoc,
    getDocs,
    doc,
    updateDoc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";


// =====================================================
// STATE
// =====================================================

let currentUser = null;
let payments = [];
let filteredPayments = [];
let selectedPayment = null;
let toastTimer = null;


// =====================================================
// DOM HELPER
// =====================================================

const byId = id => document.getElementById(id);


// =====================================================
// PAGE
// =====================================================

const paymentHistoryPage = byId("paymentHistoryPage");
const historyPageLoading = byId("historyPageLoading");


// =====================================================
// SIDEBAR
// =====================================================

const sidebar = document.querySelector(".sidebar");
const menuButton = byId("menuButton");
const userEmail = byId("userEmail");
const userAvatar = byId("userAvatar");
const logoutButton = byId("logoutButton");


// =====================================================
// SUMMARY
// =====================================================

const totalPaymentsCount = byId("totalPaymentsCount");
const totalPaymentsAmount = byId("totalPaymentsAmount");

const confirmedPaymentsCount = byId("confirmedPaymentsCount");
const confirmedPaymentsAmount = byId("confirmedPaymentsAmount");

const pendingPaymentsCount = byId("pendingPaymentsCount");
const failedPaymentsCount = byId("failedPaymentsCount");


// =====================================================
// FILTERS
// =====================================================

const paymentSearchInput = byId("paymentSearchInput");
const paymentStatusFilter = byId("paymentStatusFilter");
const expenseStatusFilter = byId("expenseStatusFilter");
const paymentSortFilter = byId("paymentSortFilter");

const clearHistoryFiltersButton =
    byId("clearHistoryFiltersButton");

const refreshPaymentsButton =
    byId("refreshPaymentsButton");

const visiblePaymentsCount =
    byId("visiblePaymentsCount");

const allPaymentsCount =
    byId("allPaymentsCount");


// =====================================================
// HISTORY
// =====================================================

const paymentTableContainer =
    byId("paymentTableContainer");

const paymentHistoryTableBody =
    byId("paymentHistoryTableBody");

const paymentHistoryMobileList =
    byId("paymentHistoryMobileList");

const paymentHistoryEmptyState =
    byId("paymentHistoryEmptyState");

const paymentHistoryEmptyText =
    byId("paymentHistoryEmptyText");

const paymentHistoryLoadingState =
    byId("paymentHistoryLoadingState");


// =====================================================
// DETAILS MODAL
// =====================================================

const paymentDetailsModal =
    byId("paymentDetailsModal");

const paymentDetailsBackdrop =
    byId("paymentDetailsBackdrop");

const closePaymentDetailsButton =
    byId("closePaymentDetailsButton");

const detailCloseButton =
    byId("detailCloseButton");

const detailPaymentAmount =
    byId("detailPaymentAmount");

const detailPaymentStatus =
    byId("detailPaymentStatus");

const detailRecipient =
    byId("detailRecipient");

const detailUpiId =
    byId("detailUpiId");

const detailPaymentAddressLabel =
    byId("detailPaymentAddressLabel");

const detailDate =
    byId("detailDate");

const detailTime =
    byId("detailTime");

const detailExpenseStatus =
    byId("detailExpenseStatus");

const detailPaymentId =
    byId("detailPaymentId");

const detailPaymentNote =
    byId("detailPaymentNote");

const detailTransactionId =
    byId("detailTransactionId");

const detailExpenseId =
    byId("detailExpenseId");

const detailRecordExpenseButton =
    byId("detailRecordExpenseButton");


// =====================================================
// CONFIRM PAYMENT MODAL
// =====================================================

const confirmPaymentModal =
    byId("confirmPaymentModal");

const confirmPaymentBackdrop =
    byId("confirmPaymentBackdrop");

const closeConfirmPaymentButton =
    byId("closeConfirmPaymentButton");

const confirmRecipient =
    byId("confirmRecipient");

const confirmAmount =
    byId("confirmAmount");

const confirmTransactionId =
    byId("confirmTransactionId");

const confirmRecordExpense =
    byId("confirmRecordExpense");

const confirmPaymentMessage =
    byId("confirmPaymentMessage");

const markPaymentFailedButton =
    byId("markPaymentFailedButton");

const keepPaymentPendingButton =
    byId("keepPaymentPendingButton");

const markPaymentConfirmedButton =
    byId("markPaymentConfirmedButton");


// =====================================================
// RECORD EXPENSE MODAL
// =====================================================

const recordExpenseModal =
    byId("recordExpenseModal");

const recordExpenseBackdrop =
    byId("recordExpenseBackdrop");

const closeRecordExpenseButton =
    byId("closeRecordExpenseButton");

const cancelRecordExpenseButton =
    byId("cancelRecordExpenseButton");

const recordExpenseForm =
    byId("recordExpenseForm");

const expenseRecipient =
    byId("expenseRecipient");

const expenseAmount =
    byId("expenseAmount");

const expenseTitle =
    byId("expenseTitle");

const expenseCategory =
    byId("expenseCategory");

const expenseDate =
    byId("expenseDate");

const expenseNote =
    byId("expenseNote");

const expensePaymentReference =
    byId("expensePaymentReference");

const recordExpenseMessage =
    byId("recordExpenseMessage");

const saveExpenseButton =
    byId("saveExpenseButton");


// =====================================================
// TOAST
// =====================================================

const historyToast =
    byId("historyToast");


// =====================================================
// AUTHENTICATION
// =====================================================

onAuthStateChanged(auth, async user => {

    if (!user) {

        window.location.replace(
            "login.html"
        );

        return;
    }

    currentUser = user;

    updateUserInterface();

    if (paymentHistoryPage) {
        paymentHistoryPage.style.display = "flex";
    }

    hidePageLoading();

    await loadPayments();
});


// =====================================================
// USER INTERFACE
// =====================================================

function updateUserInterface() {

    if (!currentUser) {
        return;
    }

    const email =
        currentUser.email || "User";

    const name =
        currentUser.displayName?.trim() ||
        email.split("@")[0] ||
        "User";

    if (userEmail) {
        userEmail.textContent = email;
    }

    if (userAvatar) {

        userAvatar.textContent =
            name.charAt(0).toUpperCase();
    }
}


// =====================================================
// LOAD PAYMENTS
// =====================================================

async function loadPayments() {

    if (!currentUser) {
        return;
    }

    showListLoading();

    try {

        const paymentsReference =
            collection(
                db,
                "users",
                currentUser.uid,
                "payments"
            );

        const paymentsQuery =
            query(
                paymentsReference,
                orderBy(
                    "createdAt",
                    "desc"
                )
            );

        const snapshot =
            await getDocs(
                paymentsQuery
            );

        payments = [];

        snapshot.forEach(documentSnapshot => {

            payments.push(
                normalizePayment(
                    documentSnapshot.id,
                    documentSnapshot.data()
                )
            );
        });

        updateSummary();
        applyFilters();

    } catch (error) {

        console.error(
            "Load payments error:",
            error
        );

        payments = [];

        updateSummary();
        applyFilters();

        showToast(
            "Unable to load payment history.",
            "error"
        );

    } finally {

        hideListLoading();
    }
}


// =====================================================
// NORMALIZE PAYMENT
// =====================================================

function normalizePayment(id, data) {

    const amount =
        Number(data.amount);

    return {

        id,

        recipient:
            String(
                data.recipient ||
                data.recipientName ||
                "Unknown Recipient"
            ).trim(),

        recipientType:
            String(
                data.recipientType || ""
            ).trim(),

        paymentAddress:
            String(
                data.paymentAddress || ""
            ).trim(),

        upiId:
            String(
                data.upiId || ""
            ).trim(),

        upiNumber:
            String(
                data.upiNumber || ""
            ).trim(),

        amount:
            Number.isFinite(amount)
                ? amount
                : 0,

        note:
            String(
                data.note || ""
            ).trim(),

        source:
            String(
                data.source || ""
            ).trim(),

        status:
            normalizeStatus(
                data.status
            ),

        transactionId:
            String(
                data.transactionId || ""
            ).trim(),

        expenseId:
            String(
                data.expenseId || ""
            ).trim(),

        expenseRecorded:
            data.expenseRecorded === true,

        createdAt:
            data.createdAt || null,

        updatedAt:
            data.updatedAt || null,

        confirmedAt:
            data.confirmedAt || null,

        expenseRecordedAt:
            data.expenseRecordedAt || null
    };
}


// =====================================================
// STATUS
// =====================================================

function normalizeStatus(status) {

    const value =
        String(
            status || "pending"
        )
            .trim()
            .toLowerCase();

    if (value === "confirmed") {
        return "confirmed";
    }

    if (
        value === "failed" ||
        value === "cancelled"
    ) {
        return "failed";
    }

    return "pending";
}


function getStatusLabel(status) {

    if (status === "confirmed") {
        return "Confirmed";
    }

    if (status === "failed") {
        return "Failed / Cancelled";
    }

    return "Pending";
}


// =====================================================
// PAYMENT ADDRESS
// =====================================================

function getPaymentAddress(payment) {

    if (payment.paymentAddress) {
        return payment.paymentAddress;
    }

    if (payment.upiId) {
        return payment.upiId;
    }

    if (payment.upiNumber) {
        return payment.upiNumber;
    }

    return "";
}


function getPaymentAddressLabel(payment) {

    const type =
        String(
            payment.recipientType || ""
        ).toLowerCase();

    if (
        type.includes("number") ||
        (
            payment.upiNumber &&
            !payment.upiId
        )
    ) {
        return "UPI Number";
    }

    return "UPI ID";
}


// =====================================================
// SUMMARY
// =====================================================

function updateSummary() {

    const totalCount =
        payments.length;

    const totalAmount =
        payments.reduce(
            (total, payment) =>
                total + payment.amount,
            0
        );

    const confirmed =
        payments.filter(
            payment =>
                payment.status ===
                "confirmed"
        );

    const confirmedAmount =
        confirmed.reduce(
            (total, payment) =>
                total + payment.amount,
            0
        );

    const pending =
        payments.filter(
            payment =>
                payment.status ===
                "pending"
        );

    const failed =
        payments.filter(
            payment =>
                payment.status ===
                "failed"
        );

    if (totalPaymentsCount) {
        totalPaymentsCount.textContent =
            String(totalCount);
    }

    if (totalPaymentsAmount) {
        totalPaymentsAmount.textContent =
            `${formatCurrency(totalAmount)} total value`;
    }

    if (confirmedPaymentsCount) {
        confirmedPaymentsCount.textContent =
            String(confirmed.length);
    }

    if (confirmedPaymentsAmount) {
        confirmedPaymentsAmount.textContent =
            `${formatCurrency(confirmedAmount)} confirmed`;
    }

    if (pendingPaymentsCount) {
        pendingPaymentsCount.textContent =
            String(pending.length);
    }

    if (failedPaymentsCount) {
        failedPaymentsCount.textContent =
            String(failed.length);
    }

    if (allPaymentsCount) {
        allPaymentsCount.textContent =
            String(totalCount);
    }
}


// =====================================================
// FILTER EVENTS
// =====================================================

paymentSearchInput?.addEventListener(
    "input",
    applyFilters
);

paymentStatusFilter?.addEventListener(
    "change",
    applyFilters
);

expenseStatusFilter?.addEventListener(
    "change",
    applyFilters
);

paymentSortFilter?.addEventListener(
    "change",
    applyFilters
);


// =====================================================
// APPLY FILTERS
// =====================================================

function applyFilters() {

    const search =
        String(
            paymentSearchInput?.value || ""
        )
            .trim()
            .toLowerCase();

    const status =
        String(
            paymentStatusFilter?.value ||
            "all"
        ).toLowerCase();

    const expenseStatus =
        String(
            expenseStatusFilter?.value ||
            "all"
        ).toLowerCase();

    const sort =
        String(
            paymentSortFilter?.value ||
            "newest"
        ).toLowerCase();

    filteredPayments =
        payments.filter(payment => {

            const searchable =
                [
                    payment.recipient,
                    payment.upiId,
                    payment.upiNumber,
                    payment.paymentAddress,
                    payment.note,
                    payment.transactionId,
                    payment.id
                ]
                    .join(" ")
                    .toLowerCase();

            const matchesSearch =
                !search ||
                searchable.includes(search);

            const matchesStatus =
                status === "all" ||
                payment.status === status;

            let matchesExpense = true;

            if (
                expenseStatus === "recorded"
            ) {
                matchesExpense =
                    payment.expenseRecorded;
            }

            if (
                expenseStatus === "not-recorded" ||
                expenseStatus === "notrecorded"
            ) {
                matchesExpense =
                    !payment.expenseRecorded;
            }

            return (
                matchesSearch &&
                matchesStatus &&
                matchesExpense
            );
        });

    filteredPayments.sort(
        (a, b) => {

            if (
                sort === "oldest" ||
                sort === "oldest-first"
            ) {
                return (
                    getPaymentTime(a) -
                    getPaymentTime(b)
                );
            }

            if (
                sort === "amount-high" ||
                sort === "highest"
            ) {
                return b.amount - a.amount;
            }

            if (
                sort === "amount-low" ||
                sort === "lowest"
            ) {
                return a.amount - b.amount;
            }

            return (
                getPaymentTime(b) -
                getPaymentTime(a)
            );
        }
    );

    if (visiblePaymentsCount) {
        visiblePaymentsCount.textContent =
            String(filteredPayments.length);
    }

    renderPayments();
}


// =====================================================
// CLEAR FILTERS
// =====================================================

clearHistoryFiltersButton?.addEventListener(
    "click",
    () => {

        if (paymentSearchInput) {
            paymentSearchInput.value = "";
        }

        if (paymentStatusFilter) {
            paymentStatusFilter.value = "all";
        }

        if (expenseStatusFilter) {
            expenseStatusFilter.value = "all";
        }

        if (paymentSortFilter) {
            paymentSortFilter.selectedIndex = 0;
        }

        applyFilters();
    }
);


// =====================================================
// REFRESH
// =====================================================

refreshPaymentsButton?.addEventListener(
    "click",
    async () => {

        refreshPaymentsButton.disabled =
            true;

        try {

            await loadPayments();

            showToast(
                "Payment history refreshed.",
                "success"
            );

        } finally {

            refreshPaymentsButton.disabled =
                false;
        }
    }
);


// =====================================================
// RENDER PAYMENTS
// =====================================================

function renderPayments() {

    if (paymentHistoryTableBody) {
        paymentHistoryTableBody.innerHTML = "";
    }

    if (paymentHistoryMobileList) {
        paymentHistoryMobileList.innerHTML = "";
    }

    if (filteredPayments.length === 0) {

        showEmptyState();
        return;
    }

    hideEmptyState();

    filteredPayments.forEach(payment => {

        renderDesktopPayment(payment);
        renderMobilePayment(payment);
    });
}


// =====================================================
// DESKTOP PAYMENT ROW
// =====================================================

function renderDesktopPayment(payment) {

    if (!paymentHistoryTableBody) {
        return;
    }

    const row =
        document.createElement("tr");

    const address =
        getPaymentAddress(payment) || "-";

    const note =
        payment.note || "UPI Payment";

    const expenseText =
        payment.expenseRecorded
            ? "Recorded"
            : "Not Recorded";

    row.innerHTML = `
        <td>
            <div class="history-recipient-cell">
                <div class="history-recipient-avatar">
                    ${escapeHtml(getInitial(payment.recipient))}
                </div>

                <div>
                    <strong>
                        ${escapeHtml(payment.recipient)}
                    </strong>

                    <small>
                        ${escapeHtml(address)}
                    </small>
                </div>
            </div>
        </td>

        <td>
            <strong>
                ${escapeHtml(note)}
            </strong>

            <small>
                ID: ${escapeHtml(shortId(payment.id))}
            </small>
        </td>

        <td>
            <strong>
                ${escapeHtml(formatCurrency(payment.amount))}
            </strong>
        </td>

        <td>
            <strong>
                ${escapeHtml(formatDate(payment.createdAt))}
            </strong>

            <small>
                ${escapeHtml(formatTime(payment.createdAt))}
            </small>
        </td>

        <td>
            <span class="history-status-badge ${payment.status}">
                ${escapeHtml(getStatusLabel(payment.status))}
            </span>
        </td>

        <td>
            <span class="history-expense-badge ${payment.expenseRecorded ? "recorded" : ""}">
                ${escapeHtml(expenseText)}
            </span>
        </td>

        <td>
            <div class="history-actions">
                <button
                    type="button"
                    class="history-action-button view-payment"
                    data-payment-id="${escapeHtml(payment.id)}"
                >
                    View
                </button>

                <button
                    type="button"
                    class="history-action-button confirm-payment"
                    data-payment-id="${escapeHtml(payment.id)}"
                >
                    ${
                        payment.status === "confirmed"
                            ? "Edit"
                            : "Confirm"
                    }
                </button>
            </div>
        </td>
    `;

    paymentHistoryTableBody.appendChild(row);
}


// =====================================================
// MOBILE PAYMENT
// =====================================================

function renderMobilePayment(payment) {

    if (!paymentHistoryMobileList) {
        return;
    }

    const card =
        document.createElement("article");

    card.className =
        "history-mobile-card";

    const address =
        getPaymentAddress(payment) || "-";

    card.innerHTML = `
        <div class="history-mobile-card-top">
            <div>
                <strong>
                    ${escapeHtml(payment.recipient)}
                </strong>

                <small>
                    ${escapeHtml(address)}
                </small>
            </div>

            <strong>
                ${escapeHtml(formatCurrency(payment.amount))}
            </strong>
        </div>

        <div class="history-mobile-meta">
            <span>
                ${escapeHtml(formatDate(payment.createdAt))}
            </span>

            <span class="history-status-badge ${payment.status}">
                ${escapeHtml(getStatusLabel(payment.status))}
            </span>
        </div>

        <div class="history-actions">
            <button
                type="button"
                class="history-action-button view-payment"
                data-payment-id="${escapeHtml(payment.id)}"
            >
                View
            </button>

            <button
                type="button"
                class="history-action-button confirm-payment"
                data-payment-id="${escapeHtml(payment.id)}"
            >
                ${
                    payment.status === "confirmed"
                        ? "Edit"
                        : "Confirm"
                }
            </button>
        </div>
    `;

    paymentHistoryMobileList.appendChild(card);
}


// =====================================================
// HISTORY ACTIONS
// =====================================================

function handleHistoryAction(event) {

    const viewButton =
        event.target.closest(
            ".view-payment"
        );

    if (viewButton) {

        openPaymentDetails(
            viewButton.dataset.paymentId
        );

        return;
    }

    const confirmButton =
        event.target.closest(
            ".confirm-payment"
        );

    if (confirmButton) {

        openConfirmPayment(
            confirmButton.dataset.paymentId
        );
    }
}


paymentHistoryTableBody?.addEventListener(
    "click",
    handleHistoryAction
);

paymentHistoryMobileList?.addEventListener(
    "click",
    handleHistoryAction
);


// =====================================================
// EMPTY STATE
// =====================================================

function showEmptyState() {

    if (paymentHistoryEmptyState) {
        paymentHistoryEmptyState.hidden =
            false;
    }

    if (paymentTableContainer) {
        paymentTableContainer.style.display =
            "none";
    }

    if (paymentHistoryMobileList) {
        paymentHistoryMobileList.style.display =
            "none";
    }

    if (paymentHistoryEmptyText) {

        paymentHistoryEmptyText.textContent =
            payments.length === 0
                ? "Payments you save will appear here."
                : "No payments match the current filters.";
    }
}


function hideEmptyState() {

    if (paymentHistoryEmptyState) {
        paymentHistoryEmptyState.hidden =
            true;
    }

    if (paymentTableContainer) {
        paymentTableContainer.style.display =
            "";
    }

    if (paymentHistoryMobileList) {
        paymentHistoryMobileList.style.display =
            "";
    }
}


// =====================================================
// DETAILS MODAL
// =====================================================

function openPaymentDetails(paymentId) {

    const payment =
        findPayment(paymentId);

    if (!payment) {
        return;
    }

    selectedPayment = payment;

    if (detailPaymentAmount) {

        detailPaymentAmount.textContent =
            formatCurrency(payment.amount);
    }

    if (detailPaymentStatus) {

        detailPaymentStatus.textContent =
            getStatusLabel(
                payment.status
            );

        detailPaymentStatus.className =
            `history-status-badge ${payment.status}`;
    }

    if (detailRecipient) {
        detailRecipient.textContent =
            payment.recipient;
    }

    if (detailPaymentAddressLabel) {

        detailPaymentAddressLabel.textContent =
            getPaymentAddressLabel(
                payment
            );
    }

    if (detailUpiId) {

        detailUpiId.textContent =
            getPaymentAddress(payment) ||
            "-";
    }

    if (detailDate) {

        detailDate.textContent =
            formatDate(
                payment.createdAt
            );
    }

    if (detailTime) {

        detailTime.textContent =
            formatTime(
                payment.createdAt
            );
    }

    if (detailExpenseStatus) {

        detailExpenseStatus.textContent =
            payment.expenseRecorded
                ? "Recorded"
                : "Not Recorded";
    }

    if (detailPaymentId) {
        detailPaymentId.textContent =
            payment.id;
    }

    if (detailPaymentNote) {

        detailPaymentNote.textContent =
            payment.note ||
            "No note";
    }

    if (detailTransactionId) {

        detailTransactionId.textContent =
            payment.transactionId ||
            "Not Added";
    }

    if (detailExpenseId) {

        detailExpenseId.textContent =
            payment.expenseId ||
            "-";
    }

    if (detailRecordExpenseButton) {

        const canRecord =
            payment.status ===
                "confirmed" &&
            !payment.expenseRecorded;

        detailRecordExpenseButton.disabled =
            !canRecord;

        detailRecordExpenseButton.textContent =
            payment.expenseRecorded
                ? "Expense Recorded"
                : payment.status !==
                    "confirmed"
                    ? "Confirm Payment First"
                    : "Record as Expense";
    }

    openModal(
        paymentDetailsModal
    );
}


// =====================================================
// DETAILS EVENTS
// =====================================================

closePaymentDetailsButton?.addEventListener(
    "click",
    () =>
        closeModal(
            paymentDetailsModal
        )
);

detailCloseButton?.addEventListener(
    "click",
    () =>
        closeModal(
            paymentDetailsModal
        )
);

paymentDetailsBackdrop?.addEventListener(
    "click",
    () =>
        closeModal(
            paymentDetailsModal
        )
);


detailRecordExpenseButton?.addEventListener(
    "click",
    () => {

        if (!selectedPayment) {
            return;
        }

        const paymentId =
            selectedPayment.id;

        closeModal(
            paymentDetailsModal
        );

        openRecordExpense(
            paymentId
        );
    }
);


// =====================================================
// OPEN CONFIRM PAYMENT
// =====================================================

function openConfirmPayment(paymentId) {

    const payment =
        findPayment(paymentId);

    if (!payment) {
        return;
    }

    selectedPayment = payment;

    clearConfirmMessage();

    if (confirmRecipient) {
        confirmRecipient.textContent =
            payment.recipient;
    }

    if (confirmAmount) {

        confirmAmount.textContent =
            formatCurrency(
                payment.amount
            );
    }

    if (confirmTransactionId) {

        confirmTransactionId.value =
            payment.transactionId ||
            "";
    }

    if (confirmRecordExpense) {

        confirmRecordExpense.checked =
            payment.status !== "failed" &&
            !payment.expenseRecorded;
    }

    if (markPaymentConfirmedButton) {

        markPaymentConfirmedButton.textContent =
            payment.status === "confirmed"
                ? "Save Confirmation"
                : "Confirm Payment";
    }

    openModal(
        confirmPaymentModal
    );
}


// =====================================================
// CONFIRM MODAL EVENTS
// =====================================================

closeConfirmPaymentButton?.addEventListener(
    "click",
    () =>
        closeModal(
            confirmPaymentModal
        )
);

confirmPaymentBackdrop?.addEventListener(
    "click",
    () =>
        closeModal(
            confirmPaymentModal
        )
);


// =====================================================
// KEEP PENDING
// =====================================================

keepPaymentPendingButton?.addEventListener(
    "click",
    async () => {

        if (!selectedPayment) {
            return;
        }

        if (
            selectedPayment.expenseRecorded
        ) {

            showConfirmMessage(
                "This payment is already recorded as an expense and cannot be returned to pending.",
                "error"
            );

            return;
        }

        await updatePaymentStatus(
            selectedPayment.id,
            "pending"
        );
    }
);


// =====================================================
// MARK FAILED
// =====================================================

markPaymentFailedButton?.addEventListener(
    "click",
    async () => {

        if (!selectedPayment) {
            return;
        }

        if (
            selectedPayment.expenseRecorded
        ) {

            showConfirmMessage(
                "This payment is already recorded as an expense and cannot be marked failed.",
                "error"
            );

            return;
        }

        await updatePaymentStatus(
            selectedPayment.id,
            "failed"
        );
    }
);


// =====================================================
// CONFIRM PAYMENT
// =====================================================

markPaymentConfirmedButton?.addEventListener(
    "click",
    async () => {

        if (
            !currentUser ||
            !selectedPayment
        ) {
            return;
        }

        clearConfirmMessage();

        const paymentId =
            selectedPayment.id;

        const transactionId =
            String(
                confirmTransactionId?.value ||
                ""
            ).trim();

        const recordAsExpense =
            confirmRecordExpense?.checked ===
            true;

        setStatusButtonsDisabled(true);

        setButtonLoading(
            markPaymentConfirmedButton,
            true
        );

        try {

            const paymentReference =
                doc(
                    db,
                    "users",
                    currentUser.uid,
                    "payments",
                    paymentId
                );

            await updateDoc(
                paymentReference,
                {
                    status:
                        "confirmed",

                    transactionId,

                    confirmedAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()
                }
            );

            const payment =
                findPayment(
                    paymentId
                );

            if (payment) {

                payment.status =
                    "confirmed";

                payment.transactionId =
                    transactionId;
            }

            closeModal(
                confirmPaymentModal
            );

            updateSummary();
            applyFilters();

            showToast(
                transactionId
                    ? "Payment confirmed and UPI transaction ID saved."
                    : "Payment marked as confirmed.",
                "success"
            );

            if (
                recordAsExpense &&
                payment &&
                !payment.expenseRecorded
            ) {

                selectedPayment =
                    payment;

                openRecordExpense(
                    paymentId
                );

                return;
            }

            selectedPayment = null;

        } catch (error) {

            console.error(
                "Confirm payment error:",
                error
            );

            showConfirmMessage(
                "Unable to confirm this payment. Please try again.",
                "error"
            );

        } finally {

            setStatusButtonsDisabled(false);

            setButtonLoading(
                markPaymentConfirmedButton,
                false
            );
        }
    }
);


// =====================================================
// UPDATE PAYMENT STATUS
// =====================================================

async function updatePaymentStatus(
    paymentId,
    status
) {

    if (!currentUser) {
        return;
    }

    setStatusButtonsDisabled(true);

    try {

        const payment =
            findPayment(paymentId);

        if (!payment) {

            throw new Error(
                "Payment not found."
            );
        }

        if (
            payment.expenseRecorded &&
            status !== "confirmed"
        ) {

            showConfirmMessage(
                "A payment already recorded as an expense must remain confirmed.",
                "error"
            );

            return;
        }

        const paymentReference =
            doc(
                db,
                "users",
                currentUser.uid,
                "payments",
                paymentId
            );

        const updateData = {

            status,

            updatedAt:
                serverTimestamp()
        };

        if (status === "confirmed") {

            updateData.confirmedAt =
                serverTimestamp();
        }

        await updateDoc(
            paymentReference,
            updateData
        );

        payment.status =
            status;

        closeModal(
            confirmPaymentModal
        );

        selectedPayment = null;

        updateSummary();
        applyFilters();

        showToast(
            status === "confirmed"
                ? "Payment marked as confirmed."
                : status === "failed"
                    ? "Payment marked as failed / cancelled."
                    : "Payment kept pending.",
            "success"
        );

    } catch (error) {

        console.error(
            "Update payment status error:",
            error
        );

        showConfirmMessage(
            "Unable to update payment status.",
            "error"
        );

    } finally {

        setStatusButtonsDisabled(false);
    }
}


// =====================================================
// STATUS BUTTONS
// =====================================================

function setStatusButtonsDisabled(
    disabled
) {

    if (markPaymentFailedButton) {
        markPaymentFailedButton.disabled =
            disabled;
    }

    if (keepPaymentPendingButton) {
        keepPaymentPendingButton.disabled =
            disabled;
    }

    if (markPaymentConfirmedButton) {
        markPaymentConfirmedButton.disabled =
            disabled;
    }
}


function setButtonLoading(
    button,
    loading
) {

    if (!button) {
        return;
    }

    button.classList.toggle(
        "is-loading",
        loading
    );
}


// =====================================================
// CONFIRM MESSAGE
// =====================================================

function showConfirmMessage(
    message,
    type = "info"
) {

    if (!confirmPaymentMessage) {
        return;
    }

    confirmPaymentMessage.textContent =
        message;

    confirmPaymentMessage.className =
        `history-form-message visible ${type}`;
}


function clearConfirmMessage() {

    if (!confirmPaymentMessage) {
        return;
    }

    confirmPaymentMessage.textContent =
        "";

    confirmPaymentMessage.className =
        "history-form-message";
}


// =====================================================
// OPEN RECORD EXPENSE
// =====================================================

function openRecordExpense(paymentId) {

    const payment =
        findPayment(paymentId);

    if (!payment) {
        return;
    }

    if (
        payment.status !==
        "confirmed"
    ) {

        showToast(
            "Confirm the payment before recording it as an expense.",
            "error"
        );

        return;
    }

    if (payment.expenseRecorded) {

        showToast(
            "This payment has already been recorded as an expense.",
            "info"
        );

        return;
    }

    selectedPayment = payment;

    recordExpenseForm?.reset();

    clearExpenseMessage();

    if (expenseRecipient) {
        expenseRecipient.textContent =
            payment.recipient;
    }

    if (expenseAmount) {

        expenseAmount.textContent =
            formatCurrency(
                payment.amount
            );
    }

    if (expenseTitle) {

        expenseTitle.value =
            payment.note ||
            `Payment to ${payment.recipient}`;
    }

    if (expenseNote) {

        expenseNote.value =
            payment.note ||
            "";
    }

    if (expenseDate) {

        expenseDate.value =
            getDateInputValue(
                payment.createdAt
            );
    }

    if (expensePaymentReference) {

        expensePaymentReference.textContent =
            payment.transactionId
                ? `UTR: ${payment.transactionId}`
                : `Payment ID: ${payment.id}`;
    }

    openModal(
        recordExpenseModal
    );
}


// =====================================================
// EXPENSE MODAL EVENTS
// =====================================================

closeRecordExpenseButton?.addEventListener(
    "click",
    () =>
        closeModal(
            recordExpenseModal
        )
);

cancelRecordExpenseButton?.addEventListener(
    "click",
    () =>
        closeModal(
            recordExpenseModal
        )
);

recordExpenseBackdrop?.addEventListener(
    "click",
    () =>
        closeModal(
            recordExpenseModal
        )
);


// =====================================================
// RECORD EXPENSE
// =====================================================

recordExpenseForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        clearExpenseMessage();

        if (
            !currentUser ||
            !selectedPayment
        ) {
            return;
        }

        const payment =
            findPayment(
                selectedPayment.id
            );

        if (!payment) {

            showExpenseMessage(
                "Payment could not be found.",
                "error"
            );

            return;
        }

        if (
            payment.status !==
            "confirmed"
        ) {

            showExpenseMessage(
                "Only confirmed payments can be recorded as expenses.",
                "error"
            );

            return;
        }

        if (payment.expenseRecorded) {

            showExpenseMessage(
                "This payment has already been recorded as an expense.",
                "error"
            );

            return;
        }

        const title =
            String(
                expenseTitle?.value || ""
            ).trim();

        const category =
            String(
                expenseCategory?.value || ""
            ).trim();

        const date =
            String(
                expenseDate?.value || ""
            ).trim();

        const notes =
            String(
                expenseNote?.value || ""
            ).trim();

        if (!title) {

            showExpenseMessage(
                "Enter an expense title.",
                "error"
            );

            expenseTitle?.focus();
            return;
        }

        if (!category) {

            showExpenseMessage(
                "Select an expense category.",
                "error"
            );

            expenseCategory?.focus();
            return;
        }

        if (!date) {

            showExpenseMessage(
                "Select the expense date.",
                "error"
            );

            expenseDate?.focus();
            return;
        }

        setExpenseSaving(true);

        try {

            const transactionsReference =
                collection(
                    db,
                    "users",
                    currentUser.uid,
                    "transactions"
                );

            const expenseDocument =
                await addDoc(
                    transactionsReference,
                    {
                        title,

                        amount:
                            payment.amount,

                        type:
                            "expense",

                        category,

                        date,

                        paymentMethod:
                            "UPI",

                        notes,

                        source:
                            "upi-payment",

                        paymentId:
                            payment.id,

                        upiTransactionId:
                            payment.transactionId ||
                            "",

                        recipient:
                            payment.recipient,

                        paymentAddress:
                            getPaymentAddress(
                                payment
                            ),

                        createdAt:
                            serverTimestamp()
                    }
                );

            const paymentReference =
                doc(
                    db,
                    "users",
                    currentUser.uid,
                    "payments",
                    payment.id
                );

            await updateDoc(
                paymentReference,
                {
                    expenseRecorded:
                        true,

                    expenseId:
                        expenseDocument.id,

                    expenseRecordedAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()
                }
            );

            payment.expenseRecorded =
                true;

            payment.expenseId =
                expenseDocument.id;

            closeModal(
                recordExpenseModal
            );

            selectedPayment = null;

            updateSummary();
            applyFilters();

            showToast(
                "Payment recorded as an expense.",
                "success"
            );

        } catch (error) {

            console.error(
                "Record expense error:",
                error
            );

            showExpenseMessage(
                "Unable to record this payment as an expense. Please try again.",
                "error"
            );

        } finally {

            setExpenseSaving(false);
        }
    }
);


// =====================================================
// EXPENSE SAVING
// =====================================================

function setExpenseSaving(saving) {

    if (saveExpenseButton) {

        saveExpenseButton.disabled =
            saving;

        saveExpenseButton.textContent =
            saving
                ? "Recording..."
                : "Record Expense";

        saveExpenseButton.classList.toggle(
            "is-loading",
            saving
        );
    }

    if (cancelRecordExpenseButton) {
        cancelRecordExpenseButton.disabled =
            saving;
    }

    if (closeRecordExpenseButton) {
        closeRecordExpenseButton.disabled =
            saving;
    }
}


// =====================================================
// EXPENSE MESSAGE
// =====================================================

function showExpenseMessage(
    message,
    type
) {

    if (!recordExpenseMessage) {
        return;
    }

    recordExpenseMessage.textContent =
        message;

    recordExpenseMessage.className =
        `history-form-message visible ${type}`;
}


function clearExpenseMessage() {

    if (!recordExpenseMessage) {
        return;
    }

    recordExpenseMessage.textContent =
        "";

    recordExpenseMessage.className =
        "history-form-message";
}


// =====================================================
// FIND PAYMENT
// =====================================================

function findPayment(paymentId) {

    return (
        payments.find(
            payment =>
                payment.id ===
                paymentId
        ) ||
        null
    );
}


// =====================================================
// MODAL HELPERS
// =====================================================

function openModal(modal) {

    if (!modal) {
        return;
    }

    modal.classList.add("open");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "history-modal-open"
    );
}


function closeModal(modal) {

    if (!modal) {
        return;
    }

    modal.classList.remove("open");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    if (
        !document.querySelector(
            ".history-modal.open"
        )
    ) {

        document.body.classList.remove(
            "history-modal-open"
        );
    }
}


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
            recordExpenseModal
                ?.classList
                .contains("open")
        ) {

            closeModal(
                recordExpenseModal
            );

            return;
        }

        if (
            confirmPaymentModal
                ?.classList
                .contains("open")
        ) {

            closeModal(
                confirmPaymentModal
            );

            return;
        }

        if (
            paymentDetailsModal
                ?.classList
                .contains("open")
        ) {

            closeModal(
                paymentDetailsModal
            );
        }
    }
);


// =====================================================
// MOBILE SIDEBAR
// =====================================================

if (menuButton && sidebar) {

    menuButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            sidebar.classList.toggle(
                "open"
            );
        }
    );

    document.addEventListener(
        "click",
        event => {

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

    sidebar
        .querySelectorAll(".nav-link")
        .forEach(link => {

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


// =====================================================
// LOGOUT
// =====================================================

logoutButton?.addEventListener(
    "click",
    async () => {

        try {

            showPageLoading();

            await signOut(auth);

            window.location.replace(
                "login.html"
            );

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            hidePageLoading();

            showToast(
                "Unable to logout. Please try again.",
                "error"
            );
        }
    }
);


// =====================================================
// CURRENCY
// =====================================================

function formatCurrency(amount) {

    const value =
        Number(amount);

    if (!Number.isFinite(value)) {
        return "₹0.00";
    }

    return new Intl.NumberFormat(
        "en-IN",
        {
            style:
                "currency",

            currency:
                "INR",

            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2
        }
    ).format(value);
}


// =====================================================
// DATE
// =====================================================

function getDateObject(value) {

    if (!value) {
        return null;
    }

    if (
        typeof value.toDate ===
        "function"
    ) {

        const date =
            value.toDate();

        return Number.isNaN(
            date.getTime()
        )
            ? null
            : date;
    }

    if (value instanceof Date) {

        return Number.isNaN(
            value.getTime()
        )
            ? null
            : value;
    }

    const date =
        new Date(value);

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;
}


function getPaymentTime(payment) {

    const date =
        getDateObject(
            payment.createdAt
        );

    return date
        ? date.getTime()
        : 0;
}


function formatDate(value) {

    const date =
        getDateObject(value);

    if (!date) {
        return "Unknown";
    }

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
        }
    ).format(date);
}


function formatTime(value) {

    const date =
        getDateObject(value);

    if (!date) {
        return "-";
    }

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    ).format(date);
}


function getDateInputValue(value) {

    const date =
        getDateObject(value) ||
        new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;
}


// =====================================================
// TEXT HELPERS
// =====================================================

function getInitial(value) {

    const text =
        String(
            value || "U"
        ).trim();

    return (
        text.charAt(0) || "U"
    ).toUpperCase();
}


function shortId(id) {

    const value =
        String(id || "");

    if (value.length <= 10) {
        return value;
    }

    return (
        value.slice(0, 6) +
        "..." +
        value.slice(-4)
    );
}


function escapeHtml(value) {

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


// =====================================================
// LIST LOADING
// =====================================================

function showListLoading() {

    if (paymentHistoryLoadingState) {
        paymentHistoryLoadingState.hidden =
            false;
    }

    if (paymentHistoryEmptyState) {
        paymentHistoryEmptyState.hidden =
            true;
    }

    if (paymentTableContainer) {
        paymentTableContainer.style.display =
            "none";
    }

    if (paymentHistoryMobileList) {
        paymentHistoryMobileList.style.display =
            "none";
    }
}


function hideListLoading() {

    if (paymentHistoryLoadingState) {
        paymentHistoryLoadingState.hidden =
            true;
    }
}


// =====================================================
// PAGE LOADING
// =====================================================

function showPageLoading() {

    historyPageLoading
        ?.classList
        .remove("hidden");
}


function hidePageLoading() {

    historyPageLoading
        ?.classList
        .add("hidden");
}


// =====================================================
// TOAST
// =====================================================

function showToast(
    message,
    type = "info"
) {

    if (!historyToast) {
        return;
    }

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    historyToast.textContent =
        message;

    historyToast.className =
        `history-toast visible ${type}`;

    toastTimer =
        window.setTimeout(
            () => {

                historyToast.className =
                    "history-toast";

                historyToast.textContent =
                    "";
            },
            4000
        );
}