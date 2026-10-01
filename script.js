/* ============================================================
   WebCraft Studio — script.js
   Vanilla JS + Firebase modular SDK (v10+) via CDN
============================================================ */

/* ---- Firebase SDK imports (must stay at top) ---- */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup,
  signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, onSnapshot,
  deleteDoc, updateDoc, doc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyANa1eURzMyIdniZ5SCixdWrVCFj3bBeso",
  authDomain: "webcraftstudio-88305.firebaseapp.com",
  projectId: "webcraftstudio-88305",
  storageBucket: "webcraftstudio-88305.firebasestorage.app",
  messagingSenderId: "572835077167",
  appId: "1:572835077167:web:dd719d547a07c483f57ada",
  measurementId: "G-TTPKGFR9Q7"
};
// Initialize Firebase

/* ============================================================
   ⚠️⚠️⚠️ STEP 2 — OWNER SETTINGS ⚠️⚠️⚠️
   OWNER_EMAIL: the email you sign up with (owner account).
   OWNER_UID  : optional extra check (Authentication → Users tab).
   OWNER_PASSCODE_SHA256: SHA-256 hex of your secret passcode.
   NEVER store the plain-text passcode here — only the hash!
   (How to generate the hash is explained in the setup notes.)
============================================================ */
const OWNER_EMAIL = "crushxyt1@gmail.com";
const OWNER_UID   = "";                                // optional
const OWNER_PASSCODE_SHA256 = "a910c0aa3d3ff41b2c644b6208638662b2afcdf0815752b1d8f12cdc3f653263"; 

/* ---- Init Firebase ---- */
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
if (firebaseConfig.apiKey.startsWith("YOUR_"))
  console.warn("⚠️ WebCraft: replace firebaseConfig in script.js with your Firebase credentials.");

/* ---- Helpers ---- */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = (str) => { const d = document.createElement("div"); d.textContent = str ?? ""; return d.innerHTML; };
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function toast(msg, type = "info") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.setAttribute("role", "status");
  el.textContent = msg;
  $("#toast-container").appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 300); }, 3800);
}

/* ================= THEME ================= */
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem("wc-theme", t); } catch (e) {}
}
$("#theme-toggle").addEventListener("click", () =>
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

/* ================= PRELOADER ================= */
window.addEventListener("load", () => {
  const p = $("#preloader");
  if (p) { p.classList.add("done"); setTimeout(() => p.remove(), 600); }
});
setTimeout(() => { const p = $("#preloader"); if (p) p.classList.add("done"); }, 3000); // safety

/* ================= SCROLL: progress, navbar, active link, back-to-top ================= */
const navbar = $("#navbar"), progress = $("#scroll-progress"), backTop = $("#back-to-top");
const sections = $$("main section[id]");
const navLinks = $$(".nav-link");

function onScroll() {
  const st = window.scrollY;
  const h = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = (h > 0 ? (st / h) * 100 : 0) + "%";
  navbar.classList.toggle("scrolled", st > 10 || mobileMenu.classList.contains("open"));
  backTop.classList.toggle("visible", st > 500);
  let current = "home";
  sections.forEach(s => { if (st >= s.offsetTop - 130) current = s.id; });
  navLinks.forEach(l => l.classList.toggle("active", l.getAttribute("href") === `#${current}`));
}
window.addEventListener("scroll", onScroll, { passive: true });
backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

/* ================= MOBILE MENU ================= */
const hamburger = $("#hamburger"), mobileMenu = $("#mobile-menu");
function closeMenu() {
  hamburger.classList.remove("open");
  mobileMenu.classList.remove("open");
  hamburger.setAttribute("aria-expanded", "false");
}
hamburger.addEventListener("click", () => {
  const open = mobileMenu.classList.toggle("open");
  hamburger.classList.toggle("open", open);
  hamburger.setAttribute("aria-expanded", String(open));
});
mobileMenu.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));
document.addEventListener("click", e => {
  if (mobileMenu.classList.contains("open") &&
      !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) closeMenu();
});

