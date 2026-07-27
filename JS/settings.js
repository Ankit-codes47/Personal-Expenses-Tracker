// =====================================================
// SETTINGS.JS
// Expense Tracker - Day 9
// =====================================================


// =====================================================
// FIREBASE IMPORTS
// =====================================================

import {
    auth,
    db
} from "./firebase-config.js";


import {
    onAuthStateChanged,
    signOut,
    updateProfile,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";


import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";


// =====================================================
// STATE
// =====================================================

let currentUser = null;


// =====================================================
// PAGE ELEMENTS
// =====================================================

const settingsPage =
    document.getElementById("settingsPage");

const userEmail =
    document.getElementById("userEmail");

const userAvatar =
    document.getElementById("userAvatar");

const menuButton =
    document.getElementById("menuButton");

const sidebar =
    document.querySelector(".sidebar");

const logoutButton =
    document.getElementById("logoutButton");

const settingsLogoutButton =
    document.getElementById("settingsLogoutButton");


// =====================================================
// MESSAGE / LOADING
// =====================================================

const settingsMessage =
    document.getElementById("settingsMessage");

const settingsLoading =
    document.getElementById("settingsLoading");


// =====================================================
// PROFILE OVERVIEW
// =====================================================

const settingsProfileAvatar =
    document.getElementById("settingsProfileAvatar");

const settingsDisplayName =
    document.getElementById("settingsDisplayName");

const settingsProfileEmail =
    document.getElementById("settingsProfileEmail");


// =====================================================
// PROFILE FORM
// =====================================================

const profileForm =
    document.getElementById("profileForm");

const displayName =
    document.getElementById("displayName");

const accountEmail =
    document.getElementById("accountEmail");

const saveProfileButton =
    document.getElementById("saveProfileButton");


// =====================================================
// PASSWORD FORM
// =====================================================

const passwordForm =
    document.getElementById("passwordForm");

const currentPassword =
    document.getElementById("currentPassword");

const newPassword =
    document.getElementById("newPassword");

const confirmPassword =
    document.getElementById("confirmPassword");

const changePasswordButton =
    document.getElementById("changePasswordButton");


// =====================================================
// PREFERENCES
// =====================================================

const preferencesForm =
    document.getElementById("preferencesForm");

const currencyPreference =
    document.getElementById("currencyPreference");

const dateFormatPreference =
    document.getElementById("dateFormatPreference");

const themePreference =
    document.getElementById("themePreference");

const savePreferencesButton =
    document.getElementById("savePreferencesButton");


// =====================================================
// ACCOUNT INFORMATION
// =====================================================

const accountInfoEmail =
    document.getElementById("accountInfoEmail");

const emailVerificationStatus =
    document.getElementById("emailVerificationStatus");

const accountCreatedDate =
    document.getElementById("accountCreatedDate");

const lastSignInDate =
    document.getElementById("lastSignInDate");


// =====================================================
// DELETE ACCOUNT
// =====================================================

const deleteAccountModal =
    document.getElementById("deleteAccountModal");

const openDeleteAccountButton =
    document.getElementById("openDeleteAccountButton");

const cancelDeleteAccountButton =
    document.getElementById("cancelDeleteAccountButton");

const confirmDeleteAccountButton =
    document.getElementById("confirmDeleteAccountButton");

const deleteAccountPassword =
    document.getElementById("deleteAccountPassword");

const deleteAccountMessage =
    document.getElementById("deleteAccountMessage");


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.replace(
                "login.html"
            );

            return;

        }


        currentUser = user;


        showLoading();


        try {

            updateAccountUI();

            await loadPreferences();

            applySavedTheme();

            if (settingsPage) {

                settingsPage.style.display =
                    "flex";

            }

        }

        catch (error) {

            console.error(
                "Settings initialization error:",
                error
            );


            showMessage(
                "Unable to load all account settings.",
                "error"
            );


            if (settingsPage) {

                settingsPage.style.display =
                    "flex";

            }

        }

        finally {

            hideLoading();

        }

    }
);


// =====================================================
// UPDATE ACCOUNT UI
// =====================================================

