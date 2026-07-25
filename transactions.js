// ==========================================
// transactions.js
// Read transactions from Firestore
// ==========================================

import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";


// ==========================================
// Load Transactions
// ==========================================

export async function loadTransactions(uid) {

    try {

        const transactionRef = collection(
            db,
            "users",
            uid,
            "transactions"
        );

        const q = query(
            transactionRef,
            orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        const transactions = [];

        snapshot.forEach((doc) => {

            transactions.push({
                id: doc.id,
                ...doc.data()
            });

        });

        return transactions;

    } catch (error) {

        console.error("Error loading transactions:", error);

        return [];

    }

}


// ==========================================
// Dashboard Summary
// ==========================================

export function calculateSummary(transactions) {

    let income = 0;
    let expense = 0;

    transactions.forEach((item) => {

        const amount = Number(item.amount);

        if (item.type === "income") {

            income += amount;

        } else {

            expense += amount;

        }

    });

    return {

        income,

        expense,

        balance: income - expense,

        savings: income - expense

    };

}


// ==========================================
// Latest Transactions
// ==========================================

export function getRecentTransactions(
    transactions,
    limit = 5
) {

    return transactions.slice(0, limit);

}