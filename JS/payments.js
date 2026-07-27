// =====================================================
// PAYMENTS.JS
// Expense Tracker - Day 10
// UPI Payments + QR Scanner
// =====================================================


// =====================================================
// FIREBASE IMPORTS
// =====================================================

import {
    auth
} from "./firebase-config.js";


import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";


// =====================================================
// STATE
// =====================================================

let currentUser = null;

let currentPayment = null;

let cameraStream = null;

let scannerRunning = false;

let scanAnimationFrame = null;

let scannedPayment = null;

let barcodeDetector = null;


// =====================================================
// PAGE ELEMENTS
// =====================================================

const paymentsPage =
    document.getElementById("paymentsPage");

const paymentLoading =
    document.getElementById("paymentLoading");

const paymentMessage =
    document.getElementById("paymentMessage");


// =====================================================
// SIDEBAR
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
// PAYMENT FORM
// =====================================================

const paymentForm =
    document.getElementById("paymentForm");

const manualPaymentSection =
    document.getElementById("manualPaymentSection");

const recipientName =
    document.getElementById("recipientName");

const upiId =
    document.getElementById("upiId");

const paymentAmount =
    document.getElementById("paymentAmount");

const paymentNote =
    document.getElementById("paymentNote");

const noteCounter =
    document.getElementById("noteCounter");

const clearPaymentButton =
    document.getElementById("clearPaymentButton");


// =====================================================
// QUICK ACTIONS
// =====================================================

const scanQrButton =
    document.getElementById("scanQrButton");

const scanQrSmallButton =
    document.getElementById("scanQrSmallButton");

const emptyStateScanButton =
    document.getElementById("emptyStateScanButton");

const manualPaymentButton =
    document.getElementById("manualPaymentButton");


// =====================================================
// PAYMENT PREVIEW
// =====================================================

const paymentEmptyState =
    document.getElementById("paymentEmptyState");

const paymentPreview =
    document.getElementById("paymentPreview");

const qrCode =
    document.getElementById("qrCode");

const previewRecipient =
    document.getElementById("previewRecipient");

const previewUpiId =
    document.getElementById("previewUpiId");

const previewAmount =
    document.getElementById("previewAmount");

const previewNote =
    document.getElementById("previewNote");

const openUpiButton =
    document.getElementById("openUpiButton");

const copyUpiButton =
    document.getElementById("copyUpiButton");


// =====================================================
// QR SCANNER
// =====================================================

const qrScannerModal =
    document.getElementById("qrScannerModal");

const qrScannerBackdrop =
    document.getElementById("qrScannerBackdrop");

const closeQrScannerButton =
    document.getElementById("closeQrScannerButton");

const cancelQrScannerButton =
    document.getElementById("cancelQrScannerButton");

const startCameraButton =
    document.getElementById("startCameraButton");

const retryCameraButton =
    document.getElementById("retryCameraButton");

const qrScannerVideo =
    document.getElementById("qrScannerVideo");

const qrCameraStartState =
    document.getElementById("qrCameraStartState");

const qrCameraErrorState =
    document.getElementById("qrCameraErrorState");

const qrCameraErrorMessage =
    document.getElementById("qrCameraErrorMessage");

const qrScanningBadge =
    document.getElementById("qrScanningBadge");

const qrScanResult =
    document.getElementById("qrScanResult");

const qrScanResultText =
    document.getElementById("qrScanResultText");

const qrScanMessage =
    document.getElementById("qrScanMessage");

const useScannedQrButton =
    document.getElementById("useScannedQrButton");


// =====================================================
// AUTHENTICATION
// =====================================================

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            stopCamera();

            window.location.replace(
                "login.html"
            );

            return;

        }


        currentUser = user;

        updateUserInterface();

        updateNoteCounter();

        resetPreview();


        if (paymentsPage) {

            paymentsPage.style.display =
                "flex";

        }


        hideLoading();

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
        "Expense Tracker User";


    const name =
        currentUser.displayName?.trim() ||
        getNameFromEmail(email) ||
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
// NAME FROM EMAIL
// =====================================================

function getNameFromEmail(email) {

    if (!email) {

        return "";

    }


    const value =
        email.split("@")[0] || "";


    return value
        .replace(/[._-]+/g, " ")
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}


// =====================================================
// NOTE COUNTER
// =====================================================

paymentNote?.addEventListener(
    "input",
    updateNoteCounter
);


