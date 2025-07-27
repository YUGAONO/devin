<template>
  <div class="upload">
    <div class="upload-container">
      <h2 class="section-title">📸 写真をアップロード</h2>
      
      <div v-if="photosStore.error" class="error">
        {{ photosStore.error }}
      </div>
      
      <div v-if="successMessage" class="success">
        {{ successMessage }}
      </div>
      
      <div class="upload-form">
        <div class="file-upload-area" :class="{ 'drag-over': isDragOver }" 
             @drop="handleDrop" 
             @dragover.prevent="isDragOver = true" 
             @dragleave="isDragOver = false"
             @click="triggerFileInput">
          
          <input ref="fileInput" 
                 type="file" 
                 accept="image/*" 
                 multiple
                 @change="handleFileSelect" 
                 class="file-input" />
          
          
          <div v-if="selectedFiles.length === 0" class="upload-placeholder">
            <div class="upload-icon">📁</div>
            <h3>写真を選択またはドラッグ&ドロップ</h3>

            <p>JPG, PNG, GIF, WEBP, HEIC形式に対応</p>
            <button type="button" class="btn">ファイルを選択</button>

          </div>
          
          <div v-if="selectedFiles.length > 0" class="files-preview">
            <div class="files-header">
              <h4>選択された写真 ({{ selectedFiles.length }}枚)</h4>
              <button @click="removeAllFiles" class="btn btn-secondary">すべて削除</button>
            </div>
            <div class="files-grid">
              <div v-for="(file, index) in selectedFiles" :key="index" class="file-preview-item">
                <img v-if="file.previewUrl" :src="file.previewUrl" alt="Preview" class="preview-image-small" />
                <div class="file-info-small">
                  <p class="file-name">{{ file.name }}</p>
                  <p class="file-size">{{ formatFileSize(file.size) }}</p>
                  <button @click="removeFile(index)" class="btn-remove">×</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="selectedFiles.length > 0" class="upload-options">
          <div class="form-group">
            <label for="uploadedBy" class="form-label">アップロード者</label>
            <select v-model="uploadedBy" id="uploadedBy" class="input">
              <option value="ソヒョン">ソヒョン</option>
              <option value="ゆうが">ゆうが</option>
            </select>
          </div>
          
          <button @click="uploadPhotos" 
                  :disabled="photosStore.loading || selectedFiles.length === 0" 
                  class="btn upload-btn">
            <span v-if="photosStore.loading">アップロード中...</span>
            <span v-else>📤 {{ selectedFiles.length }}枚をアップロード</span>
          </button>
        </div>
      </div>
      
      <div v-if="photosStore.loading" class="loading">
        <div class="spinner"></div>
        <p>写真をアップロード中...</p>
      </div>
    </div>
    
    <div class="recent-uploads">
      <h3 class="section-title">最近のアップロード</h3>
      <div v-if="recentPhotos.length === 0" class="empty-recent">
        <p>まだアップロードされた写真がありません</p>
      </div>
      <div v-else class="recent-grid">
        <div v-for="photo in recentPhotos" :key="photo.id" class="recent-photo card">
          <img :src="`http://localhost:3000${photo.url}`" :alt="photo.originalName" class="recent-image" />
          <div class="recent-info">
            <span class="recent-date">{{ formatDate(photo.captureDate || photo.uploadedAt) }}</span>
            <span class="recent-uploader">{{ photo.uploadedBy }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { usePhotosStore } from '../stores/photos'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'Upload',
  setup() {
    const photosStore = usePhotosStore()
    const router = useRouter()
    
    const selectedFiles = ref([])
    const uploadedBy = ref('ソヒョン')
    const isDragOver = ref(false)
    const successMessage = ref('')
    const fileInput = ref(null)

    const recentPhotos = computed(() => {
      return photosStore.photos.slice(0, 6)
    })

    onMounted(() => {
      photosStore.fetchPhotos()
    })

    const triggerFileInput = () => {

      try {
        if (fileInput.value) {
          fileInput.value.click()
        } else {
          const fileInputElement = document.querySelector('input[type="file"]')
          if (fileInputElement) {
            fileInputElement.click()
          } else {
            alert('ファイル選択機能に問題があります。ページを再読み込みしてください。')
          }
        }
      } catch (error) {
        console.error('Error in triggerFileInput:', error)
        alert('ファイル選択でエラーが発生しました: ' + error.message)

      }
    }


    const handleFileSelect = (event) => {
      const files = Array.from(event.target.files)
      if (files.length > 0) {
        setSelectedFiles(files)
      }
    }


    const handleDrop = (event) => {
      event.preventDefault()
      isDragOver.value = false
      
      const files = Array.from(event.dataTransfer.files)
      if (files.length > 0) {
        setSelectedFiles(files)
      }
    }


    const isImageFile = (file) => {
      // First check MIME type if available
      if (file.type && file.type.startsWith('image/')) {
        return true
      }
      
      // Fallback to file extension check for files with missing/empty MIME type
      const fileName = file.name.toLowerCase()
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp', '.svg', '.tiff', '.tif']
      
      return imageExtensions.some(ext => fileName.endsWith(ext))
    }

    const setSelectedFiles = (files) => {
      // 画像ファイルのみ抽出
      const imageFiles = files.filter(isImageFile)
      if (imageFiles.length !== files.length) {
        alert(`${files.length - imageFiles.length}個の非画像ファイルがスキップされました`)
      }
      const filesWithPreviews = imageFiles.map(file => {
        const fileObj = { previewUrl: null, originalFile: file, name: file.name, size: file.size }
        const reader = new FileReader()
        reader.onload = (e) => {
          fileObj.previewUrl = e.target.result
        }
        reader.readAsDataURL(file)
        return fileObj
      })
      selectedFiles.value = filesWithPreviews
    }

    const removeFile = (index) => {
      selectedFiles.value.splice(index, 1)

    }

    const removeAllFiles = () => {
      selectedFiles.value = []
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }

    const uploadPhotos = async () => {
      if (selectedFiles.value.length === 0) return
      try {
        let successCount = 0
        let failCount = 0
        for (const file of selectedFiles.value) {
          try {
            await photosStore.uploadPhoto(file.originalFile || file, uploadedBy.value)
            successCount++
          } catch (error) {
            console.error('Upload failed for file:', file.name, error)
            failCount++
          }
        }
        
        if (failCount === 0) {
          successMessage.value = `${successCount}枚の写真が正常にアップロードされました！`
        } else {
          successMessage.value = `${successCount}枚成功、${failCount}枚失敗しました`
        }
        
        removeAllFiles()
        
        setTimeout(() => {
          successMessage.value = ''
          router.push('/')
        }, 3000)
      } catch (error) {
        console.error('Upload failed:', error)
      }
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return {
      photosStore,
      selectedFiles,
      uploadedBy,
      isDragOver,
      successMessage,
      fileInput,
      recentPhotos,
      triggerFileInput,
      handleFileSelect,
      handleDrop,
      removeFile,
      removeAllFiles,
      uploadPhotos,
      formatFileSize,
      formatDate
    }
  }
}
</script>

<style scoped>
.upload {
  max-width: 800px;
  margin: 0 auto;
}

.upload-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.section-title {
  margin-bottom: 1.5rem;
  color: #374151;
  font-size: 1.5rem;
  font-weight: 600;
}

.file-upload-area {
  border: 3px dashed #d1d5db;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: #fafafa;
}

.file-upload-area:hover,
.file-upload-area.drag-over {
  border-color: #667eea;
  background: #f0f4ff;
}

.file-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.upload-placeholder {
  color: #6b7280;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-placeholder h3 {
  margin-bottom: 0.5rem;
  color: #374151;
}

.upload-placeholder p {
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.upload-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.files-preview {
  text-align: left;
}

.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.files-header h4 {
  margin: 0;
  color: #374151;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.file-preview-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.preview-image-small {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.file-info-small {
  flex: 1;
  min-width: 0;
  position: relative;
}

.file-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
}

.btn-remove {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  width: 20px;
  height: 20px;
  border: none;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.btn-remove:hover {
  background: #dc2626;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 2rem;
  text-align: left;
}

.preview-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.file-info h4 {
  margin-bottom: 0.5rem;
  color: #374151;
}

.file-info p {
  color: #6b7280;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.upload-options {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.upload-btn {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.recent-uploads {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.empty-recent {
  text-align: center;
  color: #6b7280;
  padding: 2rem;
}

.recent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.recent-photo {
  overflow: hidden;
  transition: transform 0.3s ease;
}

.recent-photo:hover {
  transform: translateY(-2px);
}

.recent-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.recent-info {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.recent-date {
  font-size: 0.8rem;
  color: #6b7280;
}

.recent-uploader {
  font-size: 0.8rem;
  font-weight: 500;
  color: #374151;
}

@media (max-width: 768px) {
  .upload-container {
    padding: 1.5rem;
  }
  
  .file-upload-area {
    padding: 2rem 1rem;
  }
  
  .file-preview {
    flex-direction: column;
    text-align: center;
  }
  
  .recent-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  
  .recent-image {
    height: 100px;
  }
}
</style>
