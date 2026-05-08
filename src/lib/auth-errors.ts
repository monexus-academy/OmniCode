import { FirebaseError } from "firebase/app";

export function describeAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-email":
        return "That email doesn't look right. Double-check the format.";
      case "auth/missing-password":
        return "Please enter a password to continue.";
      case "auth/weak-password":
        return "Use at least 6 characters for your password.";
      case "auth/email-already-in-use":
        return "An account with this email already exists. Try signing in.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Those credentials don't match our records.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment and try again.";
      case "auth/network-request-failed":
        return "Network hiccup. Check your connection and retry.";
      default:
        return error.message.replace("Firebase: ", "");
    }
  }
  if (error instanceof Error) return error.message;
  return "Something unexpected happened. Please try again.";
}
