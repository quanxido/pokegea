// === 1. CẤU HÌNH FIREBASE ===
const firebaseConfig = {
    apiKey: "AIzaSyCAqcgt7wcgc2WyfgZC-8_u9Rd9f5MkJq4",
    authDomain: "game-archieve.firebaseapp.com",
    databaseURL: "https://game-archieve-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "game-archieve",
    storageBucket: "game-archieve.firebasestorage.app",
    messagingSenderId: "226505931314",
    appId: "226505931314:web:61cc741644cce20bd21a2b"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// DOM Elements
const grid = document.getElementById('gameGrid');
const searchInput = document.getElementById('searchInput');
let allGames = [];

// === 2. HÀM RENDER GIAO DIỆN CÁC THẺ GAME ===
function renderGames(gameList) {
    grid.innerHTML = ''; 
    
    // Nếu không có game nào khớp hoặc database trống
    if (gameList.length === 0) {
        grid.innerHTML = '<div class="empty-state">Không tìm thấy tựa game nào.</div>';
        return;
    }

    // Tạo HTML cho từng game
    const gamesHTML = gameList.map(game => {
        const statusClass = game.status && game.status.toLowerCase() === 'complete' ? 'complete' : 'ongoing';
        return `
            <div class="card">
                <img src="${game.image}" alt="${game.name}" class="card-img" loading="lazy">
                <div class="card-content">
                    <h2 class="card-title" title="${game.name}">${game.name}</h2>
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
    }).join(''); // Dùng join('') để ghép mảng string, tối ưu DOM thao tác 1 lần

    grid.innerHTML = gamesHTML;
}

// === 3. LẮNG NGHE DỮ LIỆU TỪ FIREBASE ===
db.ref('games').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Chuyển Object Firebase thành Mảng và đảo ngược (mới nhất lên đầu)
        allGames = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        })).reverse();
    } else {
        allGames = [];
    }
    
    // Hiển thị dữ liệu khi load xong (đồng thời áp dụng bộ lọc tìm kiếm hiện tại nếu có)
    const searchTerm = searchInput.value.toLowerCase();
    if(searchTerm) {
        const filtered = allGames.filter(g => 
            (g.name && g.name.toLowerCase().includes(searchTerm)) || 
            (g.platform && g.platform.toLowerCase().includes(searchTerm))
        );
        renderGames(filtered);
    } else {
        renderGames(allGames);
    }
});

// === 4. CHỨC NĂNG TÌM KIẾM THỜI GIAN THỰC ===
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    
    // Lọc danh sách game
    const filtered = allGames.filter(g => 
        (g.name && g.name.toLowerCase().includes(term)) || 
        (g.platform && g.platform.toLowerCase().includes(term))
    );
    
    renderGames(filtered);
});