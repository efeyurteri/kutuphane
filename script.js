let allBooks = [];
let libraryContainer = document.getElementById('library-container');

// Temalar
const themeToggleBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

themeToggleBtn.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    let newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// Veriyi çek
fetch('books.json')
    .then(response => response.json())
    .then(data => {
        allBooks = data;
        populateGenres();
        renderBooks(allBooks); // Sadece bir kere render edilecek
    })
    .catch(error => console.error('Kitaplar yüklenirken hata oluştu:', error));

// Türleri Doldur
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

// Renk Üretici
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 50%, 35%)`; 
}

// 1 Kereye Mahsus Kitapları Çizme
function renderBooks(books) {
    libraryContainer.innerHTML = '';

    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        
        // Arama ve filtreleme için verileri HTML elementine gömüyoruz
        bookCard.setAttribute('data-title', book.title || '');
        bookCard.setAttribute('data-author', book.author || '');
        bookCard.setAttribute('data-genre', book.genre || '');
        bookCard.setAttribute('data-year', book.year_published || 0);
        bookCard.setAttribute('data-pages', book.number_of_pages || 0);
        
        const bgColor = stringToColor(book.isbn13 || book.title);

        let width = 30; 
        if(book.number_of_pages) {
            width = Math.max(25, Math.min(60, book.number_of_pages / 10));
        }
        // Raf görünümü için inline değişken atıyoruz
        bookCard.style.setProperty('--spine-color', bgColor);
        bookCard.style.setProperty('--spine-width', `${width}px`);

        const coverUrl = book.cover_url || '';

        bookCard.innerHTML = `
            <div class="cover-wrapper" style="background-color: ${bgColor};">
                <img src="${coverUrl}" 
                     alt="${book.title}" 
                     class="book-cover" 
                     loading="lazy"
                     onload="checkImage(this)"
                     onerror="showFallback(this)">
                
                <div class="fallback-cover" style="display: none; align-items: center; justify-content: center; height: 100%; text-align: center; color: white; padding: 10px; font-weight: bold; font-size: 14px;">
                    ${book.title}
                </div>
            </div>
            <div class="book-info">
                <p class="book-title" title="${book.title}">${book.title}</p>
                <p class="book-author">${book.author}</p>
            </div>
        `;
        libraryContainer.appendChild(bookCard);
    });

    // İlk dizilim için sıralamayı tetikle
    updateLibrary();
}

// OpenLibrary'nin 1x1 şeffaf piksellerini yakalama
function checkImage(img) {
    if(img.naturalWidth <= 1 || img.naturalHeight <= 1) {
        showFallback(img);
    }
}

function showFallback(img) {
    img.style.display = 'none';
    img.nextElementSibling.style.display = 'flex';
}

// Görünüm Değiştiriciler
const viewBtns = document.querySelectorAll('.view-btn');
viewBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        viewBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const newView = e.target.getAttribute('data-view');
        libraryContainer.className = newView;
        
        // Spine View'da renklendirmeyi CSS variables üzerinden aktif et
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

// Arama, Filtreleme ve Sıralama (Yeniden Çizmeden)
document.getElementById('search-bar').addEventListener('input', updateLibrary);
document.getElementById('sort-select').addEventListener('change', updateLibrary);
document.getElementById('genre-filter').addEventListener('change', updateLibrary);

function updateLibrary() {
    const searchTerm = document.getElementById('search-bar').value.toLocaleLowerCase('tr-TR');
    const sortBy = document.getElementById('sort-select').value;
    const genreFilter = document.getElementById('genre-filter').value;
    
    // NodeList'i Array'e çevirip sıralama yapacağız
    let cards = Array.from(document.querySelectorAll('.book-card'));

    cards.forEach(card => {
        const title = card.getAttribute('data-title').toLocaleLowerCase('tr-TR');
        const author = card.getAttribute('data-author').toLocaleLowerCase('tr-TR');
        const genre = card.getAttribute('data-genre');

        const matchesSearch = title.includes(searchTerm) || author.includes(searchTerm);
        const matchesGenre = genreFilter === 'all' || genre === genreFilter;

        // Silmek yerine gizliyoruz (Titremeyi %100 çözer)
        if (matchesSearch && matchesGenre) {
            card.style.display = ''; 
        } else {
            card.style.display = 'none';
        }
    });

    // Sıralama (Mevcut elementlerin sırasını değiştiriyoruz, resimleri baştan indirtmiyor)
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

    // Sıralanmış elementleri tekrar container'a ekle (DOM taşıması yapar, flash atmaz)
    cards.forEach(card => libraryContainer.appendChild(card));
}