function updateAccountUI() {

    if (!currentUser) return;


    const email =
        currentUser.email ||
        "No email";


    const name =
        currentUser.displayName?.trim() ||
        getNameFromEmail(email) ||
        "Expense Tracker User";


    const initial =
        name
            .charAt(0)
            .toUpperCase();


    // SIDEBAR

    if (userEmail) {

        userEmail.textContent =
            email;

    }


    if (userAvatar) {

        userAvatar.textContent =
            initial;

    }


    // PROFILE OVERVIEW

    if (settingsProfileAvatar) {

        settingsProfileAvatar.textContent =
            initial;

    }


    if (settingsDisplayName) {

        settingsDisplayName.textContent =
            name;

    }


    if (settingsProfileEmail) {

        settingsProfileEmail.textContent =
            email;

    }


    // PROFILE FORM

    if (displayName) {

        displayName.value =
            currentUser.displayName || "";

    }


    if (accountEmail) {

        accountEmail.value =
            email;

    }


    // ACCOUNT INFORMATION

    if (accountInfoEmail) {

        accountInfoEmail.textContent =
            email;

    }


    if (emailVerificationStatus) {

        emailVerificationStatus.textContent =
            currentUser.emailVerified
                ? "Verified"
                : "Not Verified";

    }


    if (accountCreatedDate) {

        accountCreatedDate.textContent =
            formatFirebaseDate(
                currentUser.metadata
                    ?.creationTime
            );

    }


    if (lastSignInDate) {

        lastSignInDate.textContent =
            formatFirebaseDate(
                currentUser.metadata
                    ?.lastSignInTime
            );

    }

}


// =====================================================
// GET NAME FROM EMAIL
// =====================================================

function getNameFromEmail(email) {

    if (!email) return "";


    const emailName =
        email.split("@")[0] || "";


    if (!emailName) return "";


    return emailName
        .replace(/[._-]+/g, " ")
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}


// =====================================================
// FIRESTORE SETTINGS REFERENCE
// =====================================================

function getSettingsReference() {

    if (!currentUser) {

        return null;

    }


    return doc(
        db,
        "users",
        currentUser.uid,
        "account",
        "settings"
    );

}


// =====================================================
// LOAD PREFERENCES
// =====================================================

async function loadPreferences() {

    if (!currentUser) return;


    const settingsReference =
        getSettingsReference();


    const snapshot =
        await getDoc(
            settingsReference
        );


    let preferences = {
        currency: "INR",
        dateFormat: "DD/MM/YYYY",
        theme: "dark"
    };


    if (snapshot.exists()) {

        const data =
            snapshot.data();


        preferences = {
            currency:
                data.currency ||
                preferences.currency,

            dateFormat:
                data.dateFormat ||
                preferences.dateFormat,

            theme:
                data.theme ||
                preferences.theme
        };

    }


    if (currencyPreference) {

        currencyPreference.value =
            preferences.currency;

    }


    if (dateFormatPreference) {

        dateFormatPreference.value =
            preferences.dateFormat;

    }


    if (themePreference) {

        themePreference.value =
            preferences.theme;

    }


    localStorage.setItem(
        "expenseTrackerCurrency",
        preferences.currency
    );


    localStorage.setItem(
        "expenseTrackerDateFormat",
        preferences.dateFormat
    );


    localStorage.setItem(
        "expenseTrackerTheme",
        preferences.theme
    );

}


// =====================================================
// PROFILE UPDATE
// =====================================================

profileForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!currentUser) return;


        const name =
            String(
                displayName?.value || ""
            ).trim();


        if (!name) {

            showMessage(
                "Please enter your display name.",
                "error"
            );

            displayName?.focus();

            return;

        }


        if (name.length > 50) {

            showMessage(
                "Display name cannot exceed 50 characters.",
                "error"
            );

            return;

        }


        setButtonBusy(
            saveProfileButton,
            true,
            "Saving..."
        );


        try {

            await updateProfile(
                currentUser,
                {
                    displayName: name
                }
            );


            await setDoc(
                getSettingsReference(),
                {
                    displayName: name,
                    email:
                        currentUser.email || ""
                },
                {
                    merge: true
                }
            );


            await currentUser.reload();


            currentUser =
                auth.currentUser;


            updateAccountUI();


            showMessage(
                "Profile updated successfully.",
                "success"
            );

        }

        catch (error) {

            console.error(
                "Profile update error:",
                error
            );


            showMessage(
                getFirebaseErrorMessage(
                    error
                ),
                "error"
            );

        }

        finally {

            setButtonBusy(
                saveProfileButton,
                false,
                "Save Profile"
            );

        }

    }
);


