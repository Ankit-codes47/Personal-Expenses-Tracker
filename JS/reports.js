// =====================================================
// reports.js
// Expense Tracker - Day 6
// Reports & Analytics
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
    orderBy
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import {
    formatCurrency
} from "./utils.js";


// =====================================================
// STATE
// =====================================================

let currentUser = null;

let allTransactions = [];

let filteredTransactions = [];

let incomeExpenseChart = null;

let categoryChart = null;

let monthlyChart = null;


// =====================================================
// PAGE ELEMENTS
// =====================================================

const reportsPage =
    document.getElementById("reportsPage");

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
// FILTER ELEMENTS
// =====================================================

const reportMonth =
    document.getElementById("reportMonth");

const reportYear =
    document.getElementById("reportYear");

const resetReportButton =
    document.getElementById("resetReportButton");

const reportPeriod =
    document.getElementById("reportPeriod");


// =====================================================
// SUMMARY ELEMENTS
// =====================================================

const reportIncome =
    document.getElementById("reportIncome");

const reportExpenses =
    document.getElementById("reportExpenses");

const reportBalance =
    document.getElementById("reportBalance");

const reportSavingsRate =
    document.getElementById("reportSavingsRate");


// =====================================================
// CHART CANVAS
// =====================================================

const incomeExpenseCanvas =
    document.getElementById("incomeExpenseChart");

const categoryCanvas =
    document.getElementById("categoryChart");

const monthlyCanvas =
    document.getElementById("monthlyChart");


// =====================================================
// EMPTY CHART STATES
// =====================================================

const incomeExpenseEmpty =
    document.getElementById("incomeExpenseEmpty");

const categoryEmpty =
    document.getElementById("categoryEmpty");

const monthlyEmpty =
    document.getElementById("monthlyEmpty");


// =====================================================
// INSIGHTS
// =====================================================

const highestExpenseCategory =
    document.getElementById("highestExpenseCategory");

const highestExpenseAmount =
    document.getElementById("highestExpenseAmount");

const biggestExpense =
    document.getElementById("biggestExpense");

const biggestExpenseAmount =
    document.getElementById("biggestExpenseAmount");

const transactionCount =
    document.getElementById("reportTransactionCount");

const averageExpense =
    document.getElementById("averageExpense");


// =====================================================
// LOADING + MESSAGE
// =====================================================

const reportsLoading =
    document.getElementById("reportsLoading");

const reportMessage =
    document.getElementById("reportMessage");


// =====================================================
// MONTH NAMES
// =====================================================

const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];


// =====================================================
// NORMALIZE TYPE
// =====================================================

function normalizeType(type) {

    return String(type || "")
        .trim()
        .toLowerCase();

}


// =====================================================
// SHOW LOADING
// =====================================================

function showLoading() {

    if (reportsLoading) {

        reportsLoading.classList.add(
            "visible"
        );

    }

}


// =====================================================
// HIDE LOADING
// =====================================================

function hideLoading() {

    if (reportsLoading) {

        reportsLoading.classList.remove(
            "visible"
        );

    }

}


// =====================================================
// SHOW ERROR
// =====================================================

function showError(message) {

    if (!reportMessage) return;

    reportMessage.textContent =
        message;

    reportMessage.className =
        "report-message visible error";

}


// =====================================================
// CLEAR ERROR
// =====================================================

function clearError() {

    if (!reportMessage) return;

    reportMessage.textContent =
        "";

    reportMessage.className =
        "report-message";

}


// =====================================================
// AUTHENTICATION
// =====================================================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace(
                "index.html"
            );

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
                name
                    .charAt(0)
                    .toUpperCase();

        }

        if (reportsPage) {

            reportsPage.style.display =
                "flex";

        }

        setupFilters();

        await loadTransactions();

    }
);


// =====================================================
// LOGOUT
// =====================================================

logoutButton?.addEventListener(
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


// =====================================================
// MOBILE MENU
// =====================================================

menuButton?.addEventListener(
    "click",
    () => {

        sidebar?.classList.toggle(
            "open"
        );

    }
);


// =====================================================
// SETUP FILTERS
// =====================================================

function setupFilters() {

    setupMonthFilter();

    setupYearFilter();

}


// =====================================================
// MONTH FILTER
// =====================================================

function setupMonthFilter() {

    if (!reportMonth) return;

    reportMonth.innerHTML = `
        <option value="all">
            All Months
        </option>
    `;

    monthNames.forEach(
        (month, index) => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                String(index + 1)
                    .padStart(
                        2,
                        "0"
                    );

            option.textContent =
                month;

            reportMonth.appendChild(
                option
            );

        }
    );

}


