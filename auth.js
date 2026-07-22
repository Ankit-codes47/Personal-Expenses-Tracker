// Import Firebase Authentication instance

import {
    auth
} from "./firebase-config.js";


// Import Firebase Authentication functions

import {

    signInWithEmailAndPassword,

    signInWithPopup,

    GoogleAuthProvider,

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";



// ================================
// GET HTML ELEMENTS
// ================================

const loginForm =
    document.getElementById(
        "loginForm"
    );


const emailInput =
    document.getElementById(
        "email"
    );


const passwordInput =
    document.getElementById(
        "password"
    );


const loginButton =
    document.getElementById(
        "loginButton"
    );


const googleLoginButton =
    document.getElementById(
        "googleLogin"
    );


const message =
    document.getElementById(
        "message"
    );



// ================================
// MESSAGE FUNCTION
// ================================

function showMessage(
    text,
    type = "info"
) {

    message.textContent =
        text;

    message.className =
        `message ${type}`;

}



// ================================
// EMAIL AND PASSWORD LOGIN
// ================================

loginForm.addEventListener(

    "submit",

    async (event) => {


        // Prevent page refresh

        event.preventDefault();



        // Get user input

        const email =
            emailInput.value.trim();


        const password =
            passwordInput.value;



        // Disable button while logging in

        loginButton.disabled =
            true;


        loginButton.textContent =
            "Logging in...";



        showMessage(

            "Checking your account...",

            "info"

        );



        try {


            // Firebase login

            const userCredential =

                await signInWithEmailAndPassword(

                    auth,

                    email,

                    password

                );



            console.log(

                "Logged in:",

                userCredential.user.email

            );



            showMessage(

                "Login successful. Opening dashboard...",

                "success"

            );



            // Open dashboard

            setTimeout(() => {

                window.location.href =
                    "dashboard.html";

            }, 700);



        } catch (error) {


            console.error(

                "Login error:",

                error

            );



            let errorMessage =

                "Unable to login. Please check your email and password.";



            if (

                error.code ===
                "auth/invalid-email"

            ) {

                errorMessage =
                    "Please enter a valid email address.";

            }



            if (

                error.code ===
                "auth/invalid-credential"

            ) {

                errorMessage =
                    "Incorrect email or password.";

            }



            if (

                error.code ===
                "auth/too-many-requests"

            ) {

                errorMessage =
                    "Too many login attempts. Please try again later.";

            }



            showMessage(

                errorMessage,

                "error"

            );



        } finally {


            loginButton.disabled =
                false;


            loginButton.textContent =
                "Login";


        }


    }

);



// ================================
// GOOGLE LOGIN
// ================================

const googleProvider =

    new GoogleAuthProvider();



googleLoginButton.addEventListener(

    "click",

    async () => {


        googleLoginButton.disabled =
            true;


        googleLoginButton.textContent =
            "Opening Google...";



        showMessage(

            "Opening Google Sign-In...",

            "info"

        );



        try {


            const result =

                await signInWithPopup(

                    auth,

                    googleProvider

                );



            console.log(

                "Google user:",

                result.user.email

            );



            showMessage(

                "Google login successful. Opening dashboard...",

                "success"

            );



            setTimeout(() => {

                window.location.href =
                    "dashboard.html";

            }, 700);



        } catch (error) {


            console.error(

                "Google login error:",

                error

            );



            if (

                error.code ===
                "auth/popup-closed-by-user"

            ) {

                showMessage(

                    "Google Sign-In was cancelled.",

                    "error"

                );

            }

           else {
                showMessage(
                    `${error.code}: ${error.message}`,
                    "error"
                );
            }


        } finally {


            googleLoginButton.disabled =
                false;


            googleLoginButton.textContent =
                "Continue with Google";


        }


    }

);



// ================================
// CHECK LOGIN STATUS
// ================================

onAuthStateChanged(

    auth,

    (user) => {


        if (user) {


            console.log(

                "Authenticated user:",

                user.email

            );


        }


    }

);