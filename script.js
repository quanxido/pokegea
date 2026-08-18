const firebaseConfig = {
    apiKey: "AIzaSyCAqcgt7wcgc2WyfgZC-8_u9Rd9f5MkJq4",
    authDomain: "game-archieve.firebaseapp.com",
    databaseURL: "https://game-archieve-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "game-archieve",
    storageBucket: "game-archieve.firebasestorage.app",
    messagingSenderId: "226505931314",
    appId: "226505931314:web:61cc741644cce20bd21a2b"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const grid = document.getElementById('gameGrid');
const searchInput = document.getElementById('searchInput');
let allGames = [];

function renderGames(gameList) {
    grid.innerHTML = ''; 
    if (gameList.length === 0) {
        grid.innerHTML = '<div class="empty-state">Không tìm thấy tựa game nào.</div>';
        return;
    }

    grid.innerHTML = gameList.map(game => {
        const statusClass = game.status && game.status.toLowerCase() === 'complete' ? 'complete' : 'ongoing';
        return `
            <div class="card">
                <img src="${game.image}" alt="${game.name}" class="card-img" loading="lazy">
                <div class="card-content">
                    <div class="card-title" title="${game.name}">${game.name}</div>
                    <div class="tags-container">
                        <span class="badge platform">${game.platform || 'N/A'}</span>
                        <span class="badge">${game.language || 'N/A'}</span>
                    </div>
                    <div class="meta-info">
                        <span class="status ${statusClass}">${game.status || 'Unknown'}</span>
                        <span>${game.version || ''}</span>
                    </div>
                    <a href="${game.download_url}" target="_blank" rel="noopener noreferrer" class="btn-download">Tải xuống</a>
                </div>
            </div>
        `;
    }).join('');
}

db.ref('games').on('value', (snapshot) => {
    const data = snapshot.val();
    allGames = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse() : [];
    filterAndRender();
});

function filterAndRender() {
    const term = searchInput.value.toLowerCase().trim();
    const filtered = allGames.filter(g => 
        (g.name && g.name.toLowerCase().includes(term)) || 
        (g.platform && g.platform.toLowerCase().includes(term))
    );
    renderGames(filtered);
}

searchInput.addEventListener('input', filterAndRender);