// 全局变量
let projects = [];
let achievements = [];
let coins = 0;
let diamonds = 0;
let boxCount = 24;
let currentTab = 'others';

// API 基础URL
const API_BASE = '';

// DOM 元素
const boxGrid = document.getElementById('box-grid');
const uploadModal = document.getElementById('upload-modal');
const editModal = document.getElementById('edit-modal');
const achievementModal = document.getElementById('achievement-modal');
const uploadForm = document.getElementById('upload-form');
const editForm = document.getElementById('edit-form');
const addBoxBtn = document.getElementById('add-box-btn');
const achievementBtn = document.getElementById('achievement-btn');
const coinCount = document.getElementById('coin-count');
const diamondCount = document.getElementById('diamond-count');
const coinContainer = document.getElementById('coin-container');
const diamondContainer = document.getElementById('diamond-container');
const achievementList = document.getElementById('achievement-list');
const particleContainer = document.getElementById('particle-container');
const warehouseCount = document.getElementById('warehouse-count');
const tabs = document.querySelectorAll('.tab');

// 初始化
async function init() {
    // 加载货币数据（从localStorage）
    loadCurrencyFromLocalStorage();
    // 从服务器加载项目数据
    await loadProjectsFromServer();
    // 渲染盒子
    renderBoxes();
    // 渲染成就
    renderAchievements();
    // 更新货币显示
    updateCurrencyDisplay();
    // 更新仓库计数
    updateWarehouseCount();
    // 更新成就按钮计数
    updateAchievementButtonCount();
    // 添加事件监听器
    addEventListeners();
    // 初始化无限滚动
    initInfiniteScroll();
    // 初始化难度选择
    initDifficultySelection();
    // 初始化图片预览
    initImagePreview();
}

// 从服务器加载所有项目
async function loadProjectsFromServer() {
    try {
        const response = await fetch(`${API_BASE}/api/all-projects`);
        if (response.ok) {
            projects = await response.json();
            // 同步成就列表
            syncAchievementsWithProjects();
        }
    } catch (error) {
        console.error('加载项目失败:', error);
        projects = [];
    }
}

// 从localStorage加载货币数据
function loadCurrencyFromLocalStorage() {
    const savedCoins = localStorage.getItem('infiAchieveBox_coins');
    const savedDiamonds = localStorage.getItem('infiAchieveBox_diamonds');
    const savedBoxCount = localStorage.getItem('infiAchieveBox_boxCount');
    const savedCurrentTab = localStorage.getItem('infiAchieveBox_currentTab');

    // 只有在有项目数据时才加载货币
    if (projects.length === 0) {
        coins = 0;
        diamonds = 0;
    } else {
        if (savedCoins) coins = parseInt(savedCoins);
        if (savedDiamonds) diamonds = parseInt(savedDiamonds);
    }

    if (savedBoxCount) boxCount = parseInt(savedBoxCount);
    if (savedCurrentTab) currentTab = savedCurrentTab;

    // 设置当前选中的分栏
    tabs.forEach(tab => {
        if (tab.dataset.tab === currentTab) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// 保存货币数据到本地存储
function saveCurrencyToLocalStorage() {
    localStorage.setItem('infiAchieveBox_coins', coins.toString());
    localStorage.setItem('infiAchieveBox_diamonds', diamonds.toString());
    localStorage.setItem('infiAchieveBox_boxCount', boxCount.toString());
    localStorage.setItem('infiAchieveBox_currentTab', currentTab);
}

// 渲染盒子
function renderBoxes() {
    boxGrid.innerHTML = '';

    // 过滤当前分栏的项目
    const filteredProjects = projects.filter(p => p.category === currentTab || (!p.category && currentTab === 'others'));

    // 计算当前分栏需要的盒子数量
    const currentBoxCount = Math.max(boxCount, filteredProjects.length + 5);

    for (let i = 0; i < currentBoxCount; i++) {
        const box = document.createElement('div');
        box.className = 'box';

        const project = filteredProjects.find(p => p.boxIndex === i);

        if (project) {
            // 已填充的盒子 - 根据难度添加不同颜色
            const difficultyClass = `difficulty-${project.difficulty}`;
            box.className += ` filled ${difficultyClass}`;
            box.innerHTML = `
                <div class="box-content">
                    <img src="${project.image}" alt="${project.title}" class="box-image">
                    <h3 class="box-title">${project.title}</h3>
                    <div class="box-actions">
                        <button class="box-btn view" onclick="viewProject('${project.id}')">查看</button>
                        <button class="box-btn edit" onclick="editProject('${project.id}')">编辑</button>
                        <button class="box-btn delete" onclick="deleteProject('${project.id}')">删除</button>
                    </div>
                </div>
            `;
        } else {
            // 空盒子
            box.className += ' empty';
            box.innerHTML = '+';
            box.onclick = () => openUploadModal(i);
        }

        // 添加3D倾斜效果 - 已填充盒子使用更弱的效果
        if (project) {
            addCardTiltEffect(box, true); // 已填充盒子 - 更弱效果
        } else {
            addCardTiltEffect(box, false); // 空盒子 - 正常效果
        }

        boxGrid.appendChild(box);
    }
}

// 添加卡片3D倾斜效果（isFilled: 是否已填充）
function addCardTiltEffect(card, isFilled = false) {
    // 鼠标移入
    card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform 0.1s ease-out';
    });

    // 鼠标移动 - 计算倾斜角度
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 计算鼠标相对于卡片中心的位置 (-1 到 1)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // 所有卡片使用相同的透视形变效果（像图二蓝色卡片那样）
        const rotateX = ((y - centerY) / centerY) * -10; // 最大10度倾斜
        const rotateY = ((x - centerX) / centerX) * 10;

        // 应用3D变换 - 已填充卡片也有透视形变，但程度减半
        const scale = isFilled ? 1.015 : 1.03;
        const translateZ = isFilled ? 8 : 15;

        card.style.transform = `
            perspective(1000px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            scale3d(${scale}, ${scale}, ${scale})
            translateZ(${translateZ}px)
        `;

        // 动态调整光泽效果位置
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        card.style.setProperty('--glare-x', `${glareX}%`);
        card.style.setProperty('--glare-y', `${glareY}%`);
    });

    // 鼠标移出 - 恢复原始状态
    card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.5s ease-out';
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateZ(0)';
    });
}

