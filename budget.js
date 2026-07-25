// =====================================================
// budget.js
// Expense Tracker - Day 7
// Monthly Budget Management
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
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import {
    formatCurrency
} from "./utils.js";


// =====================================================
// STATE
// =====================================================

let currentUser = null;

let allTransactions = [];

let monthlyExpenses = [];

let currentBudget = 0;


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
// PAGE ELEMENTS
// =====================================================

const budgetPage =
    document.getElementById("budgetPage");

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
// MESSAGE + LOADING
// =====================================================

const budgetMessage =
    document.getElementById("budgetMessage");

const budgetLoading =
    document.getElementById("budgetLoading");


// =====================================================
// PERIOD
// =====================================================

const budgetMonth =
    document.getElementById("budgetMonth");

const budgetYear =
    document.getElementById("budgetYear");

const budgetPeriodText =
    document.getElementById("budgetPeriodText");


// =====================================================
// SUMMARY
// =====================================================

const totalBudgetAmount =
    document.getElementById("totalBudgetAmount");

const totalSpentAmount =
    document.getElementById("totalSpentAmount");

const remainingBudgetAmount =
    document.getElementById("remainingBudgetAmount");

const budgetUsagePercentage =
    document.getElementById("budgetUsagePercentage");


// =====================================================
// PROGRESS
// =====================================================

const budgetStatusBadge =
    document.getElementById("budgetStatusBadge");

const progressPercentage =
    document.getElementById("progressPercentage");

const budgetProgressBar =
    document.getElementById("budgetProgressBar");

const progressSpent =
    document.getElementById("progressSpent");

const progressLimit =
    document.getElementById("progressLimit");


// =====================================================
// ALERT
// =====================================================

const budgetAlert =
    document.getElementById("budgetAlert");

const budgetAlertIcon =
    document.getElementById("budgetAlertIcon");

const budgetAlertTitle =
    document.getElementById("budgetAlertTitle");

const budgetAlertText =
    document.getElementById("budgetAlertText");


// =====================================================
// FORM
// =====================================================

const budgetForm =
    document.getElementById("budgetForm");

const monthlyBudgetInput =
    document.getElementById("monthlyBudgetInput");

const saveBudgetButton =
    document.getElementById("saveBudgetButton");


// =====================================================
// CATEGORY SPENDING
// =====================================================

const categoryBudgetList =
    document.getElementById("categoryBudgetList");

const categoryBudgetEmpty =
    document.getElementById("categoryBudgetEmpty");


// =====================================================
// INSIGHTS
// =====================================================

const dailyAverageExpense =
    document.getElementById("dailyAverageExpense");

const topBudgetCategory =
    document.getElementById("topBudgetCategory");

const topBudgetCategoryAmount =
    document.getElementById("topBudgetCategoryAmount");

const budgetExpenseCount =
    document.getElementById("budgetExpenseCount");

const dailyBudgetAvailable =
    document.getElementById("dailyBudgetAvailable");


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


        // USER EMAIL

        if (userEmail) {

            userEmail.textContent =
                user.email || "User";

        }


        // AVATAR

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


        // SHOW PAGE

        if (budgetPage) {

            budgetPage.style.display =
                "flex";

        }


        setupPeriodSelectors();

        await loadTransactions();

        await loadSelectedBudget();

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
// LOADING
// =====================================================

function showLoading() {

    budgetLoading?.classList.add(
        "visible"
    );

}


function hideLoading() {

    budgetLoading?.classList.remove(
        "visible"
    );

}


// =====================================================
// MESSAGE
// =====================================================

function showMessage(
    message,
    type = "success"
) {

    if (!budgetMessage) return;

    budgetMessage.textContent =
        message;

    budgetMessage.className =
        `budget-message visible ${type}`;

}


function clearMessage() {

    if (!budgetMessage) return;

    budgetMessage.textContent =
        "";

    budgetMessage.className =
        "budget-message";

}


// =====================================================
// SETUP PERIOD SELECTORS
// =====================================================

function setupPeriodSelectors() {

    setupMonthSelector();

    setupYearSelector();

}


// =====================================================
// MONTH SELECTOR
// =====================================================