// =====================================================
// YEAR FILTER
// =====================================================

function setupYearFilter() {

    if (!reportYear) return;

    reportYear.innerHTML = `
        <option value="all">
            All Years
        </option>
    `;

    const currentYear =
        new Date().getFullYear();

    for (
        let year = currentYear;
        year >= currentYear - 10;
        year--
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            String(year);

        option.textContent =
            String(year);

        reportYear.appendChild(
            option
        );

    }

}


// =====================================================
// ADD YEARS FOUND IN FIRESTORE
// =====================================================

function addTransactionYears() {

    if (!reportYear) return;

    const years =
        new Set();

    allTransactions.forEach(
        transaction => {

            const date =
                String(
                    transaction.date || ""
                );

            if (
                /^\d{4}-\d{2}-\d{2}$/.test(
                    date
                )
            ) {

                years.add(
                    date.substring(
                        0,
                        4
                    )
                );

            }

        }
    );

    const existing =
        new Set(
            Array.from(
                reportYear.options
            ).map(
                option =>
                    option.value
            )
        );

    [...years]
        .sort(
            (a, b) =>
                Number(b) -
                Number(a)
        )
        .forEach(year => {

            if (
                existing.has(year)
            ) {

                return;

            }

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                year;

            option.textContent =
                year;

            reportYear.appendChild(
                option
            );

        });

}


// =====================================================
// LOAD FIRESTORE TRANSACTIONS
// =====================================================

async function loadTransactions() {

    if (!currentUser) return;

    showLoading();

    clearError();

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

        addTransactionYears();

        applyReportFilters();

    }

    catch (error) {

        console.error(
            "Reports load error:",
            error
        );

        allTransactions = [];

        filteredTransactions = [];

        updateReports();

        showError(
            "Unable to load your report data."
        );

    }

    finally {

        hideLoading();

    }

}


// =====================================================
// FILTER EVENTS
// =====================================================

reportMonth?.addEventListener(
    "change",
    applyReportFilters
);

reportYear?.addEventListener(
    "change",
    applyReportFilters
);


// =====================================================
// RESET FILTER
// =====================================================

resetReportButton?.addEventListener(
    "click",
    () => {

        if (reportMonth) {

            reportMonth.value =
                "all";

        }

        if (reportYear) {

            reportYear.value =
                "all";

        }

        applyReportFilters();

    }
);


// =====================================================
// APPLY FILTERS
// =====================================================

function applyReportFilters() {

    const selectedMonth =
        reportMonth?.value ||
        "all";

    const selectedYear =
        reportYear?.value ||
        "all";

    filteredTransactions =
        allTransactions.filter(
            transaction => {

                const date =
                    String(
                        transaction.date || ""
                    );

                if (
                    !/^\d{4}-\d{2}-\d{2}$/.test(
                        date
                    )
                ) {

                    return (
                        selectedMonth === "all" &&
                        selectedYear === "all"
                    );

                }

                const year =
                    date.substring(
                        0,
                        4
                    );

                const month =
                    date.substring(
                        5,
                        7
                    );

                const matchesMonth =
                    selectedMonth === "all" ||
                    month ===
                        selectedMonth;

                const matchesYear =
                    selectedYear === "all" ||
                    year ===
                        selectedYear;

                return (
                    matchesMonth &&
                    matchesYear
                );

            }
        );

    updateReportPeriod();

    updateReports();

}


// =====================================================
// REPORT PERIOD TEXT
// =====================================================

function updateReportPeriod() {

    if (!reportPeriod) return;

    const month =
        reportMonth?.value ||
        "all";

    const year =
        reportYear?.value ||
        "all";

    let text =
        "All Time";

    if (
        month !== "all" &&
        year !== "all"
    ) {

        text =
            `${monthNames[
                Number(month) - 1
            ]} ${year}`;

    }

    else if (
        month !== "all"
    ) {

        text =
            `${monthNames[
                Number(month) - 1
            ]} — All Years`;

    }

    else if (
        year !== "all"
    ) {

        text =
            year;

    }

    reportPeriod.textContent =
        text;

}


