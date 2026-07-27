// =====================================================
// savings.js
// Expense Tracker - Day 8
// Savings Goals Management
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
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import {
    formatCurrency
} from "./utils.js";


// =====================================================
// STATE
// =====================================================

let currentUser = null;

let savingsGoals = [];

let currentFilter = "all";


// =====================================================
// PAGE ELEMENTS
// =====================================================

const savingsPage =
    document.getElementById("savingsPage");

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

const savingsMessage =
    document.getElementById("savingsMessage");

const savingsLoading =
    document.getElementById("savingsLoading");


// =====================================================
// SUMMARY
// =====================================================

const totalSavingsTarget =
    document.getElementById("totalSavingsTarget");

const totalSavingsAmount =
    document.getElementById("totalSavingsAmount");

const totalSavingsRemaining =
    document.getElementById("totalSavingsRemaining");

const completedGoalsCount =
    document.getElementById("completedGoalsCount");


// =====================================================
// OVERALL PROGRESS
// =====================================================

const overallSavingsPercentage =
    document.getElementById("overallSavingsPercentage");

const overallSavingsProgressBar =
    document.getElementById("overallSavingsProgressBar");

const overallSavedText =
    document.getElementById("overallSavedText");

const overallTargetText =
    document.getElementById("overallTargetText");


// =====================================================
// GOALS
// =====================================================

const savingsGoalsGrid =
    document.getElementById("savingsGoalsGrid");

const savingsEmptyState =
    document.getElementById("savingsEmptyState");

const goalsCountText =
    document.getElementById("goalsCountText");

const goalStatusFilter =
    document.getElementById("goalStatusFilter");


// =====================================================
// CREATE / EDIT MODAL
// =====================================================

const goalModal =
    document.getElementById("goalModal");

const openGoalModalButton =
    document.getElementById("openGoalModalButton");

const emptyCreateGoalButton =
    document.getElementById("emptyCreateGoalButton");

const closeGoalModalButton =
    document.getElementById("closeGoalModalButton");

const cancelGoalButton =
    document.getElementById("cancelGoalButton");

const goalModalTitle =
    document.getElementById("goalModalTitle");

const goalForm =
    document.getElementById("goalForm");

const editingGoalId =
    document.getElementById("editingGoalId");

const goalName =
    document.getElementById("goalName");

const goalTargetAmount =
    document.getElementById("goalTargetAmount");

const goalSavedAmount =
    document.getElementById("goalSavedAmount");

const goalTargetDate =
    document.getElementById("goalTargetDate");

const goalNote =
    document.getElementById("goalNote");

const saveGoalButton =
    document.getElementById("saveGoalButton");


// =====================================================
// ADD SAVINGS MODAL
// =====================================================

const addSavingsModal =
    document.getElementById("addSavingsModal");

const closeAddSavingsButton =
    document.getElementById("closeAddSavingsButton");

const cancelAddSavingsButton =
    document.getElementById("cancelAddSavingsButton");

const addSavingsForm =
    document.getElementById("addSavingsForm");

const addSavingsGoalId =
    document.getElementById("addSavingsGoalId");

const addSavingsGoalName =
    document.getElementById("addSavingsGoalName");

const addSavingsGoalProgress =
    document.getElementById("addSavingsGoalProgress");

const addSavingsAmount =
    document.getElementById("addSavingsAmount");

const confirmAddSavingsButton =
    document.getElementById("confirmAddSavingsButton");


// =====================================================
// DELETE MODAL
// =====================================================

const deleteGoalModal =
    document.getElementById("deleteGoalModal");

const deleteGoalId =
    document.getElementById("deleteGoalId");

const deleteGoalName =
    document.getElementById("deleteGoalName");

const cancelDeleteGoalButton =
    document.getElementById("cancelDeleteGoalButton");

const confirmDeleteGoalButton =
    document.getElementById("confirmDeleteGoalButton");


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


        if (savingsPage) {

            savingsPage.style.display =
                "flex";

        }


        setMinimumTargetDate();

        await loadSavingsGoals();

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
// MOBILE SIDEBAR
// =====================================================