// 渲染成就 - 显示所有成就（不限于当前分栏）
function renderAchievements() {
    achievementList.innerHTML = '';

    // 获取所有项目的成就（确保与用户创建的盒子同步）
    const allAchievements = projects.map(project => ({
        id: project.id,
        name: project.title,
        date: new Date(project.date).toLocaleString(),
        category: project.category || 'others'
    }));

    if (allAchievements.length === 0) {
        achievementList.innerHTML = '<p style="text-align: center; color: #6abaff; font-weight: bold;">还没有成就，继续努力吧！</p>';
        return;
    }

    // 按日期倒序排列（最新的在前）
    allAchievements.sort((a, b) => new Date(b.date) - new Date(a.date));

    allAchievements.forEach((achievement) => {
        const achievementItem = document.createElement('div');
        achievementItem.className = 'achievement-item';
        const categoryText = {
            'others': '【其他】',
            'ugui': '【UGUI】',
            'effects': '【动效】'
        }[achievement.category] || '【其他】';
        achievementItem.innerHTML = `
            <h3>🏆 ${achievement.name}</h3>
            <p>${categoryText} 解锁时间: ${achievement.date}</p>
        `;
        achievementList.appendChild(achievementItem);
    });
}

// 更新货币显示
function updateCurrencyDisplay() {
    coinCount.textContent = coins;
    diamondCount.textContent = diamonds;
}

// 更新仓库计数
function updateWarehouseCount() {
    const filteredProjects = projects.filter(p => p.category === currentTab || (!p.category && currentTab === 'others'));
    warehouseCount.textContent = `${filteredProjects.length}/${boxCount}`;
}

// 更新成就按钮计数
function updateAchievementButtonCount() {
    achievementBtn.setAttribute('data-count', projects.length);
}

// 打开上传模态框
function openUploadModal(boxIndex) {
    document.getElementById('upload-form').dataset.boxIndex = boxIndex;
    document.getElementById('project-category').value = currentTab;
    uploadModal.classList.add('active');
}