/* ================= SCROLL-REVEAL (IntersectionObserver) ================= */
$$("[data-stagger]").forEach(group =>
  $$("[data-animate]", group).forEach((el, i) => el.style.transitionDelay = `${i * 90}ms`));

function animateCounter(el) {
  const target = +el.dataset.count, suffix = el.dataset.suffix || "";
  if (reduceMotion) { el.textContent = target + suffix; return; }
  const dur = 1600, t0 = performance.now();
  (function tick(t) {
    const p = Math.min((t - t0) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add("in-view");
    if (el.classList.contains("counter")) animateCounter(el);
    if (el.classList.contains("bar-fill")) el.style.width = el.dataset.progress + "%";
    io.unobserve(el);
  });
}, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

$$("[data-animate], .bar-fill").forEach(el => io.observe(el));

/* ================= MODALS (generic) ================= */
function openModal(id) {
  const m = $("#" + id);
  m.classList.add("open");
  m.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeModal(id) {
  const m = $("#" + id);
  m.classList.remove("open");
  m.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
$$("[data-close]").forEach(b => b.addEventListener("click", () => closeModal(b.dataset.close)));
$$(".modal-overlay").forEach(m =>
  m.addEventListener("click", e => { if (e.target === m) closeModal(m.id); }));
document.addEventListener("keydown", e => {
  if (e.key === "Escape") $$(".modal-overlay.open").forEach(m => closeModal(m.id));
});

/* ================= AUTH UI ================= */
function showAuthView(view) {
  $("#view-login").classList.toggle("active", view === "login");
  $("#view-register").classList.toggle("active", view === "register");
  $("#auth-title").textContent = view === "login" ? "Welcome Back" : "Create Account";
}
$$("[data-view-switch]").forEach(b =>
  b.addEventListener("click", () => showAuthView(b.dataset.viewSwitch)));
$$("[data-auth]").forEach(b =>
  b.addEventListener("click", () => { showAuthView(b.dataset.auth); openModal("auth-modal"); closeMenu(); }));

const authErrors = {
  "auth/email-already-in-use": "That email is already registered. Try logging in.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password too weak — use at least 6 characters.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "No account found with that email.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/popup-closed-by-user": "Google sign-in was cancelled.",
  "auth/popup-blocked": "Popup blocked by the browser — allow popups and retry.",
  "auth/network-request-failed": "Network error — check your connection.",
  "auth/operation-not-allowed": "This sign-in method is disabled in the Firebase console."
};
const authMessage = (code) => authErrors[code] || "Something went wrong. Please try again.";

/* Register */
$("#register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("#reg-name").value.trim();
  const email = $("#reg-email").value.trim();
  const pass = $("#reg-pass").value;
  const errEl = $("#reg-error");
  errEl.textContent = "";
  if (name.length < 2) return errEl.textContent = "Please enter your full name.";
  if (!emailRe.test(email)) return errEl.textContent = "Please enter a valid email address.";
  if (pass.length < 6) return errEl.textContent = "Password must be at least 6 characters.";
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    closeModal("auth-modal");
    toast(`Welcome, ${name}! 🎉`, "success");
  } catch (err) { errEl.textContent = authMessage(err.code); }
});

/* Login */
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#log-email").value.trim();
  const pass = $("#log-pass").value;
  const errEl = $("#log-error");
  errEl.textContent = "";
  if (!emailRe.test(email)) return errEl.textContent = "Please enter a valid email address.";
  if (!pass) return errEl.textContent = "Please enter your password.";
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    closeModal("auth-modal");
    toast("Welcome back! 👋", "success");
  } catch (err) { errEl.textContent = authMessage(err.code); }
});

/* Google sign-in (both buttons) */
$$(".btn-google").forEach(b => b.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, googleProvider);
    closeModal("auth-modal");
    toast("Signed in with Google ✅", "success");
  } catch (err) { toast(authMessage(err.code), "error"); }
}));

/* Logout */
$$('[data-action="logout"]').forEach(b => b.addEventListener("click", async () => {
  await signOut(auth);
  closeMenu();
  toast("Logged out. See you soon!", "info");
}));

