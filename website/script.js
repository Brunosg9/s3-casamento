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
                    
                    var img = document.createElement('img');
                    img.src = imgSrc;
                    img.style.cursor = 'pointer';
                    img.onclick = function() { openModal(imgSrc, index); };
                    gallery.appendChild(img);
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



// Função para baixar foto individual
function downloadPhoto(imageUrl, index) {
    const fileName = 'foto_casamento_' + (index + 1).toString().padStart(3, '0') + '.jpg';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Mobile: simular clique longo na imagem
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            // Criar elemento temporário para simular clique
            const tempImg = document.createElement('img');
            tempImg.src = imageUrl;
            tempImg.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
            document.body.appendChild(tempImg);
            
            // Simular evento de toque
            const touchEvent = new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [new Touch({
                    identifier: 0,
                    target: tempImg,
                    clientX: 0,
                    clientY: 0
                })]
            });
            
            tempImg.dispatchEvent(touchEvent);
            
            setTimeout(() => {
                document.body.removeChild(tempImg);
                window.open(imageUrl, '_blank');
            }, 100);
        };
        img.onerror = function() {
            // Fallback: abrir diretamente
            window.open(imageUrl, '_blank');
        };
        img.src = imageUrl;
        
        // Mostrar aviso de sucesso
        showSuccessMessage('Imagem aberta! Pressione e segure para salvar 📸');
        
    } else {
        // Desktop: download automático
        fetch(imageUrl)
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                // Mostrar aviso de sucesso
                showSuccessMessage('Foto salva em Downloads! 📸');
            })
            .catch(() => {
                alert('Erro ao baixar foto. Tente novamente.');
            });
    }
}

// Função para mostrar mensagem de sucesso
function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4CAF50;
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        z-index: 10000;
        font-size: 16px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        animation: slideUp 0.3s ease;
    `;
    toast.textContent = message;
    
    // Adicionar animação CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { transform: translateX(-50%) translateY(100px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    // Remover após 3 segundos
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.style.animation = 'slideUp 0.3s ease reverse';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }
    }, 3000);
}

// Função para baixar a foto atual do modal
function downloadCurrentPhoto() {
    if (window.allImages && window.allImages[currentImageIndex]) {
        const imageUrl = window.allImages[currentImageIndex];
        const fileName = 'foto_casamento_' + (currentImageIndex + 1).toString().padStart(3, '0') + '.jpg';
        
        // Detectar se é mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        if (isMobile) {
            // Para mobile: mostrar imagem em tela cheia para download manual
            showImageForDownload(imageUrl, fileName);
        } else {
            // Desktop: download automático
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
                    
                    // Mostrar mensagem de sucesso
                    alert('Foto salva em Downloads! 📸');
                })
                .catch(() => {
                    alert('Erro ao baixar foto. Tente novamente.');
                });
        }
    }
}