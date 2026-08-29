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

// --- GITHUB API İLE YENİ KİTAP EKLEME SİSTEMİ ---

const GITHUB_USER = "efeyurteri"; // Burayı kendi kullanıcı adınla değiştir
const GITHUB_REPO = "kutuphane"; // Burayı repo adınla değiştir
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
    const searchInput = isbnInput.value.trim();
    
    if(!token || !searchInput) {
        statusText.textContent = "Token ve Kitap Bilgisi (ISBN veya İsim) gerekli!";
        statusText.style.color = "red";
        return;
    }

    localStorage.setItem('gh_token', token);
    statusText.textContent = "Open Library'de aranıyor...";
    statusText.style.color = "orange";

    let bookInfo = null;
    let isIsbn = /^\d{10,13}$/.test(searchInput);

    try {
        // 1. ADIM: OPEN LIBRARY (Öncelikli)
        if (isIsbn) {
            const olRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${searchInput}&format=json&jscmd=data`);
            const olData = await olRes.json();
            const key = `ISBN:${searchInput}`;
            
            if (olData[key]) {
                const data = olData[key];
                bookInfo = {
                    title: data.title,
                    author: data.authors ? data.authors.map(a => a.name).join(", ") : "Bilinmeyen Yazar",
                    isbn: searchInput,
                    isbn13: searchInput.length === 13 ? searchInput : "",
                    publisher: data.publishers ? data.publishers.map(p => p.name).join(", ") : "",
                    number_of_pages: data.number_of_pages || 0,
                    year_published: data.publish_date ? parseInt(data.publish_date.match(/\d{4}/)?.[0] || 0) : 0,
                    genre: data.subjects ? data.subjects.map(s => s.name)[0] : "Kurgu / Diğer",
                    google_cover_url: "" 
                };
            }
        } 
        
        // Open Library İsimden Arama
        if (!bookInfo && !isIsbn) {
            const olRes = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchInput)}`);
            const olData = await olRes.json();
            
            if (olData.docs && olData.docs.length > 0) {
                const doc = olData.docs[0];
                const foundIsbn = doc.isbn ? doc.isbn[0] : "";
                bookInfo = {
                    title: doc.title,
                    author: doc.author_name ? doc.author_name.join(", ") : "Bilinmeyen Yazar",
                    isbn: foundIsbn,
                    isbn13: foundIsbn && foundIsbn.length === 13 ? foundIsbn : "",
                    publisher: doc.publisher ? doc.publisher[0] : "",
                    number_of_pages: doc.number_of_pages_median || 0,
                    year_published: doc.first_publish_year || 0,
                    genre: doc.subject ? doc.subject[0] : "Kurgu / Diğer",
                    google_cover_url: ""
                };
            }
        }

        // 2. ADIM: GOOGLE BOOKS (Yedek - Open Library'de bulunamazsa çalışır)
        if (!bookInfo) {
            statusText.textContent = "Open Library'de yok. Google'da aranıyor...";
            let gQuery = isIsbn ? `q=isbn:${searchInput}` : `q=${encodeURIComponent(searchInput)}`;
            let gRes = await fetch(`https://www.googleapis.com/books/v1/volumes?${gQuery}`);
            let gData = await gRes.json();

            // ISBN barkodu Google'da yoksa zorla kelime kelime arat
            if ((!gData.items || gData.items.length === 0) && isIsbn) {
                gRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${searchInput}`);
                gData = await gRes.json();
            }

            if (gData.items && gData.items.length > 0) {
                const info = gData.items[0].volumeInfo;
                let extractedIsbn13 = "";
                if (info.industryIdentifiers) {
                    const i13 = info.industryIdentifiers.find(i => i.type === "ISBN_13");
                    if (i13) extractedIsbn13 = i13.identifier;
                }
                const finalIsbn = isIsbn ? searchInput : (extractedIsbn13 || "Bilinmiyor");

                bookInfo = {
                    title: info.title || "İsimsiz Kitap",
                    author: info.authors ? info.authors.join(", ") : "Bilinmeyen Yazar",
                    isbn: finalIsbn,
                    isbn13: finalIsbn.length === 13 ? finalIsbn : "",
                    publisher: info.publisher || "",
                    number_of_pages: info.pageCount || 0,
                    year_published: info.publishedDate ? parseInt(info.publishedDate.substring(0,4)) : 0,
                    genre: info.categories ? info.categories[0] : "Kurgu / Diğer",
                    google_cover_url: info.imageLinks && info.imageLinks.thumbnail ? info.imageLinks.thumbnail.replace('http:', 'https:') : ""
                };
            }
        }

        // İki veritabanında da yoksa işlemi durdur
        if (!bookInfo) {
            statusText.textContent = "Kitap hiçbir veritabanında bulunamadı!";
            statusText.style.color = "red";
            return;
        }

        statusText.textContent = "Kitap bulundu! GitHub'a kaydediliyor...";

        // 3. ADIM: GITHUB'A KAYDETME
        const fileRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${JSON_PATH}`, {
            headers: { 'Authorization': `token ${token}` }
        });
        const fileData = await fileRes.json();
        
        const currentContent = decodeURIComponent(escape(atob(fileData.content)));
        let currentBooks = JSON.parse(currentContent);

        currentBooks.unshift(bookInfo);

        const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(currentBooks, null, 2))));
        
        const updateRes = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${JSON_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Yeni kitap eklendi: ${bookInfo.title}`,
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
