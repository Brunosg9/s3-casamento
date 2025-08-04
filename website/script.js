var s3Client;

// Configurar AWS SDK
AWS.config.update({
    region: CONFIG.REGION,
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: CONFIG.IDENTITY_POOL_ID
    })
});

s3Client = new AWS.S3();

var selectedFiles = [];
var currentImageIndex = 0;
var touchStartX = 0;
var touchEndX = 0;
var touchStartY = 0;
var touchEndY = 0;

function showPreview() {
    var files = document.getElementById('fileInput').files;
    var preview = document.getElementById('preview');
    preview.innerHTML = '';
    selectedFiles = [];
    
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (!file.type.startsWith('image/')) {
            alert('Apenas upload de fotos é permitido!');
            document.getElementById('fileInput').value = '';
            return;
        }
        selectedFiles.push(file);
    }
    
    selectedFiles.forEach(function(file, index) {
        var reader = new FileReader();
        
        reader.onload = function(e) {
            var container = document.createElement('div');
            container.className = 'preview-container';
            
            var img = document.createElement('img');
            img.src = e.target.result;
            img.style.border = '3px solid #81c7d4';
            
            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'preview-delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.onclick = function() { removeFromPreview(index); };
            
            container.appendChild(img);
            container.appendChild(deleteBtn);
            preview.appendChild(container);
        };
        
        reader.readAsDataURL(file);
    });
}

function removeFromPreview(index) {
    selectedFiles.splice(index, 1);
    updateFileInput();
    showPreview();
}

function updateFileInput() {
    var dt = new DataTransfer();
    selectedFiles.forEach(function(file) {
        dt.items.add(file);
    });
    document.getElementById('fileInput').files = dt.files;
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function uploadPhotos() {
    if (selectedFiles.length === 0) {
        alert('Selecione pelo menos uma foto!');
        return;
    }
    
    showLoading();
    
    var uploadCount = 0;
    var successCount = 0;
    var totalFiles = selectedFiles.length;
    
    for (var i = 0; i < selectedFiles.length; i++) {
        var file = selectedFiles[i];
        
        var key = 'photos/' + Date.now() + '-' + Math.random().toString(36).substr(2, 5) + '-' + file.name;
        var params = {
            Bucket: CONFIG.BUCKET_NAME,
            Key: key,
            Body: file,
            ContentType: file.type
        };
        
        s3Client.upload(params, function(err, data) {
            uploadCount++;
            
            if (!err) {
                successCount++;
            }
            
            if (uploadCount === totalFiles) {
                hideLoading();
                alert(successCount + ' foto(s) enviadas');
                document.getElementById('fileInput').value = '';
                document.getElementById('preview').innerHTML = '';
                selectedFiles = [];
                loadPhotos();
            }
        });
    }
}

function loadPhotos() {
    if (!s3Client) {
        return;
    }
    
    var params = {
        Bucket: CONFIG.BUCKET_NAME,
        Prefix: 'photos/'
    };
    
    s3Client.listObjects(params, function(err, data) {
        if (err) {
            return;
        }
        
        var gallery = document.getElementById('gallery');
        gallery.innerHTML = '';
        
        if (data.Contents) {
            data.Contents.sort(function(a, b) {
                return new Date(b.LastModified) - new Date(a.LastModified);
            });
            
            window.allImages = [];
            
            data.Contents.forEach(function(obj, index) {
                if (obj.Key.endsWith('.jpg') || obj.Key.endsWith('.jpeg') || obj.Key.endsWith('.png')) {
                    var imgSrc = 'https://' + CONFIG.BUCKET_NAME + '.s3.' + CONFIG.REGION + '.amazonaws.com/' + obj.Key;
                    window.allImages.push(imgSrc);
                    
                    // Container para imagem + botão
                    var container = document.createElement('div');
                    container.style.position = 'relative';
                    container.style.display = 'inline-block';
                    
                    var img = document.createElement('img');
                    img.src = imgSrc;
                    img.style.cursor = 'pointer';
                    img.onclick = function() { openModal(imgSrc, index); };
                    
                    // Botão de download
                    var downloadBtn = document.createElement('button');
                    downloadBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 16L7 11L8.4 9.6L11 12.2V4H13V12.2L15.6 9.6L17 11L12 16Z" fill="currentColor"/>
                            <path d="M5 20V18H19V20H5Z" fill="currentColor"/>
                        </svg>
                    `;
                    downloadBtn.style.cssText = `
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        background: rgba(0,0,0,0.7);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 32px;
                        height: 32px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        opacity: 0;
                        transition: all 0.3s ease;
                        z-index: 10;
                    `;
                    
                    // Hover effects
                    container.onmouseenter = function() {
                        downloadBtn.style.opacity = '1';
                    };
                    container.onmouseleave = function() {
                        downloadBtn.style.opacity = '0';
                    };
                    
                    downloadBtn.onclick = function(e) {
                        e.stopPropagation();
                        downloadPhoto(imgSrc, index);
                    };
                    
                    downloadBtn.onmouseenter = function() {
                        this.style.background = 'rgba(0,0,0,0.9)';
                        this.style.transform = 'scale(1.1)';
                    };
                    
                    downloadBtn.onmouseleave = function() {
                        this.style.background = 'rgba(0,0,0,0.7)';
                        this.style.transform = 'scale(1)';
                    };
                    
                    container.appendChild(img);
                    container.appendChild(downloadBtn);
                    gallery.appendChild(container);
                }
            });
        }
    });
}

function updateProgress() {
    var total = window.allImages ? window.allImages.length : 1;
    var current = currentImageIndex + 1;
    
    document.getElementById('pageCounter').textContent = current + '/' + total;
    
    var progressPercent = total > 1 ? (currentImageIndex / (total - 1)) * 100 : 0;
    document.getElementById('progressFill').style.width = progressPercent + '%';
    
    var galleryNav = document.getElementById('galleryNav');
    if (total > 1) {
        galleryNav.style.display = 'flex';
    } else {
        galleryNav.style.display = 'none';
    }
}

function clickProgress(event) {
    if (!window.allImages || window.allImages.length <= 1) return;
    
    var progressBar = event.currentTarget;
    var rect = progressBar.getBoundingClientRect();
    var clickX = event.clientX - rect.left;
    var progressWidth = rect.width;
    var clickPercent = clickX / progressWidth;
    
    var targetIndex = Math.round(clickPercent * (window.allImages.length - 1));
    targetIndex = Math.max(0, Math.min(targetIndex, window.allImages.length - 1));
    
    goToImage(targetIndex);
}

function goToImage(index) {
    if (window.allImages && index >= 0 && index < window.allImages.length) {
        currentImageIndex = parseInt(index);
        document.getElementById('modalImage').src = window.allImages[currentImageIndex];
        updateProgress();
    }
}

function openModal(imgSrc, index) {
    currentImageIndex = index || 0;
    document.getElementById('photoModal').style.display = 'block';
    document.getElementById('modalImage').src = imgSrc;
    document.body.classList.add('modal-open');
    updateProgress();
    initTouchEvents();
}

function initTouchEvents() {
    var slider = document.getElementById('imageSlider');
    
    slider.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    slider.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });
    
    var isMouseDown = false;
    var mouseStartX = 0;
    
    slider.addEventListener('mousedown', function(e) {
        isMouseDown = true;
        mouseStartX = e.clientX;
        slider.style.cursor = 'grabbing';
    });
    
    slider.addEventListener('mousemove', function(e) {
        if (!isMouseDown) return;
        e.preventDefault();
    });
    
    slider.addEventListener('mouseup', function(e) {
        if (!isMouseDown) return;
        isMouseDown = false;
        slider.style.cursor = 'grab';
        
        var deltaX = e.clientX - mouseStartX;
        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0 && window.allImages && currentImageIndex > 0) {
                goToImage(currentImageIndex - 1);
            } else if (deltaX < 0 && window.allImages && currentImageIndex < window.allImages.length - 1) {
                goToImage(currentImageIndex + 1);
            }
        }
    });
    
    slider.addEventListener('mouseleave', function() {
        isMouseDown = false;
        slider.style.cursor = 'grab';
    });
}

function handleSwipe() {
    var deltaX = touchEndX - touchStartX;
    var deltaY = touchEndY - touchStartY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
            if (window.allImages && currentImageIndex > 0) {
                goToImage(currentImageIndex - 1);
            }
        } else {
            if (window.allImages && currentImageIndex < window.allImages.length - 1) {
                goToImage(currentImageIndex + 1);
            }
        }
    }
}

function closeModal() {
    document.getElementById('photoModal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

window.onclick = function(event) {
    var modal = document.getElementById('photoModal');
    if (event.target == modal) {
        closeModal();
    }
}

document.addEventListener('keydown', function(e) {
    if (document.getElementById('photoModal').style.display === 'block') {
        if (e.key === 'ArrowLeft' && window.allImages && currentImageIndex > 0) {
            goToImage(currentImageIndex - 1);
        } else if (e.key === 'ArrowRight' && window.allImages && currentImageIndex < window.allImages.length - 1) {
            goToImage(currentImageIndex + 1);
        } else if (e.key === 'Escape') {
            closeModal();
        }
    }
});

window.onload = function() {
    loadPhotos();
};

// Função para mostrar imagem em tela cheia para download manual no mobile
function showImageForDownload(imageUrl, fileName) {
    // Criar overlay de download
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;
    
    // Criar imagem
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
        max-width: 90%;
        max-height: 70%;
        object-fit: contain;
        border-radius: 10px;
    `;
    
    // Criar instruções com imagem de exemplo
    const instructions = document.createElement('div');
    instructions.style.cssText = `
        color: white;
        text-align: center;
        margin-top: 20px;
        font-size: 16px;
        line-height: 1.4;
        max-width: 90%;
    `;
    instructions.innerHTML = `
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; margin: 10px 0; backdrop-filter: blur(10px);">
            <p style="font-size: 18px; margin-bottom: 15px; color: #4CAF50;"><strong>📸 Como salvar a foto:</strong></p>
            
            <div style="display: flex; align-items: center; justify-content: flex-start; margin: 15px 0; text-align: left;">
                <div style="background: linear-gradient(45deg, #4CAF50, #45a049); color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">1</div>
                <p style="margin: 0; font-size: 16px;">Pressione e segure a imagem acima ☝️</p>
            </div>
            
            <div style="display: flex; align-items: center; justify-content: flex-start; margin: 15px 0; text-align: left;">
                <div style="background: linear-gradient(45deg, #4CAF50, #45a049); color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">2</div>
                <p style="margin: 0; font-size: 16px;">Aparecerá um menu como este:</p>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
                <img src="exemplo de download.jpg" style="max-width: 280px; width: 100%; border-radius: 12px; border: 3px solid #4CAF50; box-shadow: 0 6px 12px rgba(0,0,0,0.4); transition: transform 0.3s ease;" alt="Exemplo de download">
            </div>
            
            <div style="display: flex; align-items: center; justify-content: flex-start; margin: 15px 0; text-align: left;">
                <div style="background: linear-gradient(45deg, #4CAF50, #45a049); color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">3</div>
                <p style="margin: 0; font-size: 16px;">Toque em <strong style="color: #4CAF50;">"Salvar na galeria"</strong> ✅</p>
            </div>
        </div>
        
        <p style="margin-top: 20px; font-size: 14px; opacity: 0.7; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;">💡 Toque fora da imagem para fechar</p>
    `;
    
    // Botão fechar
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255,255,255,0.9);
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 24px;
        cursor: pointer;
        color: #333;
    `;
    
    // Eventos
    closeBtn.onclick = () => document.body.removeChild(overlay);
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    };
    
    // Montar e exibir
    overlay.appendChild(closeBtn);
    overlay.appendChild(img);
    overlay.appendChild(instructions);
    document.body.appendChild(overlay);
}

// Função para baixar foto individual
function downloadPhoto(imageUrl, index) {
    const fileName = 'foto_casamento_' + (index + 1).toString().padStart(3, '0') + '.jpg';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        showImageForDownload(imageUrl, fileName);
    } else {
        fetch(imageUrl)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            })
            .catch(() => {
                alert('Erro ao baixar foto. Tente novamente.');
            });
    }
}

