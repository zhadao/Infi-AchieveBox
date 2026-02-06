const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { exec } = require('child_process');

const PORT = 8000;

const isPkg = typeof process.pkg !== 'undefined';
const basePath = isPkg ? path.dirname(process.execPath) : __dirname;
const ASSET_DIR = path.join(basePath, 'asset');
const IMAGES_DIR = path.join(ASSET_DIR, 'images');
const ACHIEVE_DIR = path.join(ASSET_DIR, 'achieve');

// 确保目录存在
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

ensureDir(IMAGES_DIR);
ensureDir(ACHIEVE_DIR);

// 获取分类对应的文件名
function getCategoryFile(category) {
    const map = {
        'others': 'achieve-other.json',
        'ugui': 'achieve-ugui.json',
        'effects': 'achieve-action.json'
    };
    return path.join(ACHIEVE_DIR, map[category] || map['others']);
}

// 生成规范化的图片文件名
function generateImageName(category, projectId, originalName) {
    const ext = path.extname(originalName) || '.png';
    const timestamp = Date.now();
    return `${category}_${projectId}_${timestamp}${ext}`;
}

// 读取JSON文件
function readJsonFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('读取JSON失败:', e);
    }
    return [];
}

// 写入JSON文件
function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('写入JSON失败:', e);
        return false;
    }
}

// 保存Base64图片
function saveBase64Image(base64Data, fileName) {
    try {
        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Content, 'base64');
        const filePath = path.join(IMAGES_DIR, fileName);
        fs.writeFileSync(filePath, buffer);
        return `asset/images/${fileName}`;
    } catch (e) {
        console.error('保存图片失败:', e);
        return null;
    }
}

// 删除图片文件
function deleteImage(imagePath) {
    try {
        const fullPath = path.join(basePath, imagePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (e) {
        console.error('删除图片失败:', e);
    }
}

// 处理CORS
function setCORS(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const server = http.createServer((req, res) => {
    setCORS(res);

    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // API路由
    if (pathname === '/api/projects') {
        handleProjects(req, res);
        return;
    }

    if (pathname === '/api/projects/delete') {
        handleDeleteProject(req, res);
        return;
    }

    if (pathname === '/api/projects/update') {
        handleUpdateProject(req, res);
        return;
    }

    if (pathname === '/api/all-projects') {
        handleGetAllProjects(req, res);
        return;
    }

    // 静态文件服务
    serveStaticFile(req, res, pathname);
});

// 处理获取所有项目
function handleGetAllProjects(req, res) {
    if (req.method !== 'GET') {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    const allProjects = [];
    const categories = ['others', 'ugui', 'effects'];
    
    categories.forEach(category => {
        const filePath = getCategoryFile(category);
        const projects = readJsonFile(filePath);
        allProjects.push(...projects);
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(allProjects));
}

// 处理项目增删改
function handleProjects(req, res) {
    if (req.method === 'GET') {
        // 获取指定分类的项目
        const category = parsedUrl.query.category || 'others';
        const filePath = getCategoryFile(category);
        const projects = readJsonFile(filePath);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(projects));
        return;
    }

    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const category = data.category || 'others';
                const filePath = getCategoryFile(category);
                
                // 读取现有项目
                const projects = readJsonFile(filePath);
                
                // 生成项目ID
                const projectId = Date.now().toString();
                
                // 保存图片
                let imagePath = '';
                if (data.imageData) {
                    const imageName = generateImageName(category, projectId, data.imageName || 'image.png');
                    imagePath = saveBase64Image(data.imageData, imageName);
                }
                
                // 创建新项目
                const newProject = {
                    id: projectId,
                    boxIndex: data.boxIndex || 0,
                    title: data.title,
                    description: data.description,
                    category: category,
                    difficulty: data.difficulty,
                    image: imagePath,
                    imageName: data.imageName || '',
                    date: new Date().toISOString()
                };
                
                projects.push(newProject);
                
                // 保存到文件
                if (writeJsonFile(filePath, projects)) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, project: newProject }));
                } else {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: '保存失败' }));
                }
            } catch (e) {
                console.error('处理POST请求失败:', e);
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid data' }));
            }
        });
    }
}

// 处理删除项目
function handleDeleteProject(req, res) {
    if (req.method !== 'POST') {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            const { projectId, category } = data;
            
            const filePath = getCategoryFile(category);
            const projects = readJsonFile(filePath);
            
            // 找到要删除的项目
            const project = projects.find(p => p.id === projectId);
            if (project && project.image) {
                deleteImage(project.image);
            }
            
            // 过滤掉要删除的项目
            const updatedProjects = projects.filter(p => p.id !== projectId);
            
            if (writeJsonFile(filePath, updatedProjects)) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } else {
                res.writeHead(500);
                res.end(JSON.stringify({ error: '删除失败' }));
            }
        } catch (e) {
            console.error('删除项目失败:', e);
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid data' }));
        }
    });
}

// 处理更新项目
function handleUpdateProject(req, res) {
    if (req.method !== 'POST') {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            const { projectId, category, updates } = data;
            
            const filePath = getCategoryFile(category);
            const projects = readJsonFile(filePath);
            
            const projectIndex = projects.findIndex(p => p.id === projectId);
            if (projectIndex === -1) {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Project not found' }));
                return;
            }
            
            // 如果有新图片，保存并删除旧图片
            if (updates.imageData) {
                const oldImage = projects[projectIndex].image;
                if (oldImage) {
                    deleteImage(oldImage);
                }
                const imageName = generateImageName(category, projectId, updates.imageName || 'image.png');
                updates.image = saveBase64Image(updates.imageData, imageName);
                delete updates.imageData;
                delete updates.imageName;
            }
            
            // 更新项目
            projects[projectIndex] = { ...projects[projectIndex], ...updates };
            
            if (writeJsonFile(filePath, projects)) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, project: projects[projectIndex] }));
            } else {
                res.writeHead(500);
                res.end(JSON.stringify({ error: '更新失败' }));
            }
        } catch (e) {
            console.error('更新项目失败:', e);
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Invalid data' }));
        }
    });
}

// 静态文件服务
function serveStaticFile(req, res, pathname) {
    let filePath = path.join(basePath, pathname === '/' ? 'index.html' : pathname);
    
    const ext = path.extname(filePath);
    const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`图片存储目录: ${IMAGES_DIR}`);
    console.log(`数据存储目录: ${ACHIEVE_DIR}`);
    
    const url = `http://localhost:${PORT}`;
    
    if (isPkg) {
        console.log('\n=========================================');
        console.log('     🏆 Achievement Box Started!');
        console.log('=========================================');
        console.log(`Access: ${url}`);
        console.log('=========================================\n');
        
        setTimeout(() => {
            const startCommand = process.platform === 'win32' ? 'start' : 
                                process.platform === 'darwin' ? 'open' : 'xdg-open';
            exec(`${startCommand} ${url}`, (err) => {
                if (err) console.error('Failed to open browser:', err);
            });
        }, 1000);
    }
});
