// =====================================================
// PAYMENT-HISTORY.JS
// Expense Tracker - Day 11
// Payment History + Expense Recording
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
// PAGE
// =====================================================

const paymentHistoryPage =
    document.getElementById("paymentHistoryPage");

const historyPageLoading =
    document.getElementById("historyPageLoading");


// =====================================================
// USER / SIDEBAR
// =====================================================

const sidebar =
    document.querySelector(".sidebar");

const menuButton =
    document.getElementById("menuButton");

const userEmail =
    document.getElementById("userEmail");

const userAvatar =
    document.getElementById("userAvatar");

const logoutButton =
    document.getElementById("logoutButton");


// =====================================================
// SUMMARY
// =====================================================

const totalPaymentsCount =
    document.getElementById("totalPaymentsCount");

const totalPaymentsAmount =
    document.getElementById("totalPaymentsAmount");

const confirmedPaymentsCount =
    document.getElementById("confirmedPaymentsCount");

const confirmedPaymentsAmount =
    document.getElementById("confirmedPaymentsAmount");

const pendingPaymentsCount =
    document.getElementById("pendingPaymentsCount");

const failedPaymentsCount =
    document.getElementById("failedPaymentsCount");


// =====================================================
// FILTERS
// =====================================================

const paymentSearchInput =
    document.getElementById("paymentSearchInput");

const paymentStatusFilter =
    document.getElementById("paymentStatusFilter");

const expenseStatusFilter =
    document.getElementById("expenseStatusFilter");

const paymentSortFilter =
    document.getElementById("paymentSortFilter");

const clearHistoryFiltersButton =
    document.getElementById("clearHistoryFiltersButton");

const refreshPaymentsButton =
    document.getElementById("refreshPaymentsButton");

const visiblePaymentsCount =
    document.getElementById("visiblePaymentsCount");

const allPaymentsCount =
    document.getElementById("allPaymentsCount");


// =====================================================
// HISTORY LIST
// =====================================================

const paymentTableContainer =
    document.getElementById("paymentTableContainer");

const paymentHistoryTableBody =
    document.getElementById("paymentHistoryTableBody");

const paymentHistoryMobileList =
    document.getElementById("paymentHistoryMobileList");

const paymentHistoryEmptyState =
    document.getElementById("paymentHistoryEmptyState");

const paymentHistoryEmptyText =
    document.getElementById("paymentHistoryEmptyText");

const paymentHistoryLoadingState =
    document.getElementById("paymentHistoryLoadingState");


// =====================================================
// DETAILS MODAL
// =====================================================

const paymentDetailsModal =
    document.getElementById("paymentDetailsModal");

const paymentDetailsBackdrop =
    document.getElementById("paymentDetailsBackdrop");

const closePaymentDetailsButton =
    document.getElementById("closePaymentDetailsButton");

const detailCloseButton =
    document.getElementById("detailCloseButton");

const detailPaymentAmount =
    document.getElementById("detailPaymentAmount");

const detailPaymentStatus =
    document.getElementById("detailPaymentStatus");

const detailRecipient =
    document.getElementById("detailRecipient");

const detailUpiId =
    document.getElementById("detailUpiId");

const detailDate =
    document.getElementById("detailDate");

const detailTime =
    document.getElementById("detailTime");

const detailExpenseStatus =
    document.getElementById("detailExpenseStatus");

const detailPaymentId =
    document.getElementById("detailPaymentId");

const detailPaymentNote =
    document.getElementById("detailPaymentNote");

const detailRecordExpenseButton =
    document.getElementById("detailRecordExpenseButton");


// =====================================================
// CONFIRM STATUS MODAL
// =====================================================

const confirmPaymentModal =
    document.getElementById("confirmPaymentModal");

const confirmPaymentBackdrop =
    document.getElementById("confirmPaymentBackdrop");

const closeConfirmPaymentButton =
    document.getElementById("closeConfirmPaymentButton");

const confirmRecipient =
    document.getElementById("confirmRecipient");

const confirmAmount =
    document.getElementById("confirmAmount");

const markPaymentFailedButton =
    document.getElementById("markPaymentFailedButton");

const keepPaymentPendingButton =
    document.getElementById("keepPaymentPendingButton");

const markPaymentConfirmedButton =
    document.getElementById("markPaymentConfirmedButton");


// =====================================================
// RECORD EXPENSE MODAL
// =====================================================