// =====================================================
// PASSWORD TOGGLES
// =====================================================

document
    .querySelectorAll(
        "[data-password-target]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const targetId =
                        button.dataset
                            .passwordTarget;


                    const input =
                        document.getElementById(
                            targetId
                        );


                    if (!input) return;


                    const showPassword =
                        input.type ===
                        "password";


                    input.type =
                        showPassword
                            ? "text"
                            : "password";


                    button.textContent =
                        showPassword
                            ? "Hide"
                            : "Show";


                    button.setAttribute(
                        "aria-label",
                        showPassword
                            ? "Hide password"
                            : "Show password"
                    );

                }
            );

        }
    );


// =====================================================
// CHANGE PASSWORD
// =====================================================

passwordForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!currentUser) return;


        const oldPassword =
            currentPassword?.value || "";


        const password =
            newPassword?.value || "";


        const confirmation =
            confirmPassword?.value || "";


        if (!oldPassword) {

            showMessage(
                "Enter your current password.",
                "error"
            );

            currentPassword?.focus();

            return;

        }


        if (password.length < 6) {

            showMessage(
                "New password must contain at least 6 characters.",
                "error"
            );

            newPassword?.focus();

            return;

        }


        if (
            password !==
            confirmation
        ) {

            showMessage(
                "New passwords do not match.",
                "error"
            );

            confirmPassword?.focus();

            return;

        }


        if (
            oldPassword ===
            password
        ) {

            showMessage(
                "Your new password must be different from your current password.",
                "error"
            );

            return;

        }


        if (!currentUser.email) {

            showMessage(
                "This account does not have an email address.",
                "error"
            );

            return;

        }


        setButtonBusy(
            changePasswordButton,
            true,
            "Changing..."
        );


        try {

            await reauthenticateUser(
                oldPassword
            );


            await updatePassword(
                currentUser,
                password
            );


            passwordForm.reset();


            showMessage(
                "Password changed successfully.",
                "success"
            );

        }

        catch (error) {

            console.error(
                "Password change error:",
                error
            );


            showMessage(
                getFirebaseErrorMessage(
                    error
                ),
                "error"
            );

        }

        finally {

            setButtonBusy(
                changePasswordButton,
                false,
                "Change Password"
            );

        }

    }
);


// =====================================================
// REAUTHENTICATE USER
// =====================================================

async function reauthenticateUser(
    password
) {

    if (
        !currentUser ||
        !currentUser.email
    ) {

        throw new Error(
            "Unable to authenticate account."
        );

    }


    const credential =
        EmailAuthProvider.credential(
            currentUser.email,
            password
        );


    await reauthenticateWithCredential(
        currentUser,
        credential
    );

}


// =====================================================
// SAVE PREFERENCES
// =====================================================

preferencesForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!currentUser) return;


        const currency =
            currencyPreference?.value ||
            "INR";


        const dateFormat =
            dateFormatPreference?.value ||
            "DD/MM/YYYY";


        const theme =
            themePreference?.value ||
            "dark";


        setButtonBusy(
            savePreferencesButton,
            true,
            "Saving..."
        );


        try {

            await setDoc(
                getSettingsReference(),
                {
                    currency,
                    dateFormat,
                    theme
                },
                {
                    merge: true
                }
            );


            localStorage.setItem(
                "expenseTrackerCurrency",
                currency
            );


            localStorage.setItem(
                "expenseTrackerDateFormat",
                dateFormat
            );


            localStorage.setItem(
                "expenseTrackerTheme",
                theme
            );


            applyTheme(theme);


            showMessage(
                "Preferences saved successfully.",
                "success"
            );

        }

        catch (error) {

            console.error(
                "Preferences save error:",
                error
            );


            showMessage(
                getFirebaseErrorMessage(
                    error
                ),
                "error"
            );

        }

        finally {

            setButtonBusy(
                savePreferencesButton,
                false,
                "Save Preferences"
            );

        }

    }
);