function setupMonthSelector() {

    if (!budgetMonth) return;

    budgetMonth.innerHTML = "";

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

            budgetMonth.appendChild(
                option
            );

        }
    );


    const currentMonth =
        String(
            new Date().getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    budgetMonth.value =
        currentMonth;

}


// =====================================================
// YEAR SELECTOR
// =====================================================

function setupYearSelector() {

    if (!budgetYear) return;

    budgetYear.innerHTML = "";

    const currentYear =
        new Date().getFullYear();


    for (
        let year = currentYear + 1;
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

        budgetYear.appendChild(
            option
        );

    }


    budgetYear.value =
        String(currentYear);

}


// =====================================================
// PERIOD CHANGE
// =====================================================

budgetMonth?.addEventListener(
    "change",
    async () => {

        clearMessage();

        await loadSelectedBudget();

    }
);


budgetYear?.addEventListener(
    "change",
    async () => {

        clearMessage();

        await loadSelectedBudget();

    }
);


// =====================================================
// GET PERIOD
// =====================================================

function getSelectedPeriod() {

    return {

        month:
            budgetMonth?.value ||
            String(
                new Date().getMonth() + 1
            ).padStart(
                2,
                "0"
            ),

        year:
            budgetYear?.value ||
            String(
                new Date().getFullYear()
            )

    };

}


// =====================================================
// BUDGET DOCUMENT ID
// Example: 2026-07
// =====================================================

function getBudgetDocumentId() {

    const {
        month,
        year
    } = getSelectedPeriod();

    return `${year}-${month}`;

}


// =====================================================
// UPDATE PERIOD TEXT
// =====================================================

function updatePeriodText() {

    if (!budgetPeriodText) return;

    const {
        month,
        year
    } = getSelectedPeriod();

    const monthIndex =
        Number(month) - 1;

    budgetPeriodText.textContent =
        `${monthNames[monthIndex]} ${year}`;

}


// =====================================================
// LOAD TRANSACTIONS
// =====================================================

async function loadTransactions() {

    if (!currentUser) return;

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

    }

    catch (error) {

        console.error(
            "Transaction loading error:",
            error
        );

        allTransactions = [];

        showMessage(
            "Unable to load transaction data.",
            "error"
        );

    }

}


// =====================================================
// LOAD SELECTED BUDGET
// =====================================================

async function loadSelectedBudget() {

    if (!currentUser) return;

    showLoading();

    clearMessage();

    updatePeriodText();

    try {

        const budgetId =
            getBudgetDocumentId();


        const budgetReference =
            doc(
                db,
                "users",
                currentUser.uid,
                "budgets",
                budgetId
            );


        const budgetSnapshot =
            await getDoc(
                budgetReference
            );


        if (budgetSnapshot.exists()) {

            const data =
                budgetSnapshot.data();


            currentBudget =
                Number(
                    data.amount
                ) || 0;


            if (monthlyBudgetInput) {

                monthlyBudgetInput.value =
                    currentBudget > 0
                        ? currentBudget
                        : "";

            }

        }

        else {

            currentBudget = 0;


            if (monthlyBudgetInput) {

                monthlyBudgetInput.value =
                    "";

            }

        }


        calculateMonthlyExpenses();

        updateBudgetPage();

    }

    catch (error) {

        console.error(
            "Budget loading error:",
            error
        );


        currentBudget = 0;

        calculateMonthlyExpenses();

        updateBudgetPage();


        showMessage(
            "Unable to load this month's budget.",
            "error"
        );

    }

    finally {

        hideLoading();

    }

}


// =====================================================
// CALCULATE MONTHLY EXPENSES
// =====================================================

function calculateMonthlyExpenses() {

    const {
        month,
        year
    } = getSelectedPeriod();


    monthlyExpenses =
        allTransactions.filter(
            transaction => {

                const type =
                    String(
                        transaction.type || ""
                    )
                        .trim()
                        .toLowerCase();


                if (type !== "expense") {

                    return false;

                }


                const date =
                    String(
                        transaction.date || ""
                    );


                if (
                    !/^\d{4}-\d{2}-\d{2}$/.test(
                        date
                    )
                ) {

                    return false;

                }


                const transactionYear =
                    date.substring(
                        0,
                        4
                    );


                const transactionMonth =
                    date.substring(
                        5,
                        7
                    );


                return (
                    transactionYear === year &&
                    transactionMonth === month
                );

            }
        );

}


