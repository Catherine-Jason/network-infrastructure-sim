// ==========================================
// PRACTICE MODE UI — SCENARIO 0
// ==========================================

import { State } from "../core/state.js";
import { EventBus } from "../core/eventBus.js";

let panel, conceptEl, expectedEl, inputEl;

export function initPracticeUI() {
    panel = document.getElementById("practicePanel");
    conceptEl = document.getElementById("practiceConcept");
    expectedEl = document.getElementById("practiceExpected");
    inputEl = document.getElementById("practiceInput");

    document.getElementById("practiceNext").onclick = nextItem;

    EventBus.on("practiceLoaded", () => {
        State.ui.practiceModeActive = true;
        panel.style.display = "block";
        loadItem();
    });
}

function loadItem() {
    const item = State.practice.items[State.practice.currentIndex];
    if (!item) return;

    conceptEl.innerText = item.concept;
    expectedEl.innerText = item.expected;
    inputEl.value = "";
    inputEl.focus();
}

function nextItem() {
    const item = State.practice.items[State.practice.currentIndex];
    const userInput = inputEl.value.trim();

    if (userInput === item.expected.trim()) {
        State.practice.currentIndex++;
        if (State.practice.currentIndex >= State.practice.items.length) {
            finishPractice();
        } else {
            loadItem();
        }
    } else {
        alert("Incorrect. Try again.");
    }
}

function finishPractice() {
    State.practice.completed = true;
    panel.innerHTML = `
        <h2>Practice Complete!</h2>
        <p>You mastered all commands.</p>
    `;
}

