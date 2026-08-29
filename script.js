let allBooks = [];
let libraryContainer = document.getElementById('library-container');

// Tema Kontrolü
const themeToggleBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

themeToggleBtn.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    let newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// JSON Verisini Çekme
fetch('books.json')
    .then(response => response.json())
    .then(data => {
        allBooks = data;
        populateGenres();
        renderBooks(allBooks);
    })
    .catch(error => console.error('Kitaplar yüklenirken hata oluştu:', error));

function populateGenres() {
    const genreSelect = document.getElementById('genre-filter');
    const genres = [...new Set(allBooks.map(b => b.genre))].sort();
    
    genres.forEach(genre => {
        if(genre) {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            genreSelect.appendChild(option);
        }
    });
}

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 50%, 35%)`; 
}

// Tüm Kitapları Bir Kere DOM'a Çizme
function renderBooks(books) {
    libraryContainer.innerHTML = '';

    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        
        bookCard.setAttribute('data-title', book.title || '');
        bookCard.setAttribute('data-author', book.author || '');
        bookCard.setAttribute('data-genre', book.genre || '');
        bookCard.setAttribute('data-year', book.year_published || 0);
        bookCard.setAttribute('data-pages', book.number_of_pages || 0);
        
        const isbnToUse = book.isbn13 || book.isbn || '';
        const bgColor = stringToColor(isbnToUse || book.title);

        let width = 30; 
        if(book.number_of_pages) {
            width = Math.max(25, Math.min(60, book.number_of_pages / 10));
        }
        
        bookCard.style.setProperty('--spine-color', bgColor);
        bookCard.style.setProperty('--spine-width', `${width}px`);

        // Sadece OpenLibrary denenir. Bulunamazsa onError tetiklenir.
        const primaryCover = isbnToUse ? `https://covers.openlibrary.org/b/isbn/${isbnToUse}-M.jpg` : '';

        bookCard.innerHTML = `
            <div class="cover-wrapper" style="background-color: ${bgColor};">
                <img src="${primaryCover}" 
                     alt="${book.title}" 
                     class="book-cover" 
                     loading="lazy"
                     onload="checkImage(this)"
                     onerror="showFallback(this)">
                
                <div class="fallback-cover" style="display: none;">
                    <div class="fb-title">${book.title}</div>
                    <div class="fb-author">${book.author}</div>
                </div>
            </div>
            <div class="book-info">
                <p class="book-title" title="${book.title}">${book.title}</p>
                <p class="book-author">${book.author}</p>
            </div>
        `;
        libraryContainer.appendChild(bookCard);
    });

    updateLibrary();
}

function checkImage(img) {
    if(img.naturalWidth <= 1 || img.naturalHeight <= 1) {
        img.onerror();
    }
}

function showFallback(img) {
    img.style.display = 'none';
    if(img.nextElementSibling) {
        img.nextElementSibling.style.display = 'flex';
    }
}

// Görünüm Değiştirme
const viewBtns = document.querySelectorAll('.view-btn');
viewBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        viewBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const newView = e.target.getAttribute('data-view');
        libraryContainer.className = newView;
        
        const cards = document.querySelectorAll('.book-card');
        cards.forEach(card => {
            if(newView === 'spine-view') {
                card.style.backgroundColor = card.style.getPropertyValue('--spine-color');
                card.style.width = card.style.getPropertyValue('--spine-width');
            } else {
                card.style.backgroundColor = '';
                card.style.width = '';
            }
        });
    });
});

// Arama, Filtreleme ve Sıralama
document.getElementById('search-bar').addEventListener('input', updateLibrary);
document.getElementById('sort-select').addEventListener('change', updateLibrary);
document.getElementById('genre-filter').addEventListener('change', updateLibrary);