// =====================================================
// UPDATE EVERYTHING
// =====================================================

function updateReports() {

    const summary =
        calculateSummary(
            filteredTransactions
        );

    updateSummaryCards(
        summary
    );

    updateInsights(
        summary
    );

    updateIncomeExpenseChart(
        summary
    );

    updateCategoryChart();

    updateMonthlyChart();

}


// =====================================================
// CALCULATE SUMMARY
// =====================================================

function calculateSummary(
    transactions
) {

    let income = 0;

    let expenses = 0;

    let expenseCount = 0;

    transactions.forEach(
        transaction => {

            const amount =
                Number(
                    transaction.amount
                ) || 0;

            const type =
                normalizeType(
                    transaction.type
                );

            if (type === "income") {

                income += amount;

            }

            else if (
                type === "expense"
            ) {

                expenses += amount;

                expenseCount++;

            }

        }
    );

    const balance =
        income - expenses;

    const savingsRate =
        income > 0
            ? (
                balance /
                income
            ) * 100
            : 0;

    const averageExpense =
        expenseCount > 0
            ? expenses /
                expenseCount
            : 0;

    return {
        income,
        expenses,
        balance,
        savingsRate,
        averageExpense,
        expenseCount
    };

}


// =====================================================
// SUMMARY CARDS
// =====================================================

function updateSummaryCards(
    summary
) {

    if (reportIncome) {

        reportIncome.textContent =
            formatCurrency(
                summary.income
            );

    }

    if (reportExpenses) {

        reportExpenses.textContent =
            formatCurrency(
                summary.expenses
            );

    }

    if (reportBalance) {

        reportBalance.textContent =
            formatCurrency(
                summary.balance
            );

    }

    if (reportSavingsRate) {

        reportSavingsRate.textContent =
            `${summary.savingsRate.toFixed(
                1
            )}%`;

    }

}


// =====================================================
// UPDATE INSIGHTS
// =====================================================

function updateInsights(
    summary
) {

    const expenses =
        filteredTransactions.filter(
            transaction =>
                normalizeType(
                    transaction.type
                ) === "expense"
        );

    const categoryTotals = {};

    expenses.forEach(
        transaction => {

            const category =
                transaction.category ||
                "Other";

            const amount =
                Number(
                    transaction.amount
                ) || 0;

            categoryTotals[category] =
                (
                    categoryTotals[
                        category
                    ] || 0
                ) + amount;

        }
    );

    const categoryEntries =
        Object.entries(
            categoryTotals
        );

    categoryEntries.sort(
        (a, b) =>
            b[1] - a[1]
    );

    const topCategory =
        categoryEntries[0];

    if (highestExpenseCategory) {

        highestExpenseCategory.textContent =
            topCategory
                ? topCategory[0]
                : "No data";

    }

    if (highestExpenseAmount) {

        highestExpenseAmount.textContent =
            topCategory
                ? formatCurrency(
                    topCategory[1]
                )
                : formatCurrency(0);

    }


    // BIGGEST EXPENSE

    const sortedExpenses =
        [...expenses].sort(
            (a, b) =>
                (
                    Number(
                        b.amount
                    ) || 0
                ) -
                (
                    Number(
                        a.amount
                    ) || 0
                )
        );

    const largest =
        sortedExpenses[0];

    if (biggestExpense) {

        biggestExpense.textContent =
            largest
                ? (
                    largest.title ||
                    "Expense"
                )
                : "No data";

    }

    if (biggestExpenseAmount) {

        biggestExpenseAmount.textContent =
            largest
                ? formatCurrency(
                    Number(
                        largest.amount
                    ) || 0
                )
                : formatCurrency(0);

    }


    // TRANSACTION COUNT

    if (transactionCount) {

        transactionCount.textContent =
            filteredTransactions.length;

    }


    // AVERAGE EXPENSE

    if (averageExpense) {

        averageExpense.textContent =
            formatCurrency(
                summary.averageExpense
            );

    }

}


// =====================================================
// DESTROY CHART
// =====================================================

function destroyChart(chart) {

    if (chart) {

        chart.destroy();

    }

}


