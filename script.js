

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

        const heading = document.createElement("h3");
        heading.textContent = note.title;

        const description = document.createElement("p");
        description.textContent = note.subject;

        const label = document.createElement("span");
        label.textContent = "PDF Notes";

        const download = document.createElement("a");
        download.textContent = "Download PDF";
        download.className = "btn";
        download.style.display = "inline-block";
        download.style.marginTop = "20px";

        const { data: urlData } = supabaseClient.storage
            .from("notes")
            .getPublicUrl(note.file_path);

        download.href = urlData.publicUrl;
        download.target = "_blank";

        card.append(heading, description, label, download);
        noteContainer.appendChild(card);
    });

    applyFilters();
}

loadNotes();