function updateLibrary() {
    const searchTerm = document.getElementById('search-bar').value.toLocaleLowerCase('tr-TR');
    const sortBy = document.getElementById('sort-select').value;
    const genreFilter = document.getElementById('genre-filter').value;
    
    let cards = Array.from(document.querySelectorAll('.book-card'));

    cards.forEach(card => {
        const title = card.getAttribute('data-title').toLocaleLowerCase('tr-TR');
        const author = card.getAttribute('data-author').toLocaleLowerCase('tr-TR');
        const genre = card.getAttribute('data-genre');

        const matchesSearch = title.includes(searchTerm) || author.includes(searchTerm);
        const matchesGenre = genreFilter === 'all' || genre === genreFilter;

        if (matchesSearch && matchesGenre) {
            card.style.display = ''; 
        } else {
            card.style.display = 'none';
        }
    });

    cards.sort((a, b) => {
        const titleA = a.getAttribute('data-title');
        const titleB = b.getAttribute('data-title');
        const yearA = parseInt(a.getAttribute('data-year')) || 0;
        const yearB = parseInt(b.getAttribute('data-year')) || 0;
        const pagesA = parseInt(a.getAttribute('data-pages')) || 0;
        const pagesB = parseInt(b.getAttribute('data-pages')) || 0;

        if (sortBy === 'title-asc') return titleA.localeCompare(titleB, 'tr');
        if (sortBy === 'title-desc') return titleB.localeCompare(titleA, 'tr');
        if (sortBy === 'year-desc') return yearB - yearA;
        if (sortBy === 'year-asc') return yearA - yearB;
        if (sortBy === 'pages-desc') return pagesB - pagesA;
    });

    cards.forEach(card => libraryContainer.appendChild(card));
}

// --- GITHUB API İLE YENİ KİTAP EKLEME SİSTEMİ ---

const GITHUB_USER = "efeyurteri"; // Örnek: efeyurteri
const GITHUB_REPO = "kutuphane"; // Örnek: kutuphane
const JSON_PATH = "books.json";

const tokenInput = document.getElementById('github-token');
const isbnInput = document.getElementById('new-isbn');
const addBtn = document.getElementById('add-book-btn');
const statusText = document.getElementById('add-status');

if(localStorage.getItem('gh_token')) {
    tokenInput.value = localStorage.getItem('gh_token');
}

addBtn.addEventListener('click', async () => {
    const token = tokenInput.value.trim();
    const isbn = isbnInput.value.trim();
    
    if(!token || !isbn) {
        statusText.textContent = "Token ve ISBN gerekli!";
        statusText.style.color = "red";
        return;
    }

    localStorage.setItem('gh_token', token);
    statusText.textContent = "Google'da aranıyor...";
    statusText.style.color = "orange";

    try {
        const googleRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
        const googleData = await googleRes.json();

        if(!googleData.items || googleData.items.length === 0) {
            statusText.textContent = "Kitap bulunamadı!";
            statusText.style.color = "red";
            return;
        }

        const info = googleData.items[0].volumeInfo;
        
        const newBook = {
            title: info.title || "İsimsiz Kitap",
            author: info.authors ? info.authors.join(", ") : "Bilinmeyen Yazar",
            additional_authors: "",
            isbn: isbn,
            isbn13: isbn.length === 13 ? isbn : "",
            publisher: info.publisher || "",
            binding: "Bilinmiyor",
            number_of_pages: info.pageCount || 0,
            year_published: info.publishedDate ? parseInt(info.publishedDate.substring(0,4)) : 0,
            original_publication_year: 0,
            genre: info.categories ? info.categories[0] : "Kurgu / Diğer"
        };

        statusText.textContent = "GitHub'a kaydediliyor...";

        const fileRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${JSON_PATH}`, {
            headers: { 'Authorization': `token ${token}` }
        });
        const fileData = await fileRes.json();
        
        const currentContent = decodeURIComponent(escape(atob(fileData.content)));
        let currentBooks = JSON.parse(currentContent);

        currentBooks.unshift(newBook);

        const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(currentBooks, null, 2))));
        
        const updateRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${JSON_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Yeni kitap eklendi: ${newBook.title}`,
                content: updatedContent,
                sha: fileData.sha 
            })
        });

        if(updateRes.ok) {
            statusText.textContent = "Başarıyla Eklendi! (Sayfa 1-2 dk içinde güncellenir)";
            statusText.style.color = "green";
            isbnInput.value = ""; 
        } else {
            throw new Error("GitHub güncellenemedi.");
        }

    } catch (error) {
        statusText.textContent = "Hata oluştu!";
        statusText.style.color = "red";
        console.error(error);
    }
});
