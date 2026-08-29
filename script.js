let allBooks = [];

const themeToggleBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

themeToggleBtn.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    let newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

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
    // Eğer Google API'den tür gelmediyse 'Belirtilmemiş' yapalım
    allBooks.forEach(b => { if(!b.genre) b.genre = "Diğer"; }); 
    
    const genres = [...new Set(allBooks.map(b => b.genre))].sort();
    
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
    });
}

const libraryContainer = document.getElementById('library-container');
const viewBtns = document.querySelectorAll('.view-btn');

viewBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        viewBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        libraryContainer.className = e.target.getAttribute('data-view');
        renderBooks(getFilteredAndSortedBooks()); 
    });
});

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${hash % 360}, 50%, 35%)`; 
}

function renderBooks(books) {
    libraryContainer.innerHTML = '';
    const currentView = libraryContainer.className;

    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        
        const bgColor = stringToColor(book.isbn13 || book.title);

        if(currentView === 'spine-view') {
            bookCard.style.backgroundColor = bgColor;
            let width = 30; 
            if(book.number_of_pages) {
                width = Math.max(25, Math.min(60, book.number_of_pages / 10));
            }
            bookCard.style.width = `${width}px`;
        }

        // Akıllı Kapak URL Ataması
        const primaryCover = book.cover_url;
        const fallbackCover = book.google_cover_url;

        bookCard.innerHTML = `
            <div class="cover-wrapper" style="background-color: ${bgColor};">
                <img src="${primaryCover}" 
                     alt="${book.title}" 
                     class="book-cover" 
                     loading="lazy"
                     onerror="this.onerror=null; if('${fallbackCover}' !== '') { this.src='${fallbackCover}'; } else { this.style.display='none'; this.nextElementSibling.style.display='flex'; }">
                
                <!-- Kapak bulunamazsa gösterilecek şık yedek kapak tasarımı -->
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
}

document.getElementById('search-bar').addEventListener('input', updateLibrary);
document.getElementById('sort-select').addEventListener('change', updateLibrary);
document.getElementById('genre-filter').addEventListener('change', updateLibrary);

function updateLibrary() {
    renderBooks(getFilteredAndSortedBooks());
}

function getFilteredAndSortedBooks() {
    // Türkçe karakterleri doğru küçültmek için toLocaleLowerCase('tr-TR') kullanıyoruz
    const searchTerm = document.getElementById('search-bar').value.toLocaleLowerCase('tr-TR');
    const sortBy = document.getElementById('sort-select').value;
    const genreFilter = document.getElementById('genre-filter').value;

    let filtered = allBooks.filter(book => {
        const titleMatch = book.title.toLocaleLowerCase('tr-TR').includes(searchTerm);
        const authorMatch = book.author.toLocaleLowerCase('tr-TR').includes(searchTerm);
        const pubMatch = book.publisher && book.publisher.toLocaleLowerCase('tr-TR').includes(searchTerm);
        
        const matchesSearch = titleMatch || authorMatch || pubMatch;
        const matchesGenre = genreFilter === 'all' || book.genre === genreFilter;
        return matchesSearch && matchesGenre;
    });

    filtered.sort((a, b) => {
        if (sortBy === 'title-asc') return a.title.localeCompare(b.title, 'tr');
        if (sortBy === 'title-desc') return b.title.localeCompare(a.title, 'tr');
        if (sortBy === 'year-desc') return (b.year_published || 0) - (a.year_published || 0);
        if (sortBy === 'year-asc') return (a.year_published || 9999) - (b.year_published || 9999);
        if (sortBy === 'pages-desc') return (b.number_of_pages || 0) - (a.number_of_pages || 0);
    });

    return filtered;
}
