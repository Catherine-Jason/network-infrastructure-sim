// ==========================================
// POPUP UI — ALERTS, MESSAGES
// ==========================================

let popup;

export function initPopupUI() {
    popup = document.getElementById("popup");
}

export function showPopup(message) {
    popup.innerHTML = message;
    popup.style.display = "block";

    setTimeout(() => {
        popup.style.display = "none";
    }, 2500);
}
