

const SUPABASE_URL = "https://agoncqrpdtdmthwipvit.supabase.co";
const SUPABASE_KEY = "sb_publishable_b3dcGXSshHJzPj9CK69SCQ_KJhIrBPC";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
const searchInput = document.getElementById("searchInput");
const noteContainer = document.getElementById("noteContainer");
const uploadBtn = document.getElementById("uploadBtn");
const filterButtons = document.querySelectorAll(".filter-btn");
const noteFileInput = document.getElementById("noteFile");
const dropZone = document.querySelector(".drop-zone");

noteFileInput.addEventListener("change", function() {
    const file = this.files[0];
    const strong = dropZone.querySelector("strong");
    const text = dropZone.querySelector("span:not(.upload-symbol)");

    if (file) {
        strong.textContent = file.name;
        text.textContent = "PDF selected successfully ✓";
    } else {
        strong.textContent = "Choose your PDF file";
        text.textContent = "Click here to browse your files";
    }
});
dropZone.addEventListener("dragover", function(e) {
    e.preventDefault();
    dropZone.style.borderColor = "#7057e8";
    dropZone.style.background = "#f0edff";
});

dropZone.addEventListener("dragleave", function() {
    dropZone.style.borderColor = "";
    dropZone.style.background = "";
});

dropZone.addEventListener("drop", function(e) {
    e.preventDefault();

    const file = e.dataTransfer.files[0];

    if (file && file.type === "application/pdf") {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        noteFileInput.files = dataTransfer.files;
        noteFileInput.dispatchEvent(new Event("change"));
    } else {
        alert("Please drop a PDF file only!");
    }

    dropZone.style.borderColor = "";
    dropZone.style.background = "";
});

let selectedCategory = "all";

// Search and Category Filters
function applyFilters() {
    const searchValue = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll(".note-card");

    cards.forEach(function(card) {
        const text = card.innerText.toLowerCase();

        const matchesSearch = text.includes(searchValue);
        const matchesCategory =
            selectedCategory === "all" ||
            text.includes(selectedCategory.toLowerCase());

        card.style.display =
            matchesSearch && matchesCategory ? "block" : "none";
    });
}

searchInput.addEventListener("input", applyFilters);

filterButtons.forEach(function(button) {
    button.addEventListener("click", function() {
        filterButtons.forEach(function(btn) {
            btn.classList.remove("active");
        });

        button.classList.add("active");
        selectedCategory = button.dataset.category;

        applyFilters();
    });
});

// Upload Notes to Supabase
uploadBtn.addEventListener("click", async function() {
    const title = document.getElementById("noteTitle").value.trim();
    const subject = document.getElementById("noteSubject").value.trim();
    const file = document.getElementById("noteFile").files[0];

    if (!title || !subject || !file) {
        alert("Please fill all fields!");
        return;
    }

    if (file.type !== "application/pdf") {
        alert("Only PDF files are allowed!");
        return;
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = "Uploading...";

    try {
       const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
const filePath = Date.now() + "-" + safeName;

        // Upload PDF to Storage
        const { data: storageData, error: storageError } =
            await supabaseClient.storage
                .from("notes")
                .upload(filePath, file);

        if (storageError) throw storageError;

        // Save note details in Database
        const { error: dbError } = await supabaseClient
            .from("notes")
            .insert([{
                title: title,
                subject: subject,
                file_path: storageData.path
            }]);

        if (dbError) throw dbError;

        alert("Notes uploaded successfully!");

        document.getElementById("noteTitle").value = "";
        document.getElementById("noteSubject").value = "";
        document.getElementById("noteFile").value = "";

        location.reload();

    } catch (error) {
        console.error(error);
        alert("Upload failed: " + error.message);
    }

    uploadBtn.disabled = false;
    uploadBtn.textContent = "Upload Notes";
});


async function loadNotes() {
    const { data, error } = await supabaseClient
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading notes:", error);
        return;
    }

    noteContainer.innerHTML = "";

    data.forEach(function(note) {
        const card = document.createElement("div");
        card.className = "note-card";

        const top = document.createElement("div");
        top.className = "card-top";

        const icon = document.createElement("div");
        icon.className = "pdf-icon";
        icon.textContent = "PDF";

        const label = document.createElement("span");
        label.className = "pdf-label";
        label.textContent = "PDF DOCUMENT";

        top.append(icon, label);

        const heading = document.createElement("h3");
        heading.textContent = note.title;

        const description = document.createElement("p");
        description.textContent = note.subject;

        const divider = document.createElement("div");
        divider.className = "card-divider";

        const bottom = document.createElement("div");
        bottom.className = "card-bottom";

        const fileInfo = document.createElement("span");
        fileInfo.textContent = "Study Material";

        const download = document.createElement("a");
        download.textContent = "Download ↓";
        download.className = "download-btn";

        const { data: urlData } = supabaseClient.storage
            .from("notes")
            .getPublicUrl(note.file_path);

        download.href = urlData.publicUrl;
        download.target = "_blank";
        download.rel = "noopener noreferrer";

        bottom.append(fileInfo, download);

        card.append(top, heading, description, divider, bottom);
        noteContainer.appendChild(card);
    });

    applyFilters();
}


loadNotes();