const recordExpenseModal =
    document.getElementById("recordExpenseModal");

const recordExpenseBackdrop =
    document.getElementById("recordExpenseBackdrop");

const closeRecordExpenseButton =
    document.getElementById("closeRecordExpenseButton");

const cancelRecordExpenseButton =
    document.getElementById("cancelRecordExpenseButton");

const recordExpenseForm =
    document.getElementById("recordExpenseForm");

const expenseRecipient =
    document.getElementById("expenseRecipient");

const expenseAmount =
    document.getElementById("expenseAmount");

const expenseTitle =
    document.getElementById("expenseTitle");

const expenseCategory =
    document.getElementById("expenseCategory");

const expenseDate =
    document.getElementById("expenseDate");

const expenseNote =
    document.getElementById("expenseNote");

const recordExpenseMessage =
    document.getElementById("recordExpenseMessage");

const saveExpenseButton =
    document.getElementById("saveExpenseButton");


// =====================================================
// TOAST
// =====================================================

const historyToast =
    document.getElementById("historyToast");


// =====================================================
// AUTH
// =====================================================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace(
                "login.html"
            );

            return;

        }


        currentUser = user;


        updateUserInterface();


        if (paymentHistoryPage) {

            paymentHistoryPage.style.display =
                "flex";

        }


        hidePageLoading();


        await loadPayments();

    }
);


// =====================================================
// USER INTERFACE
// =====================================================

function updateUserInterface() {

    if (!currentUser) {

        return;

    }


    const email =
        currentUser.email ||
        "User";


    const name =
        currentUser.displayName?.trim() ||
        email.split("@")[0] ||
        "User";


    if (userEmail) {

        userEmail.textContent =
            email;

    }


    if (userAvatar) {

        userAvatar.textContent =
            name
                .charAt(0)
                .toUpperCase();

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


        snapshot.forEach(
            documentSnapshot => {

                payments.push(
                    normalizePayment(
                        documentSnapshot.id,
                        documentSnapshot.data()
                    )
                );

            }
        );


        updateSummary();

        applyFilters();

    }

    catch (error) {

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

    }

    finally {

        hideListLoading();

    }

}


// =====================================================
// NORMALIZE PAYMENT
// =====================================================

function normalizePayment(
    id,
    data
) {

    const amount =
        Number(
            data.amount
        );


    const status =
        normalizeStatus(
            data.status
        );


    return {

        id,

        recipient:
            String(
                data.recipient ||
                data.recipientName ||
                "Unknown Recipient"
            ).trim(),

        upiId:
            String(
                data.upiId ||
                ""
            ).trim(),

        amount:
            Number.isFinite(amount)
                ? amount
                : 0,

        note:
            String(
                data.note ||
                ""
            ).trim(),

        status,

        expenseRecorded:
            data.expenseRecorded === true,

        transactionId:
            String(
                data.transactionId ||
                ""
            ),

        createdAt:
            data.createdAt || null,

        updatedAt:
            data.updatedAt || null

    };

}


// =====================================================
// NORMALIZE STATUS
// =====================================================