/* ================= AUTH STATE → navbar UI ================= */
let currentUser = null, isOwner = false, ownerVerified = false;
let inboxUnsub = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  isOwner = !!user && (user.email === OWNER_EMAIL || (OWNER_UID && user.uid === OWNER_UID));
  ownerVerified = false;

  $$(".auth-guest").forEach(el => el.classList.toggle("hidden", !!user));
  $$(".auth-user").forEach(el => el.classList.toggle("hidden", !user));
  $$(".owner-only").forEach(el => el.classList.toggle("hidden", !isOwner));

  if (user) {
    const name = user.displayName || (user.email ? user.email.split("@")[0] : "User");
    $$(".user-name").forEach(el => el.textContent = name);
    $$(".user-initials").forEach(el =>
      el.textContent = name.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase());
    $$(".user-avatar").forEach(el => {
      if (user.photoURL) { el.src = user.photoURL; el.classList.remove("hidden"); }
      else el.classList.add("hidden");
    });
    if (isOwner) loadInbox(); // start badge/listener for owner only
  } else {
    ["inbox-modal", "admin-modal", "passcode-modal"].forEach(closeModal);
    if (inboxUnsub) { inboxUnsub(); inboxUnsub = null; }
    $$(".inbox-badge").forEach(b => b.classList.add("hidden"));
  }
});

/* ================= OWNER PASSCODE (SHA-256 hash compare) ================= */
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

let pendingPanel = null;
function requestOwnerAccess(panel) {
  if (!currentUser) { toast("Please log in first.", "error"); return; }
  if (!isOwner) { toast("Owner access required.", "error"); return; }
  if (ownerVerified) { openPanel(panel); return; }
  pendingPanel = panel;
  $("#passcode-error").textContent = "";
  $("#passcode-input").value = "";
  openModal("passcode-modal");
  setTimeout(() => $("#passcode-input").focus(), 350);
}

$("#passcode-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const hash = await sha256Hex($("#passcode-input").value);
  if (hash === OWNER_PASSCODE_SHA256.toLowerCase().trim()) {
    ownerVerified = true;
    closeModal("passcode-modal");
    toast("Owner verified 🔓", "success");
    openPanel(pendingPanel);
  } else {
    $("#passcode-error").textContent = "Incorrect passcode. Please try again.";
  }
});

function openPanel(panel) {
  if (panel === "inbox") openModal("inbox-modal");
  if (panel === "admin") openModal("admin-modal");
}
$$('[data-panel]').forEach(b => b.addEventListener("click", () => requestOwnerAccess(b.dataset.panel)));

/* ================= CONTACT FORM → Firestore "messages" ================= */
function setErr(inputId, errId, msg) {
  $("#" + errId).textContent = msg;
  $("#" + inputId).classList.toggle("invalid", !!msg);
  return !msg;
}
$$(".field input, .field textarea").forEach(el =>
  el.addEventListener("input", () => el.classList.remove("invalid")));

$("#contact-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("#contact-name").value.trim();
  const email = $("#contact-email").value.trim();
  const message = $("#contact-message").value.trim();
  let ok = true;
  ok = setErr("contact-name", "err-contact-name", name.length >= 2 ? "" : "Please enter your name (min 2 characters).") && ok;
  ok = setErr("contact-email", "err-contact-email", emailRe.test(email) ? "" : "Please enter a valid email address.") && ok;
  ok = setErr("contact-message", "err-contact-message", message.length >= 10 ? "" : "Message should be at least 10 characters.") && ok;
  if (!ok) return;

  const btn = $("#contact-submit");
  btn.disabled = true; btn.textContent = "Sending…";
  try {
    await addDoc(collection(db, "messages"), {
      name, email, message, read: false, createdAt: serverTimestamp()
    });
    e.target.reset();
    toast("Message sent! I'll get back to you soon. ✉️", "success");
  } catch (err) {
    console.error(err);
    toast("Could not send the message. Please try again.", "error");
  } finally {
    btn.disabled = false; btn.textContent = "Send Message";
  }
});

/* ================= OWNER INBOX (live) ================= */
function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts.seconds ? ts.seconds * 1000 : ts).toLocaleString();
}