// =====================================================
// CHART.JS AVAILABLE?
// =====================================================

function chartAvailable() {

    if (
        typeof Chart ===
        "undefined"
    ) {

        console.error(
            "Chart.js is not loaded."
        );

        showError(
            "Chart library could not be loaded."
        );

        return false;

    }

    return true;

}


// =====================================================
// INCOME VS EXPENSE CHART
// =====================================================

function updateIncomeExpenseChart(
    summary
) {

    destroyChart(
        incomeExpenseChart
    );

    incomeExpenseChart = null;

    const hasData =
        summary.income > 0 ||
        summary.expenses > 0;

    toggleChartEmptyState(
        incomeExpenseCanvas,
        incomeExpenseEmpty,
        hasData
    );

    if (
        !hasData ||
        !incomeExpenseCanvas ||
        !chartAvailable()
    ) {

        return;

    }

    incomeExpenseChart =
        new Chart(
            incomeExpenseCanvas,
            {
                type:
                    "doughnut",

                data: {

                    labels: [
                        "Income",
                        "Expenses"
                    ],

                    datasets: [
                        {
                            data: [
                                summary.income,
                                summary.expenses
                            ],

                            backgroundColor: [
                                "#22c55e",
                                "#ef4444"
                            ],

                            borderWidth: 0,

                            hoverOffset: 6
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    cutout:
                        "68%",

                    plugins: {

                        legend: {

                            position:
                                "bottom",

                            labels: {

                                color:
                                    "#94a3b8",

                                padding:
                                    18,

                                usePointStyle:
                                    true
                            }
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    context => {

                                        return `${
                                            context.label
                                        }: ${
                                            formatCurrency(
                                                context.raw
                                            )
                                        }`;

                                    }
                            }
                        }
                    }
                }
            }
        );

}


// =====================================================
// CATEGORY CHART
// =====================================================

function updateCategoryChart() {

    destroyChart(
        categoryChart
    );

    categoryChart = null;

    const categoryTotals = {};

    filteredTransactions.forEach(
        transaction => {

            if (
                normalizeType(
                    transaction.type
                ) !== "expense"
            ) {

                return;

            }

            const category =
                transaction.category ||
                "Other";

            categoryTotals[category] =
                (
                    categoryTotals[
                        category
                    ] || 0
                ) +
                (
                    Number(
                        transaction.amount
                    ) || 0
                );

        }
    );

    const entries =
        Object.entries(
            categoryTotals
        )
        .sort(
            (a, b) =>
                b[1] - a[1]
        );

    const hasData =
        entries.length > 0;

    toggleChartEmptyState(
        categoryCanvas,
        categoryEmpty,
        hasData
    );

    if (
        !hasData ||
        !categoryCanvas ||
        !chartAvailable()
    ) {

        return;

    }

    const labels =
        entries.map(
            entry =>
                entry[0]
        );

    const values =
        entries.map(
            entry =>
                entry[1]
        );

    const colors = [
        "#ef4444",
        "#f97316",
        "#eab308",
        "#22c55e",
        "#14b8a6",
        "#3b82f6",
        "#6366f1",
        "#a855f7",
        "#ec4899",
        "#64748b"
    ];

    categoryChart =
        new Chart(
            categoryCanvas,
            {
                type:
                    "doughnut",

                data: {

                    labels,

                    datasets: [
                        {
                            data:
                                values,

                            backgroundColor:
                                labels.map(
                                    (
                                        _,
                                        index
                                    ) =>
                                        colors[
                                            index %
                                            colors.length
                                        ]
                                ),

                            borderWidth:
                                0,

                            hoverOffset:
                                5
                        }
                    ]
                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    cutout:
                        "62%",

                    plugins: {

                        legend: {

                            position:
                                "bottom",

                            labels: {

                                color:
                                    "#94a3b8",

                                padding:
                                    14,

                                usePointStyle:
                                    true
                            }
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    context => {

                                        return `${
                                            context.label
                                        }: ${
                                            formatCurrency(
                                                context.raw
                                            )
                                        }`;

                                    }
                            }
                        }
                    }
                }
            }
        );

}


// =====================================================
// MONTHLY CHART
// =====================================================