// =====================================================
// APPLY SAVED THEME
// =====================================================

function applySavedTheme() {

    const theme =
        localStorage.getItem(
            "expenseTrackerTheme"
        ) || "dark";


    applyTheme(theme);

}


// =====================================================
// APPLY THEME
// =====================================================

function applyTheme(theme) {

    document.body.classList.remove(
        "settings-light-theme"
    );


    if (theme === "light") {

        document.body.classList.add(
            "settings-light-theme"
        );

        return;

    }


    if (theme === "system") {

        const prefersLight =
            window.matchMedia(
                "(prefers-color-scheme: light)"
            ).matches;


        if (prefersLight) {

            document.body.classList.add(
                "settings-light-theme"
            );

        }

    }

}


// =====================================================
// SYSTEM THEME CHANGE
// =====================================================

const systemThemeQuery =
    window.matchMedia(
        "(prefers-color-scheme: light)"
    );


systemThemeQuery.addEventListener?.(
    "change",
    () => {

        const theme =
            localStorage.getItem(
                "expenseTrackerTheme"
            );


        if (theme === "system") {

            applyTheme("system");

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


    const navLinks =
        sidebar.querySelectorAll(
            ".nav-link"
        );


    navLinks.forEach(
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
    logoutUser
);


settingsLogoutButton?.addEventListener(
    "click",
    logoutUser
);


async function logoutUser() {

    try {

        showLoading();


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


        hideLoading();


        showMessage(
            "Unable to logout. Please try again.",
            "error"
        );

    }

}


// =====================================================
// OPEN DELETE ACCOUNT MODAL
// =====================================================

openDeleteAccountButton?.addEventListener(
    "click",
    () => {

        clearDeleteAccountMessage();


        if (deleteAccountPassword) {

            deleteAccountPassword.value =
                "";

        }


        openDeleteModal();


        window.setTimeout(
            () => {

                deleteAccountPassword?.focus();

            },
            50
        );

    }
);


// =====================================================
// CANCEL DELETE
// =====================================================

cancelDeleteAccountButton?.addEventListener(
    "click",
    closeDeleteModal
);


document
    .querySelectorAll(
        "[data-close-delete-account]"
    )
    .forEach(
        element => {

            element.addEventListener(
                "click",
                closeDeleteModal
            );

        }
    );


// =====================================================
// ESCAPE CLOSE
// =====================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            deleteAccountModal
                ?.classList
                .contains("open")
        ) {

            closeDeleteModal();

        }

    }
);


// =====================================================
// DELETE ACCOUNT
// =====================================================

confirmDeleteAccountButton?.addEventListener(
    "click",
    async () => {

        if (!currentUser) return;


        const password =
            deleteAccountPassword?.value ||
            "";


        if (!password) {

            showDeleteAccountMessage(
                "Enter your password to confirm account deletion."
            );

            deleteAccountPassword?.focus();

            return;

        }


        if (!currentUser.email) {

            showDeleteAccountMessage(
                "This account cannot be re-authenticated using an email password."
            );

            return;

        }


        confirmDeleteAccountButton.disabled =
            true;


        confirmDeleteAccountButton.textContent =
            "Deleting...";


        try {

            await reauthenticateUser(
                password
            );


            /*
             * Delete the Firestore data that is stored
             * under this user's /users/{uid} document.
             *
             * We delete known Day 9 / Day 8 data here.
             * Other project collections are handled
             * separately below.
             */

            await deleteUserSubcollection(
                "savingsGoals"
            );


            await deleteUserSubcollection(
                "account"
            );


            /*
             * Delete transactions stored in the
             * top-level transactions collection.
             *
             * We cannot safely query/delete arbitrary
             * project data here without matching the
             * project's exact data architecture.
             *
             * Therefore account deletion removes the
             * Firebase Auth account after the known
             * user-scoped data above.
             *
             * Full cross-collection cleanup will be
             * standardized during the Firebase/security
             * integration phase.
             */


            await deleteUser(
                currentUser
            );


            currentUser = null;


            window.location.replace(
                "login.html"
            );

        }

        catch (error) {

            console.error(
                "Delete account error:",
                error
            );


            showDeleteAccountMessage(
                getFirebaseErrorMessage(
                    error
                )
            );


            confirmDeleteAccountButton.disabled =
                false;


            confirmDeleteAccountButton.textContent =
                "Delete Account";

        }

    }
);