if (menuButton && sidebar) {

    menuButton.addEventListener("click", (event) => {

        event.stopPropagation();

        sidebar.classList.toggle("open");

    });


    // Close sidebar when clicking outside
    document.addEventListener("click", (event) => {

        if (
            sidebar.classList.contains("open") &&
            !sidebar.contains(event.target) &&
            !menuButton.contains(event.target)
        ) {

            sidebar.classList.remove("open");

        }

    });


    // Close sidebar after selecting a navigation link
    const navLinks =
        sidebar.querySelectorAll(".nav-link");

    navLinks.forEach((link) => {

        link.addEventListener("click", () => {

            sidebar.classList.remove("open");

        });

    });

}


// =====================================================
// LOADING
// =====================================================

function showLoading() {

    savingsLoading?.classList.add(
        "visible"
    );

}


function hideLoading() {

    savingsLoading?.classList.remove(
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

    if (!savingsMessage) return;

    savingsMessage.textContent =
        message;

    savingsMessage.className =
        `savings-message visible ${type}`;


    window.setTimeout(
        () => {

            if (
                savingsMessage.textContent ===
                message
            ) {

                clearMessage();

            }

        },
        5000
    );

}


function clearMessage() {

    if (!savingsMessage) return;

    savingsMessage.textContent =
        "";

    savingsMessage.className =
        "savings-message";

}


// =====================================================
// FIRESTORE COLLECTION
// =====================================================

function getGoalsCollection() {

    if (!currentUser) {

        return null;

    }


    return collection(
        db,
        "users",
        currentUser.uid,
        "savingsGoals"
    );

}


// =====================================================
// LOAD SAVINGS GOALS
// =====================================================

async function loadSavingsGoals() {

    if (!currentUser) return;

    showLoading();

    clearMessage();


    try {

        const goalsReference =
            getGoalsCollection();


        const goalsQuery =
            query(
                goalsReference,
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                goalsQuery
            );


        savingsGoals =
            snapshot.docs.map(
                documentSnapshot => ({
                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()
                })
            );


        updateSavingsPage();

    }

    catch (error) {

        console.error(
            "Savings goals loading error:",
            error
        );


        savingsGoals = [];

        updateSavingsPage();


        showMessage(
            "Unable to load your savings goals.",
            "error"
        );

    }

    finally {

        hideLoading();

    }

}


// =====================================================
// UPDATE COMPLETE PAGE
// =====================================================

function updateSavingsPage() {

    updateSummary();

    updateOverallProgress();

    renderGoals();

}


// =====================================================
// GOAL NUMBERS
// =====================================================

function getGoalTarget(goal) {

    return Math.max(
        Number(
            goal.targetAmount
        ) || 0,
        0
    );

}


function getGoalSaved(goal) {

    return Math.max(
        Number(
            goal.savedAmount
        ) || 0,
        0
    );

}


function isGoalCompleted(goal) {

    const target =
        getGoalTarget(goal);

    const saved =
        getGoalSaved(goal);


    return (
        target > 0 &&
        saved >= target
    );

}


// =====================================================
// SUMMARY
// =====================================================

function updateSummary() {

    let totalTarget = 0;

    let totalSaved = 0;

    let completed = 0;


    savingsGoals.forEach(
        goal => {

            totalTarget +=
                getGoalTarget(goal);

            totalSaved +=
                getGoalSaved(goal);


            if (
                isGoalCompleted(goal)
            ) {

                completed++;

            }

        }
    );


    const remaining =
        Math.max(
            totalTarget -
            totalSaved,
            0
        );


    if (totalSavingsTarget) {

        totalSavingsTarget.textContent =
            formatCurrency(
                totalTarget
            );

    }


    if (totalSavingsAmount) {

        totalSavingsAmount.textContent =
            formatCurrency(
                totalSaved
            );

    }


    if (totalSavingsRemaining) {

        totalSavingsRemaining.textContent =
            formatCurrency(
                remaining
            );

    }


    if (completedGoalsCount) {

        completedGoalsCount.textContent =
            String(completed);

    }

}


// =====================================================
// OVERALL PROGRESS
// =====================================================

function updateOverallProgress() {

    const totalTarget =
        savingsGoals.reduce(
            (total, goal) =>
                total +
                getGoalTarget(goal),
            0
        );


    const totalSaved =
        savingsGoals.reduce(
            (total, goal) =>
                total +
                getGoalSaved(goal),
            0
        );


    const percentage =
        totalTarget > 0
            ? (
                totalSaved /
                totalTarget
            ) * 100
            : 0;


    if (overallSavingsPercentage) {

        overallSavingsPercentage.textContent =
            `${percentage.toFixed(1)}%`;

    }


    if (overallSavingsProgressBar) {

        overallSavingsProgressBar.style.width =
            `${Math.min(
                Math.max(
                    percentage,
                    0
                ),
                100
            )}%`;

    }


    if (overallSavedText) {

        overallSavedText.textContent =
            `${formatCurrency(
                totalSaved
            )} saved`;

    }


    if (overallTargetText) {

        overallTargetText.textContent =
            `${formatCurrency(
                totalTarget
            )} target`;

    }

}


// =====================================================
// FILTER
// =====================================================

goalStatusFilter?.addEventListener(
    "change",
    () => {

        currentFilter =
            goalStatusFilter.value;

        renderGoals();

    }
);


// =====================================================
// GET FILTERED GOALS
// =====================================================

function getFilteredGoals() {

    if (
        currentFilter === "active"
    ) {

        return savingsGoals.filter(
            goal =>
                !isGoalCompleted(goal)
        );

    }


    if (
        currentFilter === "completed"
    ) {

        return savingsGoals.filter(
            goal =>
                isGoalCompleted(goal)
        );

    }


    return savingsGoals;

}


// =====================================================
// RENDER GOALS
// =====================================================

function renderGoals() {

    if (!savingsGoalsGrid) return;


    const filteredGoals =
        getFilteredGoals();


    updateGoalsCount(
        filteredGoals.length
    );


    // NO GOALS AT ALL

    if (
        savingsGoals.length === 0
    ) {

        savingsGoalsGrid.innerHTML =
            "";


        if (savingsEmptyState) {

            savingsEmptyState.hidden =
                false;

        }


        return;

    }


    if (savingsEmptyState) {

        savingsEmptyState.hidden =
            true;

    }


    // FILTER HAS NO RESULTS

    if (
        filteredGoals.length === 0
    ) {

        savingsGoalsGrid.innerHTML = `
            <div class="savings-loading-placeholder">
                No ${escapeHTML(
                    currentFilter
                )} goals found.
            </div>
        `;

        return;

    }


    savingsGoalsGrid.innerHTML =
        filteredGoals
            .map(
                goal =>
                    createGoalCard(goal)
            )
            .join("");

}


// =====================================================
// GOALS COUNT
// =====================================================

function updateGoalsCount(count) {

    if (!goalsCountText) return;


    goalsCountText.textContent =
        `${count} ${
            count === 1
                ? "goal"
                : "goals"
        }`;

}


// =====================================================
// CREATE GOAL CARD
// =====================================================

function createGoalCard(goal) {

    const target =
        getGoalTarget(goal);

    const saved =
        getGoalSaved(goal);


    const remaining =
        Math.max(
            target - saved,
            0
        );


    const percentage =
        target > 0
            ? (
                saved /
                target
            ) * 100
            : 0;


    const completed =
        isGoalCompleted(goal);


    const targetDate =
        formatTargetDate(
            goal.targetDate
        );


    const daysText =
        getDaysRemainingText(
            goal.targetDate,
            completed
        );


    const note =
        String(
            goal.note || ""
        ).trim();


    return `
        <article
            class="savings-goal-card ${
                completed
                    ? "completed"
                    : ""
            }"
        >

            <div class="goal-card-header">

                <div class="goal-card-title">

                    <h3>
                        ${escapeHTML(
                            goal.name ||
                            "Savings Goal"
                        )}
                    </h3>

                    <p>
                        Target date:
                        ${escapeHTML(
                            targetDate
                        )}
                    </p>

                </div>


                <span
                    class="goal-status ${
                        completed
                            ? "completed"
                            : "active"
                    }"
                >
                    ${
                        completed
                            ? "Completed"
                            : "Active"
                    }
                </span>

            </div>


            <div class="goal-money">

                <div class="goal-saved-amount">

                    <span>
                        Saved
                    </span>

                    <strong>
                        ${formatCurrency(
                            saved
                        )}
                    </strong>

                </div>


                <div class="goal-target-amount">

                    <span>
                        Target
                    </span>

                    <strong>
                        ${formatCurrency(
                            target
                        )}
                    </strong>

                </div>

            </div>


            <div class="goal-progress-info">

                <span>
                    Progress
                </span>

                <strong>
                    ${percentage.toFixed(
                        1
                    )}%
                </strong>

            </div>


            <div class="goal-progress-track">

                <div
                    class="goal-progress-bar"
                    style="width: ${Math.min(
                        Math.max(
                            percentage,
                            0
                        ),
                        100
                    )}%;"
                >
                </div>

            </div>


            <div class="goal-details">

                <div class="goal-detail">

                    <span>
                        Remaining
                    </span>

                    <strong>
                        ${formatCurrency(
                            remaining
                        )}
                    </strong>

                </div>


                <div class="goal-detail">

                    <span>
                        Timeline
                    </span>

                    <strong>
                        ${escapeHTML(
                            daysText
                        )}
                    </strong>

                </div>

            </div>


            ${
                note
                    ? `
                        <div class="goal-note">
                            ${escapeHTML(
                                note
                            )}
                        </div>
                    `
                    : ""
            }


            <div class="goal-actions">

                <button
                    type="button"
                    class="goal-action-btn add-money"
                    data-action="add"
                    data-goal-id="${escapeHTML(
                        goal.id
                    )}"
                    ${
                        completed
                            ? "disabled"
                            : ""
                    }
                >
                    ${
                        completed
                            ? "Goal Complete"
                            : "+ Add Money"
                    }
                </button>


                <button
                    type="button"
                    class="goal-action-btn"
                    data-action="edit"
                    data-goal-id="${escapeHTML(
                        goal.id
                    )}"
                >
                    Edit
                </button>


                <button
                    type="button"
                    class="goal-action-btn delete"
                    data-action="delete"
                    data-goal-id="${escapeHTML(
                        goal.id
                    )}"
                >
                    Delete
                </button>

            </div>

        </article>
    `;

}


// =====================================================
// CARD ACTIONS
// =====================================================

savingsGoalsGrid?.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if (!button) return;


        const goalId =
            button.dataset.goalId;

        const action =
            button.dataset.action;


        if (!goalId) return;


        if (action === "add") {

            openAddSavingsModal(
                goalId
            );

        }

        else if (
            action === "edit"
        ) {

            openEditGoalModal(
                goalId
            );

        }

        else if (
            action === "delete"
        ) {

            openDeleteGoalModal(
                goalId
            );

        }

    }
);


