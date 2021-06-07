export function isValidEmail(email: string) {
    if (email.includes('@') && email.includes('.')) {
        return true;
    }
    return false;
}