// 关闭上传模态框
function closeUploadModal() {
    uploadModal.classList.remove('active');
    uploadForm.reset();
    document.querySelectorAll('.difficulty-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelector('.difficulty-option[data-value="1"]').classList.add('selected');
    document.getElementById('project-difficulty').value = '1';
}

// 打开编辑模态框
async function editProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    document.getElementById('edit-index').value = projectId;
    document.getElementById('edit-project-description').value = project.description;
    document.getElementById('edit-project-category').value = project.category || 'others';
    document.getElementById('edit-achievement-name').value = project.title;

    // 设置难度选择
    const difficulty = project.difficulty || '1';
    document.getElementById('edit-project-difficulty').value = difficulty;
    document.querySelectorAll('#edit-modal .difficulty-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.value === difficulty) {
            opt.classList.add('selected');
        }
    });

    // 显示当前图片
    const currentImageContainer = document.getElementById('current-image-container');
    currentImageContainer.innerHTML = `<img src="${project.image}" alt="当前图片" style="max-width: 100%; max-height: 150px; border-radius: 8px; border: 2px solid #4a9ad9;">`;

    editModal.classList.add('active');
}

// 关闭编辑模态框
function closeEditModal() {
    editModal.classList.remove('active');
    editForm.reset();
    document.getElementById('current-image-container').innerHTML = '';
}

// 打开成就模态框
function openAchievementModal() {
    renderAchievements(); // 每次打开时重新渲染成就列表
    achievementModal.classList.add('active');
}

// 关闭成就模态框
function closeAchievementModal() {
    achievementModal.classList.remove('active');
}

// 查看项目详情 - 使用自定义弹窗替代alert
function viewProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const categoryText = {
        'others': '其他',
        'ugui': 'UGUI',
        'effects': '动效'
    }[project.category || 'others'];

    // 创建自定义弹窗
    const modal = document.createElement('div');
    modal.className = 'view-modal';
    modal.innerHTML = `
        <div class="view-modal-content">
            <div class="view-modal-header">
                <h3>🏆 ${project.title}</h3>
                <button class="view-modal-close" onclick="this.closest('.view-modal').remove()">×</button>
            </div>
            <div class="view-modal-body">
                <div class="view-modal-image">
                    <img src="${project.image}" alt="${project.title}">
                </div>
                <div class="view-modal-info">
                    <div class="view-modal-section">
                        <span class="view-modal-label">📝 项目描述:</span>
                        <p class="view-modal-description">${project.description}</p>
                    </div>
                    <div class="view-modal-section">
                        <span class="view-modal-label">📂 分类:</span>
                        <span class="view-modal-value">${categoryText}</span>
                    </div>
                    <div class="view-modal-section">
                        <span class="view-modal-label">⭐ 难度:</span>
                        <span class="view-modal-value">${project.difficulty}</span>
                    </div>
                    <div class="view-modal-section">
                        <span class="view-modal-label">🎁 获得奖励:</span>
                        <span class="view-modal-value">${getRewardText(project.difficulty)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// 删除项目
async function deleteProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    if (confirm('确定要删除这个项目吗？删除后将扣除相应的金币或钻石。')) {
        // 扣除相应的货币
        const difficulty = String(project.difficulty);
        switch (difficulty) {
            case '1':
                coins = Math.max(0, coins - 10);
                break;
            case '2':
                coins = Math.max(0, coins - 20);
                break;
            case '3':
                diamonds = Math.max(0, diamonds - 1);
                break;
        }

        try {
            // 从服务器删除
            const response = await fetch(`${API_BASE}/api/projects/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: projectId,
                    category: project.category || 'others'
                })
            });

            if (response.ok) {
                // 从本地数组删除
                projects = projects.filter(p => p.id !== projectId);
                // 删除对应的成就
                achievements = achievements.filter(a => a.projectId !== projectId);

                saveCurrencyToLocalStorage();
                renderBoxes();
                renderAchievements();
                updateCurrencyDisplay();
                updateWarehouseCount();
                updateAchievementButtonCount();
            } else {
                alert('删除失败，请重试');
            }
        } catch (error) {
            console.error('删除项目失败:', error);
            alert('删除失败，请检查网络连接');
        }
    }
}

// 获取奖励文本
function getRewardText(difficulty) {
    switch (difficulty) {
        case '1': return '10金币';
        case '2': return '20金币';
        case '3': return '1钻石 + 新成就';
        default: return '';
    }
}