// =====================================================
// FIND GOAL
// =====================================================

function findGoal(goalId) {

    return savingsGoals.find(
        goal =>
            goal.id === goalId
    );

}


// =====================================================
// SET MIN TARGET DATE
// =====================================================

function setMinimumTargetDate() {

    if (!goalTargetDate) return;


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


    goalTargetDate.min =
        `${year}-${month}-${day}`;

}


// =====================================================
// OPEN CREATE GOAL
// =====================================================

openGoalModalButton?.addEventListener(
    "click",
    openCreateGoalModal
);


emptyCreateGoalButton?.addEventListener(
    "click",
    openCreateGoalModal
);


function openCreateGoalModal() {

    clearMessage();

    goalForm?.reset();


    if (editingGoalId) {

        editingGoalId.value =
            "";

    }


    if (goalSavedAmount) {

        goalSavedAmount.value =
            "0";

    }


    if (goalModalTitle) {

        goalModalTitle.textContent =
            "Create New Goal";

    }


    if (saveGoalButton) {

        saveGoalButton.textContent =
            "Create Goal";

    }


    setMinimumTargetDate();

    openModal(
        goalModal
    );


    window.setTimeout(
        () => {

            goalName?.focus();

        },
        50
    );

}


// =====================================================
// OPEN EDIT GOAL
// =====================================================