// =====================================================
// TOTAL SPENT
// =====================================================

function calculateTotalSpent() {

    return monthlyExpenses.reduce(
        (total, transaction) => {

            const amount =
                Number(
                    transaction.amount
                ) || 0;

            return total + amount;

        },
        0
    );

}


// =====================================================
// UPDATE COMPLETE PAGE
// =====================================================

function updateBudgetPage() {

    const totalSpent =
        calculateTotalSpent();


    const remaining =
        currentBudget -
        totalSpent;


    const usage =
        currentBudget > 0
            ? (
                totalSpent /
                currentBudget
            ) * 100
            : 0;


    updateSummary(
        totalSpent,
        remaining,
        usage
    );


    updateProgress(
        totalSpent,
        usage
    );


    updateBudgetStatus(
        totalSpent,
        remaining,
        usage
    );


    renderCategorySpending(
        totalSpent
    );


    updateInsights(
        totalSpent,
        remaining
    );

}


// =====================================================
// SUMMARY
// =====================================================

function updateSummary(
    totalSpent,
    remaining,
    usage
) {

    if (totalBudgetAmount) {

        totalBudgetAmount.textContent =
            formatCurrency(
                currentBudget
            );

    }


    if (totalSpentAmount) {

        totalSpentAmount.textContent =
            formatCurrency(
                totalSpent
            );

    }


    if (remainingBudgetAmount) {

        remainingBudgetAmount.textContent =
            formatCurrency(
                remaining
            );

    }


    if (budgetUsagePercentage) {

        budgetUsagePercentage.textContent =
            currentBudget > 0
                ? `${usage.toFixed(1)}%`
                : "0.0%";

    }

}


// =====================================================
// PROGRESS BAR
// =====================================================

function updateProgress(
    totalSpent,
    usage
) {

    if (progressPercentage) {

        progressPercentage.textContent =
            currentBudget > 0
                ? `${usage.toFixed(1)}%`
                : "0.0%";

    }


    if (progressSpent) {

        progressSpent.textContent =
            `${formatCurrency(
                totalSpent
            )} spent`;

    }


    if (progressLimit) {

        progressLimit.textContent =
            `${formatCurrency(
                currentBudget
            )} budget`;

    }


    if (!budgetProgressBar) return;


    const visualPercentage =
        Math.min(
            Math.max(
                usage,
                0
            ),
            100
        );


    budgetProgressBar.style.width =
        `${visualPercentage}%`;


    budgetProgressBar.className =
        "budget-progress-bar";


    if (currentBudget <= 0) {

        return;

    }


    if (usage >= 100) {

        budgetProgressBar.classList.add(
            "danger"
        );

    }

    else if (usage >= 80) {

        budgetProgressBar.classList.add(
            "warning"
        );

    }

}


// =====================================================
// STATUS + ALERT
// =====================================================