function updateNoteCounter() {

    if (
        !paymentNote ||
        !noteCounter
    ) {

        return;

    }


    noteCounter.textContent =
        `${paymentNote.value.length} / 100`;

}


// =====================================================
// NORMALIZE UPI ID
// =====================================================

upiId?.addEventListener(
    "input",
    () => {

        upiId.value =
            upiId.value
                .trim()
                .replace(/\s+/g, "")
                .toLowerCase();

    }
);


// =====================================================
// MANUAL PAYMENT BUTTON
// =====================================================

manualPaymentButton?.addEventListener(
    "click",
    () => {

        manualPaymentSection?.scrollIntoView(
            {
                behavior: "smooth",
                block: "start"
            }
        );


        window.setTimeout(
            () => {

                recipientName?.focus();

            },
            400
        );

    }
);


// =====================================================
// OPEN SCANNER BUTTONS
// =====================================================

[
    scanQrButton,
    scanQrSmallButton,
    emptyStateScanButton
]
    .filter(Boolean)
    .forEach(
        button => {

            button.addEventListener(
                "click",
                openQrScanner
            );

        }
    );


// =====================================================
// OPEN QR SCANNER
// =====================================================

function openQrScanner() {

    resetScannerState();


    qrScannerModal?.classList.add(
        "open"
    );


    qrScannerModal?.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "qr-scanner-open"
    );

}


// =====================================================
// CLOSE SCANNER EVENTS
// =====================================================

closeQrScannerButton?.addEventListener(
    "click",
    closeQrScanner
);


cancelQrScannerButton?.addEventListener(
    "click",
    closeQrScanner
);


qrScannerBackdrop?.addEventListener(
    "click",
    closeQrScanner
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            qrScannerModal?.classList.contains(
                "open"
            )
        ) {

            closeQrScanner();

        }

    }
);


// =====================================================
// CLOSE QR SCANNER
// =====================================================

function closeQrScanner() {

    stopCamera();


    qrScannerModal?.classList.remove(
        "open"
    );


    qrScannerModal?.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "qr-scanner-open"
    );

}


// =====================================================
// RESET SCANNER
// =====================================================

function resetScannerState() {

    stopCamera();


    scannedPayment =
        null;


    barcodeDetector =
        null;


    if (qrCameraStartState) {

        qrCameraStartState.hidden =
            false;

    }


    if (qrCameraErrorState) {

        qrCameraErrorState.hidden =
            true;

    }


    if (qrScanningBadge) {

        qrScanningBadge.hidden =
            true;

    }


    if (qrScanResult) {

        qrScanResult.hidden =
            true;

    }


    if (useScannedQrButton) {

        useScannedQrButton.disabled =
            true;

    }


    if (qrScanMessage) {

        qrScanMessage.textContent =
            "";

        qrScanMessage.classList.remove(
            "visible"
        );

    }

}


// =====================================================
// START CAMERA BUTTONS
// =====================================================

startCameraButton?.addEventListener(
    "click",
    startCamera
);


retryCameraButton?.addEventListener(
    "click",
    startCamera
);


// =====================================================
// START CAMERA
// =====================================================

async function startCamera() {

    clearScannerMessage();


    scannedPayment =
        null;


    if (useScannedQrButton) {

        useScannedQrButton.disabled =
            true;

    }


    if (qrScanResult) {

        qrScanResult.hidden =
            true;

    }


    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        showCameraError(
            "Camera access is not supported in this browser."
        );

        return;

    }


    if (!window.isSecureContext) {

        showCameraError(
            "Camera access requires HTTPS or localhost."
        );

        return;

    }


    if (!("BarcodeDetector" in window)) {

        showCameraError(
            "QR scanning is not supported by this browser. Try a supported mobile browser. We will add dedicated scanner support for the Android version."
        );

        return;

    }


    try {

        stopCamera();


        const supportedFormats =
            await BarcodeDetector.getSupportedFormats();


        if (
            !supportedFormats.includes(
                "qr_code"
            )
        ) {

            showCameraError(
                "This browser cannot detect QR codes."
            );

            return;

        }


        barcodeDetector =
            new BarcodeDetector(
                {
                    formats: [
                        "qr_code"
                    ]
                }
            );


        cameraStream =
            await navigator.mediaDevices.getUserMedia(
                {
                    audio: false,

                    video: {
                        facingMode: {
                            ideal: "environment"
                        }
                    }
                }
            );


        if (!qrScannerVideo) {

            stopCamera();

            return;

        }


        qrScannerVideo.srcObject =
            cameraStream;


        await qrScannerVideo.play();


        if (qrCameraStartState) {

            qrCameraStartState.hidden =
                true;

        }


        if (qrCameraErrorState) {

            qrCameraErrorState.hidden =
                true;

        }


        if (qrScanningBadge) {

            qrScanningBadge.hidden =
                false;

        }


        scannerRunning =
            true;


        scanQrFrame();

    }

    catch (error) {

        console.error(
            "Camera error:",
            error
        );


        stopCamera();


        handleCameraError(
            error
        );

    }

}