function updateMonthlyChart() {

    destroyChart(
        monthlyChart
    );

    monthlyChart = null;

    const monthlyData = {};

    filteredTransactions.forEach(
        transaction => {

            const date =
                String(
                    transaction.date || ""
                );

            if (
                !/^\d{4}-\d{2}-\d{2}$/.test(
                    date
                )
            ) {

                return;

            }

            const monthKey =
                date.substring(
                    0,
                    7
                );

            if (
                !monthlyData[
                    monthKey
                ]
            ) {

                monthlyData[
                    monthKey
                ] = {
                    income: 0,
                    expense: 0
                };

            }

            const amount =
                Number(
                    transaction.amount
                ) || 0;

            const type =
                normalizeType(
                    transaction.type
                );

            if (type === "income") {

                monthlyData[
                    monthKey
                ].income += amount;

            }

            else if (
                type === "expense"
            ) {

                monthlyData[
                    monthKey
                ].expense += amount;

            }

        }
    );

    const monthKeys =
        Object.keys(
            monthlyData
        ).sort();

    const hasData =
        monthKeys.length > 0;

    toggleChartEmptyState(
        monthlyCanvas,
        monthlyEmpty,
        hasData
    );

    if (
        !hasData ||
        !monthlyCanvas ||
        !chartAvailable()
    ) {

        return;

    }

    const labels =
        monthKeys.map(
            key => {

                const [
                    year,
                    month
                ] = key.split("-");

                return `${
                    monthNames[
                        Number(month) - 1
                    ].substring(
                        0,
                        3
                    )
                } ${year}`;

            }
        );

    const incomeData =
        monthKeys.map(
            key =>
                monthlyData[
                    key
                ].income
        );

    const expenseData =
        monthKeys.map(
            key =>
                monthlyData[
                    key
                ].expense
        );

    monthlyChart =
        new Chart(
            monthlyCanvas,
            {
                type:
                    "bar",

                data: {

                    labels,

                    datasets: [

                        {
                            label:
                                "Income",

                            data:
                                incomeData,

                            backgroundColor:
                                "#22c55e",

                            borderRadius:
                                6
                        },

                        {
                            label:
                                "Expenses",

                            data:
                                expenseData,

                            backgroundColor:
                                "#ef4444",

                            borderRadius:
                                6
                        }

                    ]
                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    interaction: {

                        mode:
                            "index",

                        intersect:
                            false
                    },

                    plugins: {

                        legend: {

                            position:
                                "bottom",

                            labels: {

                                color:
                                    "#94a3b8",

                                padding:
                                    18,

                                usePointStyle:
                                    true
                            }
                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    context => {

                                        return `${
                                            context.dataset
                                                .label
                                        }: ${
                                            formatCurrency(
                                                context.raw
                                            )
                                        }`;

                                    }
                            }
                        }
                    },

                    scales: {

                        x: {

                            grid: {

                                display:
                                    false
                            },

                            ticks: {

                                color:
                                    "#94a3b8"
                            }
                        },

                        y: {

                            beginAtZero:
                                true,

                            grid: {

                                color:
                                    "rgba(148, 163, 184, 0.10)"
                            },

                            ticks: {

                                color:
                                    "#94a3b8",

                                callback:
                                    value => {

                                        return formatCompactCurrency(
                                            value
                                        );

                                    }
                            }
                        }
                    }
                }
            }
        );

}


// =====================================================
// COMPACT CURRENCY FOR CHART AXIS
// =====================================================

function formatCompactCurrency(
    value
) {

    const amount =
        Number(value) || 0;

    if (
        Math.abs(amount) >=
        10000000
    ) {

        return `₹${(
            amount /
            10000000
        ).toFixed(1)}Cr`;

    }

    if (
        Math.abs(amount) >=
        100000
    ) {

        return `₹${(
            amount /
            100000
        ).toFixed(1)}L`;

    }

    if (
        Math.abs(amount) >=
        1000
    ) {

        return `₹${(
            amount /
            1000
        ).toFixed(1)}K`;

    }

    return `₹${amount}`;

}


// =====================================================
// EMPTY CHART STATE
// =====================================================

function toggleChartEmptyState(
    canvas,
    emptyState,
    hasData
) {

    if (canvas) {

        canvas.style.display =
            hasData
                ? "block"
                : "none";

    }

    if (emptyState) {

        emptyState.classList.toggle(
            "visible",
            !hasData
        );

    }

}