function loadInbox() {
  if (inboxUnsub) return; // already listening
  inboxUnsub = onSnapshot(collection(db, "messages"), (snap) => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    renderInbox(msgs);
    const unread = msgs.filter(m => !m.read).length;
    $$(".inbox-badge").forEach(b => {
      b.textContent = unread;
      b.classList.toggle("hidden", unread === 0);
    });
  }, (err) => {
    console.error(err);
    $("#inbox-list").innerHTML =
      `<p class="inbox-empty">Could not load messages: ${esc(err.message)}</p>`;
  });
}

function renderInbox(msgs) {
  const list = $("#inbox-list");
  if (!msgs.length) {
    list.innerHTML = `<p class="inbox-empty">No messages yet. They'll appear here instantly. 📬</p>`;
    return;
  }
  list.innerHTML = "";
  msgs.forEach(m => {
    const item = document.createElement("div");
    item.className = "message-item" + (m.read ? "" : " unread");
    item.innerHTML = `
      <div class="message-head">
        <div><strong>${esc(m.name)}</strong><div class="msg-email">${esc(m.email)}</div></div>
        <span class="msg-date">${fmtDate(m.createdAt)}</span>
      </div>
      <p>${esc(m.message)}</p>
      <div class="message-actions">
        <button data-read="${m.id}" data-state="${m.read ? 1 : 0}">${m.read ? "Mark unread" : "Mark read"}</button>
        <button class="danger" data-del="${m.id}">Delete</button>
      </div>`;
    list.appendChild(item);
  });
}

$("#inbox-list").addEventListener("click", async (e) => {
  const readBtn = e.target.closest("[data-read]");
  const delBtn = e.target.closest("[data-del]");
  try {
    if (readBtn) {
      await updateDoc(doc(db, "messages", readBtn.dataset.read),
        { read: readBtn.dataset.state !== "1" });
    }
    if (delBtn && confirm("Delete this message? This cannot be undone.")) {
      await deleteDoc(doc(db, "messages", delBtn.dataset.del));
      toast("Message deleted.", "info");
    }
  } catch (err) {
    console.error(err);
    toast("Action failed — owner permissions required.", "error");
  }
});

/* ================= PROJECTS (live for ALL visitors) ================= */
let allProjects = [];

onSnapshot(collection(db, "projects"), (snap) => {
  allProjects = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  renderProjects(allProjects);
  renderAdminList(allProjects);
}, (err) => {
  console.error(err);
  $("#projects-grid").innerHTML =
    `<p class="empty-state">Could not load projects — check your Firestore rules and connection.</p>`;
});