function openEditGoalModal(goalId) {

    const goal =
        findGoal(goalId);


    if (!goal) return;


    clearMessage();


    if (editingGoalId) {

        editingGoalId.value =
            goal.id;

    }


    if (goalName) {

        goalName.value =
            goal.name || "";

    }


    if (goalTargetAmount) {

        goalTargetAmount.value =
            getGoalTarget(goal);

    }


    if (goalSavedAmount) {

        goalSavedAmount.value =
            getGoalSaved(goal);

    }


    if (goalTargetDate) {

        goalTargetDate.value =
            goal.targetDate || "";

    }


    if (goalNote) {

        goalNote.value =
            goal.note || "";

    }


    if (goalModalTitle) {

        goalModalTitle.textContent =
            "Edit Savings Goal";

    }


    if (saveGoalButton) {

        saveGoalButton.textContent =
            "Save Changes";

    }


    openModal(
        goalModal
    );

}


// =====================================================
// CLOSE GOAL MODAL
// =====================================================

closeGoalModalButton?.addEventListener(
    "click",
    () =>
        closeModal(goalModal)
);


cancelGoalButton?.addEventListener(
    "click",
    () =>
        closeModal(goalModal)
);


document
    .querySelectorAll(
        "[data-close-goal-modal]"
    )
    .forEach(
        element => {

            element.addEventListener(
                "click",
                () =>
                    closeModal(
                        goalModal
                    )
            );

        }
    );


