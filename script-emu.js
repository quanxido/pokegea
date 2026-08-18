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

const grid = document.getElementById('emulatorGrid');
const searchInput = document.getElementById('searchEmu');
let allEmulators = [];

function renderEmulators(emuList) {
    grid.innerHTML = ''; 
    if (emuList.length === 0) {
        grid.innerHTML = '<div class="empty-state">Không tìm thấy phần mềm giả lập nào.</div>';
        return;
    }

    grid.innerHTML = emuList.map(emu => {
        return `
            <div class="card">
                <img src="${emu.image}" alt="${emu.name}" class="card-img" style="object-fit: contain; padding: 10px; background-color: #111;" loading="lazy">
                <div class="card-content">
                    <div class="card-title" title="${emu.name}">${emu.name}</div>
                    <div class="tags-container">
                        <span class="badge platform">${emu.platform || 'N/A'}</span>
                    </div>
                    <div class="meta-info">
                        <span class="status complete">Sẵn sàng</span>
                        <span>${emu.version || ''}</span>
                    </div>
                    <a href="${emu.download_url}" target="_blank" rel="noopener noreferrer" class="btn-download">Tải xuống</a>
                </div>
            </div>
        `;
    }).join('');
}

db.ref('emulators').on('value', (snapshot) => {
    const data = snapshot.val();
    allEmulators = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse() : [];
    filterAndRender();
});

function filterAndRender() {
    const term = searchInput.value.toLowerCase().trim();
    const filtered = allEmulators.filter(e => 
        (e.name && e.name.toLowerCase().includes(term)) || 
        (e.platform && e.platform.toLowerCase().includes(term))
    );
    renderEmulators(filtered);
}

searchInput.addEventListener('input', filterAndRender);