// =====================================================
// CAMERA ERROR
// =====================================================

function handleCameraError(error) {

    let message =
        "Unable to start the camera.";


    if (
        error?.name ===
        "NotAllowedError"
    ) {

        message =
            "Camera permission was denied. Allow camera access in your browser settings and try again.";

    }


    else if (
        error?.name ===
        "NotFoundError"
    ) {

        message =
            "No camera was found on this device.";

    }


    else if (
        error?.name ===
        "NotReadableError"
    ) {

        message =
            "The camera is currently unavailable or being used by another application.";

    }


    else if (
        error?.name ===
        "OverconstrainedError"
    ) {

        message =
            "The requested camera configuration is unavailable.";

    }


    showCameraError(
        message
    );

}


// =====================================================
// SHOW CAMERA ERROR
// =====================================================

function showCameraError(message) {

    if (qrCameraStartState) {

        qrCameraStartState.hidden =
            true;

    }


    if (qrCameraErrorState) {

        qrCameraErrorState.hidden =
            false;

    }


    if (qrCameraErrorMessage) {

        qrCameraErrorMessage.textContent =
            message;

    }


    if (qrScanningBadge) {

        qrScanningBadge.hidden =
            true;

    }

}


// =====================================================
// QR SCANNING LOOP
// =====================================================

async function scanQrFrame() {

    if (
        !scannerRunning ||
        !barcodeDetector ||
        !qrScannerVideo
    ) {

        return;

    }


    try {

        if (
            qrScannerVideo.readyState >=
            HTMLMediaElement.HAVE_CURRENT_DATA
        ) {

            const codes =
                await barcodeDetector.detect(
                    qrScannerVideo
                );


            if (
                codes &&
                codes.length > 0
            ) {

                const rawValue =
                    String(
                        codes[0].rawValue || ""
                    ).trim();


                if (rawValue) {

                    handleScannedQr(
                        rawValue
                    );


                    return;

                }

            }

        }

    }

    catch (error) {

        console.error(
            "QR detection error:",
            error
        );

    }


    if (scannerRunning) {

        scanAnimationFrame =
            requestAnimationFrame(
                scanQrFrame
            );

    }

}


// =====================================================
// HANDLE SCANNED QR
// =====================================================

function handleScannedQr(rawValue) {

    const parsed =
        parseUpiQr(
            rawValue
        );


    if (!parsed.valid) {

        showScannerMessage(
            "QR detected, but it is not a supported UPI payment QR."
        );


        return;

    }


    scannedPayment =
        parsed.payment;


    scannerRunning =
        false;


    if (scanAnimationFrame) {

        cancelAnimationFrame(
            scanAnimationFrame
        );

        scanAnimationFrame =
            null;

    }


    if (qrScanningBadge) {

        qrScanningBadge.hidden =
            true;

    }


    if (qrScanResult) {

        qrScanResult.hidden =
            false;

    }


    if (qrScanResultText) {

        const name =
            scannedPayment.recipient ||
            scannedPayment.upiId;


        qrScanResultText.textContent =
            `${name} • ${scannedPayment.upiId}`;

    }


    if (useScannedQrButton) {

        useScannedQrButton.disabled =
            false;

    }


    stopCamera();

}


// =====================================================
// PARSE UPI QR
// =====================================================