// =====================================================
// DELETE KNOWN USER SUBCOLLECTION
// =====================================================

async function deleteUserSubcollection(
    collectionName
) {

    if (!currentUser) return;


    const collectionReference =
        collection(
            db,
            "users",
            currentUser.uid,
            collectionName
        );


    const snapshot =
        await getDocs(
            collectionReference
        );


    const deletions = [];


    snapshot.forEach(
        documentSnapshot => {

            deletions.push(
                deleteDoc(
                    documentSnapshot.ref
                )
            );

        }
    );


    await Promise.all(
        deletions
    );

}


// =====================================================
// OPEN DELETE MODAL
// =====================================================

function openDeleteModal() {

    if (!deleteAccountModal) return;


    deleteAccountModal.classList.add(
        "open"
    );


    deleteAccountModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "settings-modal-open"
    );

}


// =====================================================
// CLOSE DELETE MODAL
// =====================================================

function closeDeleteModal() {

    if (!deleteAccountModal) return;


    deleteAccountModal.classList.remove(
        "open"
    );


    deleteAccountModal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "settings-modal-open"
    );


    if (deleteAccountPassword) {

        deleteAccountPassword.value =
            "";

    }


    clearDeleteAccountMessage();

}


// =====================================================
// DELETE ACCOUNT MESSAGE
// =====================================================

function showDeleteAccountMessage(
    message
) {

    if (!deleteAccountMessage) return;


    deleteAccountMessage.textContent =
        message;


    deleteAccountMessage.classList.add(
        "visible"
    );

}


function clearDeleteAccountMessage() {

    if (!deleteAccountMessage) return;


    deleteAccountMessage.textContent =
        "";


    deleteAccountMessage.classList.remove(
        "visible"
    );

}


// =====================================================
// MAIN MESSAGE
// =====================================================

function showMessage(
    message,
    type = "success"
) {

    if (!settingsMessage) return;


    settingsMessage.textContent =
        message;


    settingsMessage.className =
        `settings-message visible ${type}`;


    window.setTimeout(
        () => {

            if (
                settingsMessage.textContent ===
                message
            ) {

                clearMessage();

            }

        },
        5000
    );

}


function clearMessage() {

    if (!settingsMessage) return;


    settingsMessage.textContent =
        "";


    settingsMessage.className =
        "settings-message";

}


// =====================================================
// LOADING
// =====================================================

function showLoading() {

    settingsLoading?.classList.add(
        "visible"
    );

}


function hideLoading() {

    settingsLoading?.classList.remove(
        "visible"
    );

}


// =====================================================
// BUTTON BUSY
// =====================================================

function setButtonBusy(
    button,
    busy,
    text
) {

    if (!button) return;


    button.disabled =
        busy;


    button.textContent =
        text;

}


// =====================================================
// FIREBASE DATE FORMAT
// =====================================================

function formatFirebaseDate(
    value
) {

    if (!value) {

        return "Unavailable";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Unavailable";

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// =====================================================
// FIREBASE ERROR MESSAGES
// =====================================================

function getFirebaseErrorMessage(
    error
) {

    const code =
        error?.code || "";


    switch (code) {

        case "auth/wrong-password":
        case "auth/invalid-credential":

            return "The password you entered is incorrect.";


        case "auth/weak-password":

            return "The new password is too weak.";


        case "auth/requires-recent-login":

            return "For security, please log out and sign in again before performing this action.";


        case "auth/network-request-failed":

            return "Network error. Check your internet connection and try again.";


        case "auth/too-many-requests":

            return "Too many attempts. Please wait and try again later.";


        case "permission-denied":

            return "Firebase denied this request. Check your Firestore security rules.";


        default:

            return error?.message ||
                "Something went wrong. Please try again.";

    }

}