function normalizeStatus(status) {

    const value =
        String(
            status || "pending"
        ).toLowerCase();


    if (
        value === "confirmed"
    ) {

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


// =====================================================
// SUMMARY
// =====================================================

function updateSummary() {

    const totalCount =
        payments.length;


    const totalAmount =
        payments.reduce(
            (total, payment) =>
                total +
                payment.amount,
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
                total +
                payment.amount,
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
            String(
                confirmed.length
            );

    }


    if (confirmedPaymentsAmount) {

        confirmedPaymentsAmount.textContent =
            `${formatCurrency(confirmedAmount)} confirmed`;

    }


    if (pendingPaymentsCount) {

        pendingPaymentsCount.textContent =
            String(
                pending.length
            );

    }


    if (failedPaymentsCount) {

        failedPaymentsCount.textContent =
            String(
                failed.length
            );

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
            paymentSearchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const status =
        paymentStatusFilter?.value ||
        "all";


    const expense =
        expenseStatusFilter?.value ||
        "all";


    const sort =
        paymentSortFilter?.value ||
        "newest";


    filteredPayments =
        payments.filter(
            payment => {

                const searchableText =
                    [
                        payment.recipient,
                        payment.upiId,
                        payment.note
                    ]
                        .join(" ")
                        .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchableText.includes(
                        search
                    );


                const matchesStatus =
                    status === "all" ||
                    payment.status ===
                        status;


                let matchesExpense =
                    true;


                if (
                    expense ===
                    "recorded"
                ) {

                    matchesExpense =
                        payment.expenseRecorded;

                }


                if (
                    expense ===
                    "not-recorded"
                ) {

                    matchesExpense =
                        !payment.expenseRecorded;

                }


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesExpense
                );

            }
        );


    filteredPayments.sort(
        (a, b) => {

            if (
                sort ===
                "highest"
            ) {

                return (
                    b.amount -
                    a.amount
                );

            }


            if (
                sort ===
                "lowest"
            ) {

                return (
                    a.amount -
                    b.amount
                );

            }


            const aTime =
                getPaymentTime(a);


            const bTime =
                getPaymentTime(b);


            if (
                sort ===
                "oldest"
            ) {

                return (
                    aTime -
                    bTime
                );

            }


            return (
                bTime -
                aTime
            );

        }
    );


    renderPayments();

}


// =====================================================
// CLEAR FILTERS
// =====================================================

clearHistoryFiltersButton?.addEventListener(
    "click",
    () => {

        if (paymentSearchInput) {

            paymentSearchInput.value =
                "";

        }


        if (paymentStatusFilter) {

            paymentStatusFilter.value =
                "all";

        }


        if (expenseStatusFilter) {

            expenseStatusFilter.value =
                "all";

        }


        if (paymentSortFilter) {

            paymentSortFilter.value =
                "newest";

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


        await loadPayments();


        refreshPaymentsButton.disabled =
            false;


        showToast(
            "Payment history refreshed.",
            "success"
        );

    }
);


// =====================================================
// RENDER PAYMENTS
// =====================================================

function renderPayments() {

    if (visiblePaymentsCount) {

        visiblePaymentsCount.textContent =
            String(
                filteredPayments.length
            );

    }


    if (allPaymentsCount) {

        allPaymentsCount.textContent =
            String(
                payments.length
            );

    }


    if (
        paymentHistoryTableBody
    ) {

        paymentHistoryTableBody.innerHTML =
            "";

    }


    if (
        paymentHistoryMobileList
    ) {

        paymentHistoryMobileList.innerHTML =
            "";

    }


    if (
        filteredPayments.length ===
        0
    ) {

        showEmptyState();

        return;

    }


    hideEmptyState();


    filteredPayments.forEach(
        payment => {

            paymentHistoryTableBody
                ?.appendChild(
                    createDesktopRow(
                        payment
                    )
                );


            paymentHistoryMobileList
                ?.appendChild(
                    createMobileCard(
                        payment
                    )
                );

        }
    );

}


// =====================================================
// DESKTOP ROW
// =====================================================

function createDesktopRow(payment) {

    const row =
        document.createElement(
            "tr"
        );


    // RECIPIENT

    const recipientCell =
        document.createElement(
            "td"
        );


    const recipientWrapper =
        document.createElement(
            "div"
        );


    recipientWrapper.className =
        "history-recipient";


    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "history-recipient-avatar";


    avatar.textContent =
        getInitial(
            payment.recipient
        );


    const recipientInfo =
        document.createElement(
            "div"
        );


    const recipientStrong =
        document.createElement(
            "strong"
        );


    recipientStrong.textContent =
        payment.recipient;


    const recipientSmall =
        document.createElement(
            "small"
        );


    recipientSmall.textContent =
        payment.upiId ||
        "No UPI ID";


    recipientInfo.append(
        recipientStrong,
        recipientSmall
    );


    recipientWrapper.append(
        avatar,
        recipientInfo
    );


    recipientCell.appendChild(
        recipientWrapper
    );


    // PAYMENT

    const paymentCell =
        document.createElement(
            "td"
        );


    const paymentInfo =
        document.createElement(
            "div"
        );


    paymentInfo.className =
        "history-payment-info";


    const paymentNote =
        document.createElement(
            "strong"
        );


    paymentNote.textContent =
        payment.note ||
        "UPI Payment";


    const paymentId =
        document.createElement(
            "small"
        );


    paymentId.textContent =
        `ID: ${shortId(payment.id)}`;


    paymentInfo.append(
        paymentNote,
        paymentId
    );


    paymentCell.appendChild(
        paymentInfo
    );


    // AMOUNT

    const amountCell =
        document.createElement(
            "td"
        );


    amountCell.className =
        "history-amount";


    amountCell.textContent =
        formatCurrency(
            payment.amount
        );


    // DATE

    const dateCell =
        document.createElement(
            "td"
        );


    const dateWrapper =
        document.createElement(
            "div"
        );


    dateWrapper.className =
        "history-date";


    const dateStrong =
        document.createElement(
            "strong"
        );


    dateStrong.textContent =
        formatDate(
            payment.createdAt
        );


    const dateSmall =
        document.createElement(
            "small"
        );


    dateSmall.textContent =
        formatTime(
            payment.createdAt
        );


    dateWrapper.append(
        dateStrong,
        dateSmall
    );


    dateCell.appendChild(
        dateWrapper
    );


    // STATUS

    const statusCell =
        document.createElement(
            "td"
        );


    statusCell.appendChild(
        createStatusBadge(
            payment.status
        )
    );


    // EXPENSE

    const expenseCell =
        document.createElement(
            "td"
        );


    expenseCell.appendChild(
        createExpenseBadge(
            payment.expenseRecorded
        )
    );


    // ACTIONS

    const actionsCell =
        document.createElement(
            "td"
        );


    actionsCell.appendChild(
        createPaymentActions(
            payment
        )
    );


    row.append(
        recipientCell,
        paymentCell,
        amountCell,
        dateCell,
        statusCell,
        expenseCell,
        actionsCell
    );


    return row;

}


// =====================================================
// MOBILE CARD
// =====================================================

function createMobileCard(payment) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "history-mobile-card";


    const top =
        document.createElement(
            "div"
        );


    top.className =
        "history-mobile-card-top";


    const recipient =
        document.createElement(
            "div"
        );


    recipient.className =
        "history-mobile-card-recipient";


    const recipientName =
        document.createElement(
            "strong"
        );


    recipientName.textContent =
        payment.recipient;


    const upi =
        document.createElement(
            "small"
        );


    upi.textContent =
        payment.upiId ||
        "No UPI ID";


    recipient.append(
        recipientName,
        upi
    );


    const amount =
        document.createElement(
            "div"
        );


    amount.className =
        "history-mobile-card-amount";


    amount.textContent =
        formatCurrency(
            payment.amount
        );


    top.append(
        recipient,
        amount
    );


    // META

    const meta =
        document.createElement(
            "div"
        );


    meta.className =
        "history-mobile-meta";


    meta.append(
        createMobileMeta(
            "Status",
            getStatusLabel(
                payment.status
            )
        ),

        createMobileMeta(
            "Expense",
            payment.expenseRecorded
                ? "Recorded"
                : "Not Recorded"
        ),

        createMobileMeta(
            "Date",
            formatDate(
                payment.createdAt
            )
        ),

        createMobileMeta(
            "Time",
            formatTime(
                payment.createdAt
            )
        )
    );


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "history-mobile-actions";


    actions.appendChild(
        createPaymentActions(
            payment
        )
    );


    card.append(
        top,
        meta,
        actions
    );


    return card;

}


// =====================================================
// MOBILE META
// =====================================================

function createMobileMeta(
    label,
    value
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "history-mobile-meta-item";


    const span =
        document.createElement(
            "span"
        );


    span.textContent =
        label;


    const strong =
        document.createElement(
            "strong"
        );


    strong.textContent =
        value;


    item.append(
        span,
        strong
    );


    return item;

}


// =====================================================
// STATUS BADGE
// =====================================================

function createStatusBadge(status) {

    const badge =
        document.createElement(
            "span"
        );


    badge.className =
        `history-status-badge ${status}`;


    badge.textContent =
        getStatusLabel(
            status
        );


    return badge;

}


// =====================================================
// EXPENSE BADGE
// =====================================================

function createExpenseBadge(recorded) {

    const badge =
        document.createElement(
            "span"
        );


    badge.className =
        recorded
            ? "history-expense-badge recorded"
            : "history-expense-badge not-recorded";


    badge.textContent =
        recorded
            ? "Recorded"
            : "Not Recorded";


    return badge;

}


// =====================================================
// PAYMENT ACTIONS
// =====================================================

function createPaymentActions(payment) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "history-row-actions";


    // VIEW

    const viewButton =
        document.createElement(
            "button"
        );


    viewButton.type =
        "button";


    viewButton.className =
        "history-row-button";


    viewButton.textContent =
        "View";


    viewButton.addEventListener(
        "click",
        () => {

            openPaymentDetails(
                payment.id
            );

        }
    );


    wrapper.appendChild(
        viewButton
    );


    // STATUS

    const statusButton =
        document.createElement(
            "button"
        );


    statusButton.type =
        "button";


    statusButton.className =
        "history-row-button";


    statusButton.textContent =
        payment.status === "pending"
            ? "Confirm"
            : "Status";


    statusButton.addEventListener(
        "click",
        () => {

            openConfirmPayment(
                payment.id
            );

        }
    );


    wrapper.appendChild(
        statusButton
    );


    // RECORD EXPENSE

    if (
        payment.status ===
            "confirmed" &&
        !payment.expenseRecorded
    ) {

        const expenseButton =
            document.createElement(
                "button"
            );


        expenseButton.type =
            "button";


        expenseButton.className =
            "history-row-button primary";


        expenseButton.textContent =
            "Record Expense";


        expenseButton.addEventListener(
            "click",
            () => {

                openRecordExpense(
                    payment.id
                );

            }
        );


        wrapper.appendChild(
            expenseButton
        );

    }


    return wrapper;

}


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

function openPaymentDetails(
    paymentId
) {

    const payment =
        findPayment(
            paymentId
        );


    if (!payment) {

        return;

    }


    selectedPayment =
        payment;


    detailPaymentAmount.textContent =
        formatCurrency(
            payment.amount
        );


    detailPaymentStatus.textContent =
        getStatusLabel(
            payment.status
        );


    detailPaymentStatus.className =
        `history-status-badge ${payment.status}`;


    detailRecipient.textContent =
        payment.recipient;


    detailUpiId.textContent =
        payment.upiId ||
        "-";


    detailDate.textContent =
        formatDate(
            payment.createdAt
        );


    detailTime.textContent =
        formatTime(
            payment.createdAt
        );


    detailExpenseStatus.textContent =
        payment.expenseRecorded
            ? "Recorded"
            : "Not Recorded";


    detailPaymentId.textContent =
        payment.id;


    detailPaymentNote.textContent =
        payment.note ||
        "No note";


    if (
        detailRecordExpenseButton
    ) {

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
// DETAILS MODAL EVENTS
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
// CONFIRM PAYMENT MODAL
// =====================================================

function openConfirmPayment(
    paymentId
) {

    const payment =
        findPayment(
            paymentId
        );


    if (!payment) {

        return;

    }


    selectedPayment =
        payment;


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


keepPaymentPendingButton?.addEventListener(
    "click",
    async () => {

        if (!selectedPayment) {

            return;

        }


        await updatePaymentStatus(
            selectedPayment.id,
            "pending"
        );

    }
);


markPaymentFailedButton?.addEventListener(
    "click",
    async () => {

        if (!selectedPayment) {

            return;

        }


        if (
            selectedPayment
                .expenseRecorded
        ) {

            showToast(
                "This payment is already recorded as an expense and cannot be marked failed here.",
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


markPaymentConfirmedButton?.addEventListener(
    "click",
    async () => {

        if (!selectedPayment) {

            return;

        }


        await updatePaymentStatus(
            selectedPayment.id,
            "confirmed"
        );

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


    setStatusButtonsDisabled(
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
                status,
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
                status;

        }


        closeModal(
            confirmPaymentModal
        );


        selectedPayment =
            null;


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

    }

    catch (error) {

        console.error(
            "Update payment status error:",
            error
        );


        showToast(
            "Unable to update payment status.",
            "error"
        );

    }

    finally {

        setStatusButtonsDisabled(
            false
        );

    }

}


// =====================================================
// STATUS BUTTON STATE
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


// =====================================================
// OPEN RECORD EXPENSE
// =====================================================

function openRecordExpense(
    paymentId
) {

    const payment =
        findPayment(
            paymentId
        );


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


    if (
        payment.expenseRecorded
    ) {

        showToast(
            "This payment has already been recorded as an expense.",
            "info"
        );

        return;

    }


    selectedPayment =
        payment;


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


    openModal(
        recordExpenseModal
    );

}


// =====================================================
// RECORD EXPENSE MODAL EVENTS
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
// RECORD EXPENSE FORM
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


        if (
            payment.expenseRecorded
        ) {

            showExpenseMessage(
                "This payment has already been recorded.",
                "error"
            );

            return;

        }


        const title =
            String(
                expenseTitle?.value ||
                ""
            ).trim();


        const category =
            String(
                expenseCategory?.value ||
                ""
            ).trim();


        const date =
            String(
                expenseDate?.value ||
                ""
            ).trim();


        const notes =
            String(
                expenseNote?.value ||
                ""
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


        setExpenseSaving(
            true
        );


        try {

            /*
             * Existing Expense Tracker schema:
             *
             * users/{uid}/transactions
             */

            const transactionsReference =
                collection(
                    db,
                    "users",
                    currentUser.uid,
                    "transactions"
                );


            const transactionDocument =
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

                        createdAt:
                            serverTimestamp()
                    }
                );


            /*
             * Mark the payment as linked to
             * the new expense.
             */

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

                    transactionId:
                        transactionDocument.id,

                    expenseRecordedAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()
                }
            );


            payment.expenseRecorded =
                true;


            payment.transactionId =
                transactionDocument.id;


            closeModal(
                recordExpenseModal
            );


            selectedPayment =
                null;


            updateSummary();

            applyFilters();


            showToast(
                "Payment recorded as an expense.",
                "success"
            );

        }

        catch (error) {

            console.error(
                "Record expense error:",
                error
            );


            showExpenseMessage(
                "Unable to record this payment as an expense. Please try again.",
                "error"
            );

        }

        finally {

            setExpenseSaving(
                false
            );

        }

    }
);


// =====================================================
// EXPENSE SAVING STATE
// =====================================================

function setExpenseSaving(
    saving
) {

    if (saveExpenseButton) {

        saveExpenseButton.disabled =
            saving;


        saveExpenseButton.textContent =
            saving
                ? "Recording..."
                : "Record Expense";

    }


    if (cancelRecordExpenseButton) {

        cancelRecordExpenseButton.disabled =
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

function findPayment(
    paymentId
) {

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


    modal.classList.add(
        "open"
    );


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


    modal.classList.remove(
        "open"
    );


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

        if (
            event.key !==
            "Escape"
        ) {

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

if (
    menuButton &&
    sidebar
) {

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
        .querySelectorAll(
            ".nav-link"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        sidebar.classList.remove(
                            "open"
                        );

                    }
                );

            }
        );

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

        }

        catch (error) {

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
// FORMAT CURRENCY
// =====================================================

function formatCurrency(amount) {

    const value =
        Number(amount);


    if (
        !Number.isFinite(value)
    ) {

        return "₹0.00";

    }


    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(value);

}


// =====================================================
// DATE HELPERS
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


    if (
        value instanceof Date
    ) {

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


// =====================================================
// PAYMENT TIME
// =====================================================

function getPaymentTime(payment) {

    const date =
        getDateObject(
            payment.createdAt
        );


    return date
        ? date.getTime()
        : 0;

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {

    const date =
        getDateObject(
            value
        );


    if (!date) {

        return "Unknown";

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);

}


// =====================================================
// FORMAT TIME
// =====================================================

function formatTime(value) {

    const date =
        getDateObject(
            value
        );


    if (!date) {

        return "-";

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);

}


// =====================================================
// DATE INPUT VALUE
// =====================================================

function getDateInputValue(value) {

    const date =
        getDateObject(
            value
        ) ||
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


    return (
        `${year}-${month}-${day}`
    );

}


// =====================================================
// STATUS LABEL
// =====================================================

function getStatusLabel(status) {

    if (
        status === "confirmed"
    ) {

        return "Confirmed";

    }


    if (
        status === "failed"
    ) {

        return "Failed / Cancelled";

    }


    return "Pending";

}


// =====================================================
// INITIAL
// =====================================================

function getInitial(value) {

    const text =
        String(
            value || "U"
        ).trim();


    return (
        text.charAt(0) ||
        "U"
    ).toUpperCase();

}


// =====================================================
// SHORT ID
// =====================================================

function shortId(id) {

    const value =
        String(
            id || ""
        );


    if (
        value.length <= 10
    ) {

        return value;

    }


    return (
        value.slice(0, 6) +
        "..." +
        value.slice(-4)
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

    historyPageLoading?.classList.remove(
        "hidden"
    );

}


function hidePageLoading() {

    historyPageLoading?.classList.add(
        "hidden"
    );

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

        clearTimeout(
            toastTimer
        );

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