// Award BIOS style boot sequence with structured layout
const output = document.getElementById("output");
const bootScreen = document.getElementById("boot-screen");
const mainContent = document.getElementById("main-content");
const statusText = document.getElementById("status-text");
const statusSpinner = document.getElementById("status-spinner");
const biosContent = document.querySelector(".bios-content");

// Spinner characters for bottom status bar
const spinnerFrames = ['|', '/', '-', '\\'];
let spinnerIndex = 0;
let spinnerInterval = null;

// Award BIOS boot messages (fast scrolling)
const bootSequence = [
  // Phase 1: Initial POST
  {
    lines: [
      "",
      "PENTIUM-S CPU at 166 MHz",
      "Memory Test : 65536K OK",
      "",
      "Award Plug and Play BIOS Extension v1.0A",
      "Copyright (C) 1996, Award Software, Inc.",
      "",
    ],
    speed: 3,
    clearAfter: false,
    color: "white"
  },
  // Phase 2: Hardware Detection
  {
    lines: [
      "Detecting Primary Master    ... Quantum Fireball 3.2GB",
      "Detecting Primary Slave     ... None",
      "Detecting Secondary Master  ... ATAPI CDROM 32X",
      "Detecting Secondary Slave   ... None",
      "",
      "Initialize Plug and Play Cards...",
      "PnP Init Completed",
      "",
    ],
    speed: 2,
    clearAfter: false,
    color: "white"
  },
  // Phase 3: Device Detection
  {
    lines: [
      "Detecting Floppy Drive A ... 1.44M 3.5 in.",
      "Detecting Serial Ports ... COM1 COM2",
      "Detecting Parallel Ports ... LPT1",
      "",
      "Memory Test : 131072K OK",
      "",
      "C000 : 32768 Bytes OK",
      "C800 : 16384 Bytes OK",
      "D000 : System BIOS Shadow",
      "D800 : VGA BIOS Shadow",
      "",
    ],
    speed: 2,
    clearAfter: false,
    color: "white"
  },
  // Phase 4: DMI Pool
  {
    lines: [
      "Verifying DMI Pool Data ...................",
      "DMI Data Updated Successfully",
      "",
    ],
    speed: 8,
    clearAfter: false,
    color: "white"
  }
];

let currentColor = "white";

// Start the spinner animation in bottom status bar
function startSpinner() {
  spinnerInterval = setInterval(() => {
    statusSpinner.textContent = spinnerFrames[spinnerIndex];
    spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
  }, 150); // Rotate every 150ms
}

// Stop spinner and update status text
function stopSpinner(finalText) {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
  }
  statusText.textContent = finalText;
  statusSpinner.textContent = "";
}

// Create a line element with proper color
function createLine(text, color) {
  const line = document.createElement("div");
  line.textContent = text;
  line.className = color === "yellow" ? "text-yellow" : color === "cyan" ? "text-cyan" : "text-white";
  return line;
}

// Type a line character by character
async function typeLine(text, speed) {
  if (speed === 0 || speed === undefined) {
    output.appendChild(createLine(text, currentColor));
    biosContent.scrollTop = biosContent.scrollHeight;
  } else {
    const lineDiv = document.createElement("div");
    lineDiv.className = currentColor === "yellow" ? "text-yellow" : currentColor === "cyan" ? "text-cyan" : "text-white";
    output.appendChild(lineDiv);
    
    for (let char of text) {
      lineDiv.textContent += char;
      await sleep(speed);
      biosContent.scrollTop = biosContent.scrollHeight;
    }
  }
}

// Clear screen
function clearScreen() {
  output.innerHTML = "";
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run a phase
async function runPhase(phase) {
  currentColor = phase.color || "white";
  
  for (let line of phase.lines) {
    await typeLine(line, phase.speed);
  }
  
  if (phase.clearAfter) {
    await sleep(phase.clearDelay);
    clearScreen();
  }
}

// Main boot sequence
async function boot() {
  // Start spinner
  startSpinner();
  
  // Run all boot phases
  for (let phase of bootSequence) {
    await runPhase(phase);
  }
  
  // Stop spinner and show final message
  await sleep(500);
  stopSpinner("Booting up Portfolio...");
  
  // Wait a moment before transition
  await sleep(1200);
  
  // Transition to Windows 95 desktop
  bootScreen.classList.add("fade-out");
  await sleep(600);
  bootScreen.style.display = "none";
  window.location.href = "desktop.html";
}

// Start boot on page load
window.addEventListener("load", () => {
  setTimeout(boot, 250);
});