function updateBudgetStatus(
    totalSpent,
    remaining,
    usage
) {

    if (!budgetStatusBadge) return;


    budgetStatusBadge.className =
        "budget-status-badge";


    if (budgetAlert) {

        budgetAlert.className =
            "budget-alert";

    }


    // NO BUDGET

    if (currentBudget <= 0) {

        budgetStatusBadge.textContent =
            "No Budget";


        if (budgetAlertIcon) {

            budgetAlertIcon.textContent =
                "₹";

        }


        if (budgetAlertTitle) {

            budgetAlertTitle.textContent =
                "Set your monthly budget";

        }


        if (budgetAlertText) {

            budgetAlertText.textContent =
                totalSpent > 0
                    ? `You have already spent ${formatCurrency(
                        totalSpent
                    )} this month. Set a budget to track your spending.`
                    : "Create a spending limit to start tracking your monthly budget.";

        }


        return;

    }


    // EXCEEDED

    if (usage >= 100) {

        budgetStatusBadge.textContent =
            "Exceeded";

        budgetStatusBadge.classList.add(
            "danger"
        );


        budgetAlert?.classList.add(
            "danger"
        );


        if (budgetAlertIcon) {

            budgetAlertIcon.textContent =
                "!";

        }


        if (budgetAlertTitle) {

            budgetAlertTitle.textContent =
                "Budget exceeded";

        }


        if (budgetAlertText) {

            const exceededBy =
                Math.abs(
                    remaining
                );


            budgetAlertText.textContent =
                `You have exceeded your budget by ${formatCurrency(
                    exceededBy
                )}.`;

        }


        return;

    }


    // WARNING

    if (usage >= 80) {

        budgetStatusBadge.textContent =
            "Almost Reached";

        budgetStatusBadge.classList.add(
            "warning"
        );


        budgetAlert?.classList.add(
            "warning"
        );


        if (budgetAlertIcon) {

            budgetAlertIcon.textContent =
                "!";

        }


        if (budgetAlertTitle) {

            budgetAlertTitle.textContent =
                "Approaching budget limit";

        }


        if (budgetAlertText) {

            budgetAlertText.textContent =
                `${formatCurrency(
                    remaining
                )} remains in your budget.`;

        }


        return;

    }


    // SAFE

    budgetStatusBadge.textContent =
        "On Track";

    budgetStatusBadge.classList.add(
        "safe"
    );


    budgetAlert?.classList.add(
        "safe"
    );


    if (budgetAlertIcon) {

        budgetAlertIcon.textContent =
            "✓";

    }


    if (budgetAlertTitle) {

        budgetAlertTitle.textContent =
            "Budget is on track";

    }


    if (budgetAlertText) {

        budgetAlertText.textContent =
            `${formatCurrency(
                remaining
            )} remains available for this month.`;

    }

}


// =====================================================
// SAVE / UPDATE BUDGET
// =====================================================

budgetForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!currentUser) {

            return;

        }


        const amount =
            Number(
                monthlyBudgetInput?.value
            );


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            showMessage(
                "Please enter a valid budget amount greater than zero.",
                "error"
            );

            return;

        }


        saveBudgetButton.disabled =
            true;


        saveBudgetButton.textContent =
            "Saving...";


        clearMessage();


        try {

            const {
                month,
                year
            } = getSelectedPeriod();


            const budgetId =
                getBudgetDocumentId();


            const budgetReference =
                doc(
                    db,
                    "users",
                    currentUser.uid,
                    "budgets",
                    budgetId
                );


            await setDoc(
                budgetReference,
                {
                    amount,

                    month,

                    year,

                    period:
                        budgetId,

                    updatedAt:
                        serverTimestamp()
                },
                {
                    merge: true
                }
            );


            currentBudget =
                amount;


            updateBudgetPage();


            showMessage(
                `Budget for ${monthNames[
                    Number(month) - 1
                ]} ${year} saved successfully.`,
                "success"
            );

        }

        catch (error) {

            console.error(
                "Budget save error:",
                error
            );


            showMessage(
                "Unable to save the budget. Please try again.",
                "error"
            );

        }

        finally {

            saveBudgetButton.disabled =
                false;


            saveBudgetButton.textContent =
                "Save Budget";

        }

    }
);


// =====================================================
// CATEGORY TOTALS
// =====================================================

