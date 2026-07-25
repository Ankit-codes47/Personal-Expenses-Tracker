// ==========================================
// utils.js
// Common Utility Functions
// Expense Tracker
// ==========================================



// ==========================================
// FORMAT CURRENCY (Indian Rupees)
// ==========================================

export function formatCurrency(amount) {

    const value = Number(amount) || 0;

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);

}



// ==========================================
// FORMAT DATE
// YYYY-MM-DD -> 24 Jul 2026
// ==========================================

export function formatDate(dateString) {

    if (!dateString) return "--";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

}



// ==========================================
// GET CURRENT DATE
// Returns YYYY-MM-DD
// ==========================================

export function getCurrentDate() {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(today.getMonth() + 1).padStart(2, "0");

    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}



// ==========================================
// CAPITALIZE FIRST LETTER
// ==========================================

export function capitalize(text) {

    if (!text) return "";

    return text.charAt(0).toUpperCase() + text.slice(1);

}



// ==========================================
// GET INITIAL LETTER
// ==========================================

export function getInitial(name) {

    if (!name) return "U";

    return name.trim().charAt(0).toUpperCase();

}



// ==========================================
// CALCULATE SAVINGS
// ==========================================

export function calculateSavings(income, expense) {

    const totalIncome = Number(income) || 0;

    const totalExpense = Number(expense) || 0;

    return totalIncome - totalExpense;

}



// ==========================================
// SHOW SUCCESS MESSAGE
// ==========================================

export function showSuccess(element, message) {

    if (!element) return;

    element.textContent = message;
    element.className = "transaction-message success";

}



// ==========================================
// SHOW ERROR MESSAGE
// ==========================================

export function showError(element, message) {

    if (!element) return;

    element.textContent = message;
    element.className = "transaction-message error";

}



// ==========================================
// CLEAR MESSAGE
// ==========================================

export function clearMessage(element) {

    if (!element) return;

    element.textContent = "";
    element.className = "transaction-message";

}



// ==========================================
// SHOW TOAST
// ==========================================

export function showToast(message) {

    // If you have a toast element later, you can replace this.
    alert(message);

}