function renderProjects(projects) {
  const grid = $("#projects-grid");
  if (!projects.length) {
    grid.innerHTML = `<p class="empty-state">Projects coming soon — check back shortly! 🚧</p>`;
    return;
  }
  grid.innerHTML = "";
  projects.forEach((p, i) => {
    const card = document.createElement("article");
    card.className = "project-card card";
    card.setAttribute("data-animate", "fade-up");
    card.style.transitionDelay = `${(i % 3) * 90}ms`;
    card.innerHTML = `
      <div class="project-media">
        ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.title)} screenshot" loading="lazy" onerror="this.remove()">` : ""}
      </div>
      <div class="project-body">
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description)}</p>
        <div class="tags">${(p.tech || []).map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        <div class="project-links">
          ${p.live ? `<a href="${esc(p.live)}" target="_blank" rel="noopener">🔗 Live</a>` : ""}
          ${p.github ? `<a href="${esc(p.github)}" target="_blank" rel="noopener">💻 GitHub</a>` : ""}
        </div>
      </div>`;
    grid.appendChild(card);
    requestAnimationFrame(() => card.classList.add("in-view"));
  });
}

/* ================= ADMIN PANEL (add / edit / remove) ================= */
const projectForm = $("#project-form");

function resetAdminForm() {
  projectForm.reset();
  $("#pf-id").value = "";
  $("#pf-submit").textContent = "Add Project";
  $("#pf-cancel").classList.add("hidden");
}
$("#pf-cancel").addEventListener("click", resetAdminForm);

projectForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = $("#pf-error");
  errEl.textContent = "";
  const data = {
    title: $("#pf-title").value.trim(),
    description: $("#pf-desc").value.trim(),
    image: $("#pf-image").value.trim(),
    tech: $("#pf-tech").value.split(",").map(t => t.trim()).filter(Boolean),
    live: $("#pf-live").value.trim(),
    github: $("#pf-github").value.trim()
  };
  if (!data.title || !data.description)
    return errEl.textContent = "Title and description are required.";

  const id = $("#pf-id").value;
  const btn = $("#pf-submit");
  btn.disabled = true;
  try {
    if (id) {
      await updateDoc(doc(db, "projects", id), data);
      toast("Project updated ✅", "success");
    } else {
      await addDoc(collection(db, "projects"), { ...data, createdAt: serverTimestamp() });
      toast("Project added 🚀", "success");
    }
    resetAdminForm();
  } catch (err) {
    console.error(err);
    errEl.textContent = "Save failed — make sure you're signed in as the owner.";
  } finally { btn.disabled = false; }
});

function renderAdminList(projects) {
  const list = $("#admin-projects-list");
  if (!projects.length) {
    list.innerHTML = `<p class="inbox-empty">No projects yet. Add your first one above.</p>`;
    return;
  }
  list.innerHTML = "";
  projects.forEach(p => {
    const item = document.createElement("div");
    item.className = "admin-item";
    item.innerHTML = `
      <img src="${esc(p.image || "")}" alt="" onerror="this.style.visibility='hidden'">
      <div class="admin-item-info">
        <strong>${esc(p.title)}</strong>
        <small>${esc((p.tech || []).join(", "))}</small>
      </div>
      <div class="admin-item-actions">
        <button data-edit="${p.id}" aria-label="Edit ${esc(p.title)}" title="Edit">✏️</button>
        <button class="danger" data-remove="${p.id}" aria-label="Delete ${esc(p.title)}" title="Delete">🗑️</button>
      </div>`;
    list.appendChild(item);
  });
}

$("#admin-projects-list").addEventListener("click", async (e) => {
  const editBtn = e.target.closest("[data-edit]");
  const delBtn = e.target.closest("[data-remove]");
  try {
    if (editBtn) {
      const p = allProjects.find(x => x.id === editBtn.dataset.edit);
      if (!p) return;
      $("#pf-id").value = p.id;
      $("#pf-title").value = p.title || "";
      $("#pf-desc").value = p.description || "";
      $("#pf-image").value = p.image || "";
      $("#pf-tech").value = (p.tech || []).join(", ");
      $("#pf-live").value = p.live || "";
      $("#pf-github").value = p.github || "";
      $("#pf-submit").textContent = "Update Project";
      $("#pf-cancel").classList.remove("hidden");
      $(".admin-form").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
    if (delBtn && confirm("Delete this project? This cannot be undone.")) {
      await deleteDoc(doc(db, "projects", delBtn.dataset.remove));
      toast("Project removed.", "info");
    }
  } catch (err) {
    console.error(err);
    toast("Action failed — owner permissions required.", "error");
  }
});

/* ================= MISC ================= */
$("#year").textContent = new Date().getFullYear();

/* ============================================================
   🔥 FIRESTORE SECURITY RULES — paste into:
   Firebase Console → Firestore Database → Rules → Publish
   (replace YOUR_OWNER_EMAIL and YOUR_OWNER_UID first)

   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {

       function isOwner() {
         return request.auth != null
           && (request.auth.token.email == "YOUR_OWNER_EMAIL"
               || request.auth.uid == "YOUR_OWNER_UID");
       }

       // Projects: PUBLIC READ (live for all visitors), OWNER-ONLY WRITE
       match /projects/{projectId} {
         allow read: if true;
         allow create, update, delete: if isOwner();
       }

       // Messages: PUBLIC CREATE-ONLY, OWNER-ONLY READ / UPDATE / DELETE
       match /messages/{messageId} {
         allow create: if request.resource.data.name is string
                       && request.resource.data.email is string
                       && request.resource.data.message is string;
         allow read, update, delete: if isOwner();
       }
     }
   }
============================================================ */