function calculateCategoryTotals() {

    const categoryTotals = {};


    monthlyExpenses.forEach(
        transaction => {

            const category =
                String(
                    transaction.category ||
                    "Other"
                ).trim() || "Other";


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


    return Object.entries(
        categoryTotals
    ).sort(
        (a, b) =>
            b[1] - a[1]
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
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
// RENDER CATEGORY SPENDING
// =====================================================

function renderCategorySpending(
    totalSpent
) {

    if (!categoryBudgetList) {

        return;

    }


    const categories =
        calculateCategoryTotals();


    if (categories.length === 0) {

        categoryBudgetList.innerHTML =
            "";


        if (categoryBudgetEmpty) {

            categoryBudgetEmpty.hidden =
                false;

        }


        return;

    }


    if (categoryBudgetEmpty) {

        categoryBudgetEmpty.hidden =
            true;

    }


    categoryBudgetList.innerHTML =
        categories
            .map(
                ([category, amount]) => {

                    const percentage =
                        totalSpent > 0
                            ? (
                                amount /
                                totalSpent
                            ) * 100
                            : 0;


                    return `
                        <article
                            class="category-budget-item"
                        >

                            <div
                                class="category-budget-top"
                            >

                                <div
                                    class="category-budget-name"
                                >

                                    <strong>
                                        ${escapeHTML(
                                            category
                                        )}
                                    </strong>

                                    <span>
                                        ${percentage.toFixed(
                                            1
                                        )}% of monthly expenses
                                    </span>

                                </div>


                                <div
                                    class="category-budget-amount"
                                >
                                    ${formatCurrency(
                                        amount
                                    )}
                                </div>

                            </div>


                            <div
                                class="category-progress-track"
                            >

                                <div
                                    class="category-progress-bar"
                                    style="width: ${Math.min(
                                        percentage,
                                        100
                                    )}%;"
                                >
                                </div>

                            </div>

                        </article>
                    `;

                }
            )
            .join("");

}


// =====================================================
// DAYS IN SELECTED MONTH
// =====================================================

function getDaysInSelectedMonth() {

    const {
        month,
        year
    } = getSelectedPeriod();


    return new Date(
        Number(year),
        Number(month),
        0
    ).getDate();

}


// =====================================================
// DAYS LEFT
// =====================================================

function getDaysRemaining() {

    const {
        month,
        year
    } = getSelectedPeriod();


    const selectedYear =
        Number(year);


    const selectedMonthIndex =
        Number(month) - 1;


    const today =
        new Date();


    const currentYear =
        today.getFullYear();


    const currentMonthIndex =
        today.getMonth();


    const daysInMonth =
        getDaysInSelectedMonth();


    // FUTURE MONTH

    if (
        selectedYear > currentYear ||
        (
            selectedYear === currentYear &&
            selectedMonthIndex >
                currentMonthIndex
        )
    ) {

        return daysInMonth;

    }


    // PAST MONTH

    if (
        selectedYear < currentYear ||
        (
            selectedYear === currentYear &&
            selectedMonthIndex <
                currentMonthIndex
        )
    ) {

        return 0;

    }


    // CURRENT MONTH

    return Math.max(
        daysInMonth -
        today.getDate() +
        1,
        1
    );

}


// =====================================================
// DAILY AVERAGE
// =====================================================

function calculateDailyAverage(
    totalSpent
) {

    const {
        month,
        year
    } = getSelectedPeriod();


    const today =
        new Date();


    const selectedYear =
        Number(year);


    const selectedMonthIndex =
        Number(month) - 1;


    const daysInMonth =
        getDaysInSelectedMonth();


    let divisor =
        daysInMonth;


    if (
        selectedYear ===
            today.getFullYear() &&
        selectedMonthIndex ===
            today.getMonth()
    ) {

        divisor =
            today.getDate();

    }


    if (divisor <= 0) {

        return 0;

    }


    return totalSpent /
        divisor;

}


// =====================================================
// UPDATE INSIGHTS
// =====================================================

function updateInsights(
    totalSpent,
    remaining
) {

    // DAILY AVERAGE

    const dailyAverage =
        calculateDailyAverage(
            totalSpent
        );


    if (dailyAverageExpense) {

        dailyAverageExpense.textContent =
            formatCurrency(
                dailyAverage
            );

    }


    // TOP CATEGORY

    const categories =
        calculateCategoryTotals();


    const topCategory =
        categories[0];


    if (topBudgetCategory) {

        topBudgetCategory.textContent =
            topCategory
                ? topCategory[0]
                : "No data";

    }


    if (topBudgetCategoryAmount) {

        topBudgetCategoryAmount.textContent =
            topCategory
                ? formatCurrency(
                    topCategory[1]
                )
                : formatCurrency(0);

    }


    // EXPENSE COUNT

    if (budgetExpenseCount) {

        budgetExpenseCount.textContent =
            monthlyExpenses.length;

    }


    // DAILY BUDGET AVAILABLE

    const daysRemaining =
        getDaysRemaining();


    let availablePerDay = 0;


    if (
        currentBudget > 0 &&
        remaining > 0 &&
        daysRemaining > 0
    ) {

        availablePerDay =
            remaining /
            daysRemaining;

    }


    if (dailyBudgetAvailable) {

        dailyBudgetAvailable.textContent =
            formatCurrency(
                availablePerDay
            );

    }

}