// 处理图片上传为Base64
function handleImageUpload(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 同步所有项目到成就列表
function syncAchievementsWithProjects() {
    const existingProjectIds = new Set(achievements.map(a => a.projectId));

    projects.forEach(project => {
        if (!existingProjectIds.has(project.id)) {
            const achievement = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                projectId: project.id,
                name: project.title,
                date: new Date(project.date).toLocaleString()
            };
            achievements.push(achievement);
        }
    });
}

// 生成粒子特效
function createParticleEffect(element, type) {
    const rect = element.getBoundingClientRect();
    const particleCount = 25;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = type === 'coin' ? '💰' : '💎';

        particle.style.left = `${centerX}px`;
        particle.style.top = `${centerY}px`;

        const angle = Math.random() * Math.PI * 2;
        const distance = 60 + Math.random() * 150;
        const randomX = Math.cos(angle) * distance;
        const randomY = Math.sin(angle) * distance + 80;
        const randomDelay = Math.random() * 0.2;
        const randomDuration = 0.8 + Math.random() * 0.7;
        const randomRotation = Math.random() * 1080 - 540;
        const randomScale = 0.3 + Math.random() * 0.5;
        const randomStartScale = 0.8 + Math.random() * 0.6;

        particle.style.setProperty('--random-x', `${randomX}px`);
        particle.style.setProperty('--random-y', `${randomY}px`);
        particle.style.setProperty('--random-rotation', `${randomRotation}deg`);
        particle.style.setProperty('--random-scale', randomScale);
        particle.style.setProperty('--random-start-scale', randomStartScale);

        particle.style.animation = `particleExplode ${randomDuration}s ease-out ${randomDelay}s forwards`;

        particleContainer.appendChild(particle);

        setTimeout(() => {
            if (particle.parentNode) {
                particle.remove();
            }
        }, (randomDuration + randomDelay) * 1000 + 100);
    }
}

// 初始化难度选择
function initDifficultySelection() {
    document.querySelectorAll('#upload-modal .difficulty-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#upload-modal .difficulty-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            document.getElementById('project-difficulty').value = option.dataset.value;
        });
    });

    document.querySelectorAll('#edit-modal .difficulty-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#edit-modal .difficulty-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            document.getElementById('edit-project-difficulty').value = option.dataset.value;
        });
    });

    document.querySelector('.difficulty-option[data-value="1"]').classList.add('selected');
}

// 初始化图片上传预览
function initImagePreview() {
    const imageInput = document.getElementById('project-image');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const uploadPreview = document.getElementById('upload-preview');
    const previewImage = document.getElementById('preview-image');
    const removeImageBtn = document.getElementById('remove-image-btn');

    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    previewImage.src = event.target.result;
                    uploadPlaceholder.style.display = 'none';
                    uploadPreview.style.display = 'flex';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            imageInput.value = '';
            previewImage.src = '';
            uploadPreview.style.display = 'none';
            uploadPlaceholder.style.display = 'flex';
        });
    }
}

// 添加事件监听器
function addEventListeners() {
    // 分栏切换
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            saveCurrencyToLocalStorage();
            renderBoxes();
            updateWarehouseCount();
        });
    });

    // 上传表单提交
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const boxIndex = parseInt(e.target.dataset.boxIndex);
        const imageFile = document.getElementById('project-image').files[0];
        const description = document.getElementById('project-description').value;
        const category = document.getElementById('project-category').value;
        const difficulty = document.getElementById('project-difficulty').value;
        const achievementName = document.getElementById('achievement-name').value;

        if (description.length < 25) {
            alert('项目描述不少于25字');
            return;
        }

        if (!imageFile) {
            alert('请上传项目图片');
            return;
        }

        try {
            const imageDataUrl = await handleImageUpload(imageFile);

            // 发送到服务器
            const response = await fetch(`${API_BASE}/api/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    boxIndex: boxIndex,
                    title: achievementName,
                    description: description,
                    category: category,
                    difficulty: difficulty,
                    imageData: imageDataUrl,
                    imageName: imageFile.name
                })
            });

            if (response.ok) {
                const result = await response.json();
                const newProject = result.project;

                // 添加到本地数组
                projects.push(newProject);

                // 发放奖励
                switch (difficulty) {
                    case '1':
                        coins += 10;
                        break;
                    case '2':
                        coins += 20;
                        break;
                    case '3':
                        diamonds += 1;
                        break;
                }

                // 添加到成就列表
                const achievement = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    projectId: newProject.id,
                    name: achievementName,
                    date: new Date().toLocaleString()
                };
                achievements.push(achievement);

                saveCurrencyToLocalStorage();
                renderBoxes();
                updateCurrencyDisplay();
                updateWarehouseCount();
                updateAchievementButtonCount();
                closeUploadModal();

                showSuccessNotification(`🎉 成就 "${achievementName}" 已保存！`);
            } else {
                alert('保存失败，请重试');
            }
        } catch (error) {
            console.error('上传失败:', error);
            alert('上传失败，请检查网络连接');
        }
    });

    // 编辑表单提交
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const projectId = document.getElementById('edit-index').value;
        const description = document.getElementById('edit-project-description').value;
        const category = document.getElementById('edit-project-category').value;
        const difficulty = document.getElementById('edit-project-difficulty').value;
        const achievementName = document.getElementById('edit-achievement-name').value;
        const imageFile = document.getElementById('edit-project-image').files[0];

        if (description.length < 25) {
            alert('项目描述不少于25字');
            return;
        }

        try {
            const project = projects.find(p => p.id === projectId);
            if (!project) return;

            const updates = {
                description: description,
                category: category,
                difficulty: difficulty,
                title: achievementName
            };

            // 如果上传了新图片
            if (imageFile) {
                const imageDataUrl = await handleImageUpload(imageFile);
                updates.imageData = imageDataUrl;
                updates.imageName = imageFile.name;
            }

            // 发送到服务器
            const response = await fetch(`${API_BASE}/api/projects/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: projectId,
                    category: project.category || 'others',
                    updates: updates
                })
            });

            if (response.ok) {
                const result = await response.json();
                const updatedProject = result.project;

                // 更新本地数组
                const index = projects.findIndex(p => p.id === projectId);
                if (index !== -1) {
                    projects[index] = updatedProject;
                }

                // 更新成就名称
                const achievement = achievements.find(a => a.projectId === projectId);
                if (achievement) {
                    achievement.name = achievementName;
                }

                saveCurrencyToLocalStorage();
                renderBoxes();
                updateWarehouseCount();
                closeEditModal();

                showSuccessNotification('💾 修改已保存！');
            } else {
                alert('更新失败，请重试');
            }
        } catch (error) {
            console.error('更新失败:', error);
            alert('更新失败，请检查网络连接');
        }
    });

    // 取消按钮
    document.getElementById('cancel-btn').addEventListener('click', closeUploadModal);
    document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
    document.getElementById('close-achievement-btn').addEventListener('click', closeAchievementModal);

    // 成就按钮
    achievementBtn.addEventListener('click', openAchievementModal);

    // 添加盒子按钮
    addBoxBtn.addEventListener('click', () => {
        boxCount += 5;
        saveCurrencyToLocalStorage();
        renderBoxes();
        updateWarehouseCount();
    });

    // 货币点击特效
    coinContainer.addEventListener('click', () => {
        createParticleEffect(coinContainer, 'coin');
    });

    diamondContainer.addEventListener('click', () => {
        createParticleEffect(diamondContainer, 'diamond');
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === uploadModal) closeUploadModal();
        if (e.target === editModal) closeEditModal();
        if (e.target === achievementModal) closeAchievementModal();
    });
}

// 显示成功提示
function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(180deg, #4a9ad9 0%, #2a7ab9 100%);
        color: white;
        padding: 15px 30px;
        border-radius: 25px;
        font-weight: bold;
        font-size: 16px;
        box-shadow: 0 5px 20px rgba(0, 150, 255, 0.4);
        z-index: 2000;
        animation: slideDown 0.5s ease;
        border: 2px solid #6abaff;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideUp 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 2000);
}

// 初始化无限滚动
function initInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
            boxCount += 5;
            saveCurrencyToLocalStorage();
            renderBoxes();
            updateWarehouseCount();
        }
    });
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        0% {
            transform: translateX(-50%) translateY(-100px);
            opacity: 0;
        }
        100% {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }

    @keyframes slideUp {
        0% {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        100% {
            transform: translateX(-50%) translateY(-100px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 初始化应用
init();