// =====================================================
// CREATE / UPDATE GOAL
// =====================================================

goalForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!currentUser) return;


        const name =
            String(
                goalName?.value || ""
            ).trim();


        const targetAmount =
            Number(
                goalTargetAmount?.value
            );


        const savedAmount =
            Number(
                goalSavedAmount?.value
            );


        const targetDate =
            String(
                goalTargetDate?.value ||
                ""
            );


        const note =
            String(
                goalNote?.value || ""
            ).trim();


        const editId =
            String(
                editingGoalId?.value ||
                ""
            ).trim();


        // VALIDATION

        if (!name) {

            showMessage(
                "Please enter a goal name.",
                "error"
            );

            return;

        }


        if (
            !Number.isFinite(
                targetAmount
            ) ||
            targetAmount <= 0
        ) {

            showMessage(
                "Please enter a valid target amount.",
                "error"
            );

            return;

        }


        if (
            !Number.isFinite(
                savedAmount
            ) ||
            savedAmount < 0
        ) {

            showMessage(
                "Already saved amount cannot be negative.",
                "error"
            );

            return;

        }


        if (!targetDate) {

            showMessage(
                "Please select a target date.",
                "error"
            );

            return;

        }


        if (
            savedAmount >
            targetAmount
        ) {

            showMessage(
                "Saved amount cannot be greater than the target amount.",
                "error"
            );

            return;

        }


        setGoalFormBusy(true);


        try {

            if (editId) {

                await updateExistingGoal(
                    editId,
                    {
                        name,
                        targetAmount,
                        savedAmount,
                        targetDate,
                        note
                    }
                );


                showMessage(
                    "Savings goal updated successfully.",
                    "success"
                );

            }

            else {

                await createNewGoal({
                    name,
                    targetAmount,
                    savedAmount,
                    targetDate,
                    note
                });


                showMessage(
                    "Savings goal created successfully.",
                    "success"
                );

            }


            closeModal(
                goalModal
            );


            await loadSavingsGoals();

        }

        catch (error) {

            console.error(
                "Goal save error:",
                error
            );


            showMessage(
                "Unable to save the savings goal.",
                "error"
            );

        }

        finally {

            setGoalFormBusy(false);

        }

    }
);


// =====================================================
// CREATE NEW GOAL
// =====================================================

async function createNewGoal(data) {

    const goalsReference =
        getGoalsCollection();


    await addDoc(
        goalsReference,
        {
            name:
                data.name,

            targetAmount:
                data.targetAmount,

            savedAmount:
                data.savedAmount,

            targetDate:
                data.targetDate,

            note:
                data.note,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()
        }
    );

}


// =====================================================
// UPDATE GOAL
// =====================================================

async function updateExistingGoal(
    goalId,
    data
) {

    const goalReference =
        doc(
            db,
            "users",
            currentUser.uid,
            "savingsGoals",
            goalId
        );


    await updateDoc(
        goalReference,
        {
            name:
                data.name,

            targetAmount:
                data.targetAmount,

            savedAmount:
                data.savedAmount,

            targetDate:
                data.targetDate,

            note:
                data.note,

            updatedAt:
                serverTimestamp()
        }
    );

}


// =====================================================
// GOAL FORM BUSY
// =====================================================

