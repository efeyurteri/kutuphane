let allBooks = [];

// Karanlık Mod Kontrolü
const themeToggleBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

themeToggleBtn.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    let newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// JSON verisini çek
fetch('books.json')
    .then(response => response.json())
    .then(data => {
        allBooks = data;
        populateGenres();
        renderBooks(allBooks);
    })
    .catch(error => console.error('Kitaplar yüklenirken hata oluştu:', error));

// Türleri filtreye ekle
function populateGenres() {
    const genreSelect = document.getElementById('genre-filter');
    const genres = [...new Set(allBooks.map(b => b.genre).filter(Boolean))];
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
    });
}

// Görünüm Değiştirme
const libraryContainer = document.getElementById('library-container');
const viewBtns = document.querySelectorAll('.view-btn');

viewBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        viewBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        libraryContainer.className = e.target.getAttribute('data-view');
        renderBooks(getFilteredAndSortedBooks()); // Görünüm değişince yeniden çiz
    });
});

// Sırt (Spine) için ISBN'den renk üreten Hash Fonksiyonu
// Bu sayede her kitabın sırtı kapağıyla orantılı, estetik ve tutarlı bir renk alır (CORS hatası olmadan).
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // HSL kullanarak okunaklı, mat kütüphane renkleri üretiyoruz (Saturation: 50%, Lightness: 35%)
    return `hsl(${hash % 360}, 50%, 35%)`; 
}

// Kitapları Ekrana Çizme
function renderBooks(books) {
    libraryContainer.innerHTML = '';
    const currentView = libraryContainer.className;

    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        
        // Eğer Spine View aktifse, arka plan rengini ISBN'den veya başlık'tan üret
        if(currentView === 'spine-view') {
            const seed = book.isbn13 || book.isbn || book.title;
            bookCard.style.backgroundColor = stringToColor(seed);
            
            // Kitabın kalınlığını sayfa sayısına göre ayarla (opsiyonel estetik)
            let width = 30; // Min genişlik
            if(book.number_of_pages) {
                width = Math.max(25, Math.min(60, book.number_of_pages / 10));
            }
            bookCard.style.width = `${width}px`;
        }

        const coverUrl = book.cover_url ? book.cover_url : 'https://via.placeholder.com/150x220?text=Kapak+Yok';

        bookCard.innerHTML = `
            <img src="${coverUrl}" alt="${book.title}" class="book-cover" loading="lazy">
            <div class="book-info">
                <p class="book-title" title="${book.title}">${book.title}</p>
                <p class="book-author">${book.author}</p>
            </div>
        `;
        libraryContainer.appendChild(bookCard);
    });
}

// Arama, Filtreleme ve Sıralama Tetikleyicileri
document.getElementById('search-bar').addEventListener('input', updateLibrary);
document.getElementById('sort-select').addEventListener('change', updateLibrary);
document.getElementById('genre-filter').addEventListener('change', updateLibrary);

function updateLibrary() {
    renderBooks(getFilteredAndSortedBooks());
}

function getFilteredAndSortedBooks() {
    const searchTerm = document.getElementById('search-bar').value.toLowerCase();
    const sortBy = document.getElementById('sort-select').value;
    const genreFilter = document.getElementById('genre-filter').value;

    // 1. Filtreleme
    let filtered = allBooks.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) || 
                              book.author.toLowerCase().includes(searchTerm) ||
                              (book.publisher && book.publisher.toLowerCase().includes(searchTerm));
        const matchesGenre = genreFilter === 'all' || book.genre === genreFilter;
        return matchesSearch && matchesGenre;
    });

    // 2. Sıralama
    filtered.sort((a, b) => {
        if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
        if (sortBy === 'title-desc') return b.title.localeCompare(a.title);
        if (sortBy === 'year-desc') return (b.year_published || 0) - (a.year_published || 0);
        if (sortBy === 'year-asc') return (a.year_published || 9999) - (b.year_published || 9999);
        if (sortBy === 'pages-desc') return (b.number_of_pages || 0) - (a.number_of_pages || 0);
    });

    return filtered;
}