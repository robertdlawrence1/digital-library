import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// ✅ Your Firebase config (copied directly from your setup)
const firebaseConfig = {
  apiKey: "AIzaSyAC2xKlseyouk18Dr8A-ocoqY77OP56Jtk",
  authDomain: "digital-library-4f53e.firebaseapp.com",
  projectId: "digital-library-4f53e",
  storageBucket: "digital-library-4f53e.firebasestorage.app",
  messagingSenderId: "775289018267",
  appId: "1:775289018267:web:86ea3e5cad787a2a0e733e",
  measurementId: "G-4BVT6LVMHX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const generateMetadata = async ({ title, author }) => {
  const response = await fetch("https://generatemetadatav2-cbrgg4aahq-uc.a.run.app/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title, author })
  });

  if (!response.ok) {
    throw new Error(`Claude API failed: ${response.status}`);
  }

  return response.json();
};

// DOM elements
const titleInput = document.getElementById("book-title");
const authorInput = document.getElementById("book-author");
const generateBtn = document.getElementById("generate-metadata");
const previewSection = document.getElementById("book-preview");
const confirmBtn = document.getElementById("confirm-add-book");

let generatedBook = null;

// 🔍 Generate Metadata with Claude
generateBtn.addEventListener("click", async () => {
  const title = titleInput.value.trim();
  const author = authorInput.value.trim();

  if (!title || !author) {
    alert("Please enter both a title and author.");
    return;
  }

  try {
    const result = await generateMetadata({ title, author });
    generatedBook = result;

    document.getElementById("preview-title").textContent = generatedBook.title;
    document.getElementById("preview-author").textContent = generatedBook.author;
    document.getElementById("preview-summary").textContent = generatedBook.summary;
    document.getElementById("preview-year").textContent = generatedBook.yearPublished;
    document.getElementById("preview-pages").textContent = generatedBook.pageCount;
    document.getElementById("preview-tags").textContent = generatedBook.contentTags.join(", ");

    previewSection.style.display = "block";
  } catch (error) {
    console.error("❌ Error generating metadata:", error);
    alert("Failed to generate book metadata. Check the console for details.");
  }
});

// ✅ Confirm and add book to Firestore
confirmBtn.addEventListener("click", async () => {
  if (!generatedBook) return;

  try {
    await addDoc(collection(db, "books"), generatedBook);
    alert("✅ Book added to your library!");
    previewSection.style.display = "none";
    titleInput.value = "";
    authorInput.value = "";
  } catch (error) {
    console.error("❌ Error adding book to Firestore:", error);
    alert("Failed to add book to Firestore.");
  }
});