function parseUpiQr(rawValue) {

    if (
        typeof rawValue !== "string"
    ) {

        return {
            valid: false
        };

    }


    const value =
        rawValue.trim();


    if (
        !value
            .toLowerCase()
            .startsWith("upi://pay")
    ) {

        return {
            valid: false
        };

    }


    try {

        const queryIndex =
            value.indexOf("?");


        if (queryIndex === -1) {

            return {
                valid: false
            };

        }


        const params =
            new URLSearchParams(
                value.slice(
                    queryIndex + 1
                )
            );


        const paymentUpiId =
            String(
                params.get("pa") || ""
            )
                .trim()
                .toLowerCase();


        if (
            !paymentUpiId ||
            !isValidUpiId(
                paymentUpiId
            )
        ) {

            return {
                valid: false
            };

        }


        const recipient =
            String(
                params.get("pn") || ""
            ).trim();


        const amountValue =
            String(
                params.get("am") || ""
            ).trim();


        const note =
            String(
                params.get("tn") || ""
            ).trim();


        let amount =
            "";


        if (amountValue) {

            const numericAmount =
                Number(
                    amountValue
                );


            if (
                Number.isFinite(
                    numericAmount
                ) &&
                numericAmount > 0
            ) {

                amount =
                    numericAmount.toFixed(
                        2
                    );

            }

        }


        return {

            valid: true,

            payment: {

                recipient:
                    recipient.slice(
                        0,
                        60
                    ),

                upiId:
                    paymentUpiId,

                amount,

                note:
                    note.slice(
                        0,
                        100
                    )

            }

        };

    }

    catch (error) {

        console.error(
            "UPI QR parsing error:",
            error
        );


        return {
            valid: false
        };

    }

}


// =====================================================
// USE SCANNED DETAILS
// =====================================================

useScannedQrButton?.addEventListener(
    "click",
    () => {

        if (!scannedPayment) {

            showScannerMessage(
                "Scan a valid UPI QR code first."
            );

            return;

        }


        if (recipientName) {

            recipientName.value =
                scannedPayment.recipient ||
                "";

        }


        if (upiId) {

            upiId.value =
                scannedPayment.upiId ||
                "";

        }


        if (paymentAmount) {

            paymentAmount.value =
                scannedPayment.amount ||
                "";

        }


        if (paymentNote) {

            paymentNote.value =
                scannedPayment.note ||
                "";

        }


        updateNoteCounter();


        closeQrScanner();


        manualPaymentSection?.scrollIntoView(
            {
                behavior: "smooth",
                block: "start"
            }
        );


        showMessage(
            "UPI QR scanned. Review the payment details before continuing.",
            "success"
        );


        window.setTimeout(
            () => {

                if (
                    !recipientName?.value
                ) {

                    recipientName?.focus();

                }

                else if (
                    !paymentAmount?.value
                ) {

                    paymentAmount?.focus();

                }

            },
            400
        );

    }
);


// =====================================================
// STOP CAMERA
// =====================================================

function stopCamera() {

    scannerRunning =
        false;


    if (scanAnimationFrame) {

        cancelAnimationFrame(
            scanAnimationFrame
        );

        scanAnimationFrame =
            null;

    }


    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );


        cameraStream =
            null;

    }


    if (qrScannerVideo) {

        qrScannerVideo.pause();


        qrScannerVideo.srcObject =
            null;

    }


    if (qrScanningBadge) {

        qrScanningBadge.hidden =
            true;

    }

}


// =====================================================
// SCANNER MESSAGE
// =====================================================

function showScannerMessage(message) {

    if (!qrScanMessage) {

        return;

    }


    qrScanMessage.textContent =
        message;


    qrScanMessage.classList.add(
        "visible"
    );

}


function clearScannerMessage() {

    if (!qrScanMessage) {

        return;

    }


    qrScanMessage.textContent =
        "";


    qrScanMessage.classList.remove(
        "visible"
    );

}


// =====================================================
// PAYMENT FORM
// =====================================================

paymentForm?.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        clearMessage();


        const payment =
            readPaymentForm();


        const validation =
            validatePayment(
                payment
            );


        if (!validation.valid) {

            showMessage(
                validation.message,
                "error"
            );


            validation.element?.focus();


            return;

        }


        currentPayment = {

            recipient:
                payment.recipient,

            upiId:
                payment.upiId,

            amount:
                Number(
                    payment.amount
                ),

            note:
                payment.note,

            uri:
                createUpiUri(
                    payment
                )

        };


        renderPaymentPreview(
            currentPayment
        );


        showMessage(
            "UPI payment request generated successfully.",
            "success"
        );

    }
);


// =====================================================
// READ PAYMENT FORM
// =====================================================

function readPaymentForm() {

    return {

        recipient:
            String(
                recipientName?.value || ""
            ).trim(),

        upiId:
            String(
                upiId?.value || ""
            )
                .trim()
                .toLowerCase(),

        amount:
            String(
                paymentAmount?.value || ""
            ).trim(),

        note:
            String(
                paymentNote?.value || ""
            ).trim()

    };

}


// =====================================================
// VALIDATE PAYMENT
// =====================================================

function validatePayment(payment) {

    if (!payment.recipient) {

        return {
            valid: false,
            message:
                "Enter the recipient name.",
            element:
                recipientName
        };

    }


    if (
        payment.recipient.length >
        60
    ) {

        return {
            valid: false,
            message:
                "Recipient name cannot exceed 60 characters.",
            element:
                recipientName
        };

    }


    if (!payment.upiId) {

        return {
            valid: false,
            message:
                "Enter the recipient UPI ID.",
            element:
                upiId
        };

    }


    if (
        !isValidUpiId(
            payment.upiId
        )
    ) {

        return {
            valid: false,
            message:
                "Enter a valid UPI ID such as name@bank.",
            element:
                upiId
        };

    }


    if (!payment.amount) {

        return {
            valid: false,
            message:
                "Enter the payment amount.",
            element:
                paymentAmount
        };

    }


    const amount =
        Number(
            payment.amount
        );


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        return {
            valid: false,
            message:
                "Payment amount must be greater than ₹0.",
            element:
                paymentAmount
        };

    }


    if (
        !hasMaximumTwoDecimals(
            payment.amount
        )
    ) {

        return {
            valid: false,
            message:
                "Payment amount can contain a maximum of two decimal places.",
            element:
                paymentAmount
        };

    }


    if (
        payment.note.length >
        100
    ) {

        return {
            valid: false,
            message:
                "Payment note cannot exceed 100 characters.",
            element:
                paymentNote
        };

    }


    return {
        valid: true
    };

}


// =====================================================
// UPI ID VALIDATION
// =====================================================

function isValidUpiId(value) {

    const pattern =
        /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;


    return pattern.test(
        value
    );

}


// =====================================================
// DECIMAL VALIDATION
// =====================================================

function hasMaximumTwoDecimals(value) {

    return /^\d+(\.\d{1,2})?$/.test(
        value
    );

}


// =====================================================
// CREATE UPI URI
// =====================================================

function createUpiUri(payment) {

    const params =
        new URLSearchParams();


    params.set(
        "pa",
        payment.upiId
    );


    params.set(
        "pn",
        payment.recipient
    );


    params.set(
        "am",
        Number(
            payment.amount
        ).toFixed(2)
    );


    params.set(
        "cu",
        "INR"
    );


    if (payment.note) {

        params.set(
            "tn",
            payment.note
        );

    }


    return (
        "upi://pay?" +
        params.toString()
    );

}


// =====================================================
// RENDER PAYMENT PREVIEW
// =====================================================

function renderPaymentPreview(payment) {

    if (previewRecipient) {

        previewRecipient.textContent =
            payment.recipient;

    }


    if (previewUpiId) {

        previewUpiId.textContent =
            payment.upiId;

    }


    if (previewAmount) {

        previewAmount.textContent =
            formatCurrency(
                payment.amount
            );

    }


    if (previewNote) {

        previewNote.textContent =
            payment.note ||
            "No note";

    }


    if (paymentEmptyState) {

        paymentEmptyState.hidden =
            true;

    }


    if (paymentPreview) {

        paymentPreview.hidden =
            false;

    }


    generateQrCode(
        payment.uri
    );

}


// =====================================================
// GENERATE PAYMENT QR
// =====================================================

function generateQrCode(text) {

    if (!qrCode) {

        return;

    }


    qrCode.innerHTML =
        "";


    qrCode.classList.remove(
        "qr-error"
    );


    const image =
        document.createElement(
            "img"
        );


    image.width =
        196;


    image.height =
        196;


    image.alt =
        "UPI payment QR code";


    image.referrerPolicy =
        "no-referrer";


    image.src =
        "https://api.qrserver.com/v1/create-qr-code/" +
        "?size=300x300" +
        "&data=" +
        encodeURIComponent(text);


    image.addEventListener(
        "error",
        () => {

            qrCode.innerHTML =
                "";


            qrCode.classList.add(
                "qr-error"
            );


            const message =
                document.createElement(
                    "span"
                );


            message.textContent =
                "QR unavailable";


            qrCode.appendChild(
                message
            );


            showMessage(
                "QR generation is unavailable. You can still open the payment in your UPI app.",
                "info"
            );

        }
    );


    qrCode.appendChild(
        image
    );

}


// =====================================================
// OPEN UPI APP
// =====================================================

openUpiButton?.addEventListener(
    "click",
    () => {

        if (!currentPayment?.uri) {

            showMessage(
                "Generate a payment request first.",
                "error"
            );

            return;

        }


        /*
         * This launches a compatible UPI app.
         *
         * It does NOT prove that the payment
         * succeeded.
         */

        window.location.href =
            currentPayment.uri;


        showMessage(
            "UPI request opened. Complete and verify the payment in your UPI app.",
            "info"
        );

    }
);


// =====================================================
// COPY UPI ID
// =====================================================

copyUpiButton?.addEventListener(
    "click",
    async () => {

        if (!currentPayment?.upiId) {

            showMessage(
                "Generate a payment request first.",
                "error"
            );

            return;

        }


        try {

            await copyText(
                currentPayment.upiId
            );


            showMessage(
                "UPI ID copied.",
                "success"
            );

        }

        catch (error) {

            console.error(
                "Clipboard error:",
                error
            );


            showMessage(
                "Unable to copy the UPI ID.",
                "error"
            );

        }

    }
);


// =====================================================
// COPY TEXT
// =====================================================

async function copyText(text) {

    if (
        navigator.clipboard &&
        window.isSecureContext
    ) {

        await navigator.clipboard.writeText(
            text
        );


        return;

    }


    const temporaryInput =
        document.createElement(
            "textarea"
        );


    temporaryInput.value =
        text;


    temporaryInput.setAttribute(
        "readonly",
        ""
    );


    temporaryInput.style.position =
        "fixed";


    temporaryInput.style.opacity =
        "0";


    document.body.appendChild(
        temporaryInput
    );


    temporaryInput.select();


    const copied =
        document.execCommand(
            "copy"
        );


    temporaryInput.remove();


    if (!copied) {

        throw new Error(
            "Copy failed."
        );

    }

}


// =====================================================
// CLEAR PAYMENT
// =====================================================

clearPaymentButton?.addEventListener(
    "click",
    () => {

        paymentForm?.reset();


        updateNoteCounter();


        resetPreview();


        clearMessage();


        recipientName?.focus();

    }
);


// =====================================================
// RESET PREVIEW
// =====================================================

function resetPreview() {

    currentPayment =
        null;


    if (paymentEmptyState) {

        paymentEmptyState.hidden =
            false;

    }


    if (paymentPreview) {

        paymentPreview.hidden =
            true;

    }


    if (qrCode) {

        qrCode.innerHTML =
            "";

        qrCode.classList.remove(
            "qr-error"
        );

    }


    if (previewRecipient) {

        previewRecipient.textContent =
            "-";

    }


    if (previewUpiId) {

        previewUpiId.textContent =
            "-";

    }


    if (previewAmount) {

        previewAmount.textContent =
            "₹0.00";

    }


    if (previewNote) {

        previewNote.textContent =
            "-";

    }

}


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

}


// =====================================================
// LOGOUT
// =====================================================

logoutButton?.addEventListener(
    "click",
    async () => {

        try {

            stopCamera();

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
);


// =====================================================
// STOP CAMERA IF PAGE CLOSES
// =====================================================

window.addEventListener(
    "pagehide",
    stopCamera
);


// =====================================================
// FORMAT CURRENCY
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
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(value);

}


// =====================================================
// PAGE MESSAGE
// =====================================================

function showMessage(
    message,
    type = "info"
) {

    if (!paymentMessage) {

        return;

    }


    paymentMessage.textContent =
        message;


    paymentMessage.className =
        `payment-message visible ${type}`;


    window.setTimeout(
        () => {

            if (
                paymentMessage.textContent ===
                message
            ) {

                clearMessage();

            }

        },
        5000
    );

}


function clearMessage() {

    if (!paymentMessage) {

        return;

    }


    paymentMessage.textContent =
        "";


    paymentMessage.className =
        "payment-message";

}


// =====================================================
// LOADING
// =====================================================

function showLoading() {

    paymentLoading?.classList.add(
        "visible"
    );

}


function hideLoading() {

    paymentLoading?.classList.remove(
        "visible"
    );

}