function setGoalFormBusy(busy) {

    if (!saveGoalButton) return;


    saveGoalButton.disabled =
        busy;


    if (busy) {

        saveGoalButton.textContent =
            "Saving...";

        return;

    }


    saveGoalButton.textContent =
        editingGoalId?.value
            ? "Save Changes"
            : "Create Goal";

}


// =====================================================
// OPEN ADD SAVINGS
// =====================================================

function openAddSavingsModal(goalId) {

    const goal =
        findGoal(goalId);


    if (!goal) return;


    if (
        isGoalCompleted(goal)
    ) {

        showMessage(
            "This savings goal is already complete.",
            "success"
        );

        return;

    }


    if (addSavingsGoalId) {

        addSavingsGoalId.value =
            goal.id;

    }


    if (addSavingsGoalName) {

        addSavingsGoalName.textContent =
            goal.name ||
            "Savings Goal";

    }


    if (addSavingsGoalProgress) {

        addSavingsGoalProgress.textContent =
            `${formatCurrency(
                getGoalSaved(goal)
            )} of ${formatCurrency(
                getGoalTarget(goal)
            )} saved`;

    }


    if (addSavingsAmount) {

        addSavingsAmount.value =
            "";

    }


    openModal(
        addSavingsModal
    );


    window.setTimeout(
        () => {

            addSavingsAmount?.focus();

        },
        50
    );

}


// =====================================================
// CLOSE ADD SAVINGS
// =====================================================

closeAddSavingsButton?.addEventListener(
    "click",
    () =>
        closeModal(
            addSavingsModal
        )
);


cancelAddSavingsButton?.addEventListener(
    "click",
    () =>
        closeModal(
            addSavingsModal
        )
);


document
    .querySelectorAll(
        "[data-close-add-modal]"
    )
    .forEach(
        element => {

            element.addEventListener(
                "click",
                () =>
                    closeModal(
                        addSavingsModal
                    )
            );

        }
    );


// =====================================================
// ADD SAVINGS
// =====================================================

addSavingsForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!currentUser) return;


        const goalId =
            String(
                addSavingsGoalId?.value ||
                ""
            );


        const amount =
            Number(
                addSavingsAmount?.value
            );


        const goal =
            findGoal(goalId);


        if (!goal) {

            showMessage(
                "Savings goal could not be found.",
                "error"
            );

            closeModal(
                addSavingsModal
            );

            return;

        }


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            showMessage(
                "Please enter a valid amount to add.",
                "error"
            );

            return;

        }


        const currentSaved =
            getGoalSaved(goal);


        const target =
            getGoalTarget(goal);


        const remaining =
            Math.max(
                target -
                currentSaved,
                0
            );


        if (amount > remaining) {

            showMessage(
                `You only need ${formatCurrency(
                    remaining
                )} more to complete this goal.`,
                "error"
            );

            return;

        }


        if (confirmAddSavingsButton) {

            confirmAddSavingsButton.disabled =
                true;

            confirmAddSavingsButton.textContent =
                "Adding...";

        }


        try {

            const goalReference =
                doc(
                    db,
                    "users",
                    currentUser.uid,
                    "savingsGoals",
                    goal.id
                );


            await updateDoc(
                goalReference,
                {
                    savedAmount:
                        currentSaved +
                        amount,

                    updatedAt:
                        serverTimestamp()
                }
            );


            closeModal(
                addSavingsModal
            );


            await loadSavingsGoals();


            if (
                currentSaved + amount >=
                target
            ) {

                showMessage(
                    `Goal "${goal.name}" completed!`,
                    "success"
                );

            }

            else {

                showMessage(
                    `${formatCurrency(
                        amount
                    )} added to "${goal.name}".`,
                    "success"
                );

            }

        }

        catch (error) {

            console.error(
                "Add savings error:",
                error
            );


            showMessage(
                "Unable to add savings to this goal.",
                "error"
            );

        }

        finally {

            if (
                confirmAddSavingsButton
            ) {

                confirmAddSavingsButton.disabled =
                    false;

                confirmAddSavingsButton.textContent =
                    "Add Savings";

            }

        }

    }
);


// =====================================================
// OPEN DELETE MODAL
// =====================================================

function openDeleteGoalModal(goalId) {

    const goal =
        findGoal(goalId);


    if (!goal) return;


    if (deleteGoalId) {

        deleteGoalId.value =
            goal.id;

    }


    if (deleteGoalName) {

        deleteGoalName.textContent =
            goal.name ||
            "this goal";

    }


    openModal(
        deleteGoalModal
    );

}


// =====================================================
// CLOSE DELETE MODAL
// =====================================================

cancelDeleteGoalButton?.addEventListener(
    "click",
    () =>
        closeModal(
            deleteGoalModal
        )
);


document
    .querySelectorAll(
        "[data-close-delete-modal]"
    )
    .forEach(
        element => {

            element.addEventListener(
                "click",
                () =>
                    closeModal(
                        deleteGoalModal
                    )
            );

        }
    );


// =====================================================
// DELETE GOAL
// =====================================================

confirmDeleteGoalButton?.addEventListener(
    "click",
    async () => {

        if (!currentUser) return;


        const goalId =
            String(
                deleteGoalId?.value ||
                ""
            );


        const goal =
            findGoal(goalId);


        if (!goal) {

            closeModal(
                deleteGoalModal
            );

            return;

        }


        confirmDeleteGoalButton.disabled =
            true;

        confirmDeleteGoalButton.textContent =
            "Deleting...";


        try {

            const goalReference =
                doc(
                    db,
                    "users",
                    currentUser.uid,
                    "savingsGoals",
                    goal.id
                );


            await deleteDoc(
                goalReference
            );


            closeModal(
                deleteGoalModal
            );


            await loadSavingsGoals();


            showMessage(
                `Goal "${goal.name}" deleted.`,
                "success"
            );

        }

        catch (error) {

            console.error(
                "Delete goal error:",
                error
            );


            showMessage(
                "Unable to delete the savings goal.",
                "error"
            );

        }

        finally {

            confirmDeleteGoalButton.disabled =
                false;

            confirmDeleteGoalButton.textContent =
                "Delete Goal";

        }

    }
);


// =====================================================
// MODAL HELPERS
// =====================================================

function openModal(modal) {

    if (!modal) return;


    modal.classList.add(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );

}


function closeModal(modal) {

    if (!modal) return;


    modal.classList.remove(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    const anyOpenModal =
        document.querySelector(
            ".savings-modal.open"
        );


    if (!anyOpenModal) {

        document.body.classList.remove(
            "modal-open"
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
            event.key !== "Escape"
        ) {

            return;

        }


        if (
            deleteGoalModal?.classList.contains(
                "open"
            )
        ) {

            closeModal(
                deleteGoalModal
            );

            return;

        }


        if (
            addSavingsModal?.classList.contains(
                "open"
            )
        ) {

            closeModal(
                addSavingsModal
            );

            return;

        }


        if (
            goalModal?.classList.contains(
                "open"
            )
        ) {

            closeModal(
                goalModal
            );

        }

    }
);


// =====================================================
// TARGET DATE FORMAT
// =====================================================

function formatTargetDate(dateString) {

    if (
        !dateString ||
        !/^\d{4}-\d{2}-\d{2}$/.test(
            dateString
        )
    ) {

        return "No date";

    }


    const [
        year,
        month,
        day
    ] = dateString
        .split("-")
        .map(Number);


    const date =
        new Date(
            year,
            month - 1,
            day
        );


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


// =====================================================
// DAYS REMAINING TEXT
// =====================================================

function getDaysRemainingText(
    dateString,
    completed
) {

    if (completed) {

        return "Completed";

    }


    if (
        !dateString ||
        !/^\d{4}-\d{2}-\d{2}$/.test(
            dateString
        )
    ) {

        return "No deadline";

    }


    const [
        year,
        month,
        day
    ] = dateString
        .split("-")
        .map(Number);


    const target =
        new Date(
            year,
            month - 1,
            day
        );


    target.setHours(
        0,
        0,
        0,
        0
    );


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const difference =
        target.getTime() -
        today.getTime();


    const days =
        Math.ceil(
            difference /
            (
                1000 *
                60 *
                60 *
                24
            )
        );


    if (days < 0) {

        return "Deadline passed";

    }


    if (days === 0) {

        return "Due today";

    }


    if (days === 1) {

        return "1 day left";

    }


    return `${days} days left`;

}


// =====================================================
// HTML ESCAPING
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