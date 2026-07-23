import { auth } from "./firebase-config.js";


import {

    signInWithEmailAndPassword,

    signInWithPopup,

    GoogleAuthProvider

} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";



// ================================
// HTML ELEMENTS
// ================================

const loginForm =
    document.getElementById("loginForm");


const emailInput =
    document.getElementById("email");


const passwordInput =
    document.getElementById("password");


const loginButton =
    document.getElementById("loginButton");


const googleLoginButton =
    document.getElementById("googleLogin");


const message =
    document.getElementById("message");



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
// EMAIL / PASSWORD LOGIN
// ================================

loginForm.addEventListener(

    "submit",

    async (event) => {


        event.preventDefault();



        const email =
            emailInput.value.trim();


        const password =
            passwordInput.value;



        loginButton.disabled =
            true;


        loginButton.textContent =
            "Logging in...";



        showMessage(

            "Checking your account...",

            "info"

        );



        try {


            await signInWithEmailAndPassword(

                auth,

                email,

                password

            );



            showMessage(

                "Login successful.",

                "success"

            );



            // Redirect only after user clicks Login
            // and Firebase login succeeds.

            window.location.replace(
                "dashboard.html"
            );


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


            else if (
                error.code ===
                "auth/invalid-credential"
            ) {

                errorMessage =
                    "Incorrect email or password.";

            }


            else if (
                error.code ===
                "auth/too-many-requests"
            ) {

                errorMessage =
                    "Too many attempts. Please try again later.";

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


            await signInWithPopup(

                auth,

                googleProvider

            );



            showMessage(

                "Google login successful.",

                "success"

            );



            // Redirect only after successful
            // Google authentication.

            window.location.replace(
                "dashboard.html"
            );


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

                    "Google Sign-In failed. Please try again.",

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