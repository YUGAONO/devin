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
                 @change="handleFileSelect" 
                 class="file-input" />
          
          <div v-if="!selectedFile" class="upload-placeholder">
            <div class="upload-icon">📁</div>
            <h3>写真を選択またはドラッグ&ドロップ</h3>
            <p>JPG, PNG, GIF形式に対応</p>
            <button type="button" class="btn">ファイルを選択</button>
          </div>
          
          <div v-if="selectedFile" class="file-preview">
            <img v-if="previewUrl" :src="previewUrl" alt="Preview" class="preview-image" />
            <div class="file-info">
              <h4>{{ selectedFile.name }}</h4>
              <p>{{ formatFileSize(selectedFile.size) }}</p>
              <button @click.stop="removeFile" class="btn btn-secondary">削除</button>
            </div>
          </div>
        </div>
        
        <div v-if="selectedFile" class="upload-options">
          <div class="form-group">
            <label for="uploadedBy" class="form-label">アップロード者</label>
            <select v-model="uploadedBy" id="uploadedBy" class="input">
              <option value="User1">パートナー1</option>
              <option value="User2">パートナー2</option>
            </select>
          </div>
          
          <button @click="uploadPhoto" 
                  :disabled="photosStore.loading || !selectedFile" 
                  class="btn upload-btn">
            <span v-if="photosStore.loading">アップロード中...</span>
            <span v-else>📤 アップロード</span>
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
    
    const selectedFile = ref(null)
    const previewUrl = ref(null)
    const uploadedBy = ref('User1')
    const isDragOver = ref(false)
    const successMessage = ref('')
    const fileInput = ref(null)

    const recentPhotos = computed(() => {
      return photosStore.photos.slice(0, 6)
    })

    onMounted(() => {
      console.log('Upload component mounted')
      console.log('fileInput ref on mount:', fileInput.value)
      console.log('selectedFile ref on mount:', selectedFile.value)
      console.log('previewUrl ref on mount:', previewUrl.value)
      photosStore.fetchPhotos()
    })

    const triggerFileInput = () => {
      console.log('triggerFileInput called')
      console.log('fileInput.value:', fileInput.value)
      if (fileInput.value) {
        console.log('Calling click() on file input')
        fileInput.value.click()
      } else {
        console.error('fileInput.value is null or undefined')
        alert('ファイル入力の初期化に問題があります。ページを再読み込みしてください。')
      }
    }

    const handleFileSelect = (event) => {
      console.log('handleFileSelect triggered', event)
      console.log('event.target:', event.target)
      console.log('event.target.files:', event.target.files)
      console.log('event.target.files.length:', event.target.files?.length)
      
      const file = event.target.files[0]
      console.log('Selected file:', file)
      
      if (file) {
        console.log('File details:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        })
        setSelectedFile(file)
      } else {
        console.log('No file selected or files array is empty')
      }
    }

    const handleDrop = (event) => {
      event.preventDefault()
      isDragOver.value = false
      
      const files = event.dataTransfer.files
      if (files.length > 0) {
        setSelectedFile(files[0])
      }
    }

    const setSelectedFile = (file) => {
      console.log('setSelectedFile called with:', file)
      console.log('File type check:', file.type, 'starts with image:', file.type.startsWith('image/'))
      
      if (!file.type.startsWith('image/')) {
        console.log('File is not an image, showing alert')
        alert('画像ファイルを選択してください')
        return
      }
      
      console.log('Setting selectedFile.value to file')
      selectedFile.value = file
      console.log('selectedFile.value after setting:', selectedFile.value)
      
      console.log('Creating FileReader for preview')
      const reader = new FileReader()
      
      reader.onload = (e) => {
        console.log('FileReader onload triggered')
        console.log('Result type:', typeof e.target.result)
        console.log('Result length:', e.target.result?.length)
        previewUrl.value = e.target.result
        console.log('previewUrl.value set successfully')
      }
      
      reader.onerror = (e) => {
        console.error('FileReader error:', e)
        alert('ファイルプレビューの生成に失敗しました: ' + e.target.error)
        previewUrl.value = null
      }
      
      reader.onloadstart = () => {
        console.log('FileReader started reading file')
      }
      
      reader.onloadend = () => {
        console.log('FileReader finished reading file')
      }
      
      console.log('Calling reader.readAsDataURL')
      reader.readAsDataURL(file)
    }

    const removeFile = () => {
      selectedFile.value = null
      previewUrl.value = null
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }

    const uploadPhoto = async () => {
      if (!selectedFile.value) return
      
      try {
        await photosStore.uploadPhoto(selectedFile.value, uploadedBy.value)
        successMessage.value = '写真が正常にアップロードされました！'
        removeFile()
        
        setTimeout(() => {
          successMessage.value = ''
          router.push('/')
        }, 2000)
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
      selectedFile,
      previewUrl,
      uploadedBy,
      isDragOver,
      successMessage,
      fileInput,
      recentPhotos,
      triggerFileInput,
      handleFileSelect,
      handleDrop,
      removeFile,
      uploadPhoto,
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
