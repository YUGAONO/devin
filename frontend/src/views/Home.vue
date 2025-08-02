<template>
  <div class="home">
    <div class="search-section">
      <h2 class="section-title">撮影日で写真を検索</h2>
      <div class="search-form">
        <div class="search-row">
          <select v-model="searchFilters.yearsAgo" class="input search-select">
            <option value="">年数を選択</option>
            <option value="1">1年前</option>
            <option value="2">2年前</option>
            <option value="3">3年前</option>
            <option value="4">4年前</option>
            <option value="5">5年前</option>
          </select>
          
          <select v-model="searchFilters.month" class="input search-select">
            <option value="">月を選択</option>
            <option value="1">1月</option>
            <option value="2">2月</option>
            <option value="3">3月</option>
            <option value="4">4月</option>
            <option value="5">5月</option>
            <option value="6">6月</option>
            <option value="7">7月</option>
            <option value="8">8月</option>
            <option value="9">9月</option>
            <option value="10">10月</option>
            <option value="11">11月</option>
            <option value="12">12月</option>
          </select>
          
          <button @click="searchPhotos" class="btn search-btn">検索</button>
          <button @click="clearSearch" class="btn btn-secondary">クリア</button>
        </div>
      </div>
    </div>

    <div v-if="photosStore.loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div v-if="photosStore.error" class="error">
      {{ photosStore.error }}
    </div>

    <div v-if="!photosStore.loading && photosStore.photos.length === 0" class="empty-state">
      <div class="empty-content">
        <div class="empty-icon">📸</div>
        <h3>まだ写真がありません</h3>
        <p>最初の思い出を共有しましょう！</p>
        <router-link to="/upload" class="btn">写真をアップロード</router-link>
      </div>
    </div>

    <!-- 最新アップロード写真カルーセル -->
    <div v-if="photosStore.photos.length > 0" class="carousel-section small-carousel">
      <h3 class="section-title">最新アップロード写真</h3>
      <div class="carousel-wrapper">
        <div class="carousel">
          <div v-for="(photo, idx) in carouselPhotos" :key="photo.id" :class="['carousel-item', { active: idx === carouselIndex }]">
            <img :src="`${apiBaseUrl}${photo.url}`" :alt="photo.originalName" class="carousel-image" />
            <div class="carousel-info">
              <span>{{ formatDate(photo.captureDate || photo.uploadedAt) }}</span>
              <span>{{ photo.uploadedBy }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="photosStore.photos.length > 0" class="photos-grid">
      <div v-for="photo in photosStore.photos" :key="photo.id" class="photo-card card">
        <div class="photo-container">
          <img :src="`${apiBaseUrl}${photo.url}`" :alt="photo.originalName" class="photo-image" />
        </div>
        
        <div class="capture-date-display">
          <div v-if="photo.captureDate !== photo.uploadedAt" class="actual-capture-date">
            撮影日: {{ formatDate(photo.captureDate) }}
          </div>
          <div v-else class="no-exif-date">
            撮影日: わかんない~ (アップロード日: {{ formatDate(photo.uploadedAt) }})
          </div>
        </div>
        
        <div class="photo-info">
          <div class="photo-meta">
            <span class="capture-date">{{ formatDate(photo.captureDate || photo.uploadedAt) }}</span>
            <span class="uploaded-by">by {{ photo.uploadedBy }}</span>
          </div>
          
          <div class="photo-actions">
            <button @click="toggleLike(photo.id)" class="action-btn like-btn" :class="{ liked: isLiked(photo.id) }">
              ❤️ {{ photo.likesCount }}
            </button>
            <button @click="toggleComments(photo.id)" class="action-btn comment-btn">
              💬 {{ photo.commentsCount }}
            </button>
            <button @click="deletePhoto(photo.id)" class="action-btn delete-btn">
              🗑️ 削除
            </button>
          </div>
          
          <div v-if="showComments[photo.id]" class="comments-section">
            <div class="add-comment">
              <input 
                v-model="newComments[photo.id]" 
                @keyup.enter="addComment(photo.id)"
                placeholder="コメントを追加..."
                class="input comment-input"
              />
              <button @click="addComment(photo.id)" class="btn comment-submit">送信</button>
            </div>
            
            <div v-if="comments[photo.id]" class="comments-list">
              <div v-for="comment in comments[photo.id]" :key="comment.id" class="comment">
                <strong>{{ comment.userId }}:</strong> {{ comment.text }}
                <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { usePhotosStore } from '../stores/photos'
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'

export default {
  name: 'Home',
  setup() {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '')
    const photosStore = usePhotosStore()
    const searchFilters = reactive({
      yearsAgo: '',
      month: ''
    })
    
    const showComments = ref({})
    const comments = ref({})
    const newComments = ref({})
    const likedPhotos = ref(new Set())
    const carouselIndex = ref(0)
    const carouselPhotos = computed(() => photosStore.photos.slice(0, 7))
    let carouselTimer = null
    let lastIndex = ref(0)
    const startCarousel = () => {
      carouselTimer = setInterval(() => {
        lastIndex.value = carouselIndex.value
        carouselIndex.value = (carouselIndex.value + 1) % carouselPhotos.value.length
      }, 2500)
    }
    const stopCarousel = () => {
      if (carouselTimer) clearInterval(carouselTimer)
    }
    onMounted(() => {
      photosStore.fetchPhotos()
      startCarousel()
    })
    onUnmounted(() => {
      stopCarousel()
    })

    const searchPhotos = () => {
      const filters = {}
      if (searchFilters.yearsAgo) filters.yearsAgo = searchFilters.yearsAgo
      if (searchFilters.month) filters.month = searchFilters.month
      
      photosStore.fetchPhotos(filters)
    }

    const clearSearch = () => {
      searchFilters.yearsAgo = ''
      searchFilters.month = ''
      photosStore.fetchPhotos()
    }

    const toggleLike = async (photoId) => {
      await photosStore.toggleLike(photoId)
      if (likedPhotos.value.has(photoId)) {
        likedPhotos.value.delete(photoId)
      } else {
        likedPhotos.value.add(photoId)
      }
    }

    const isLiked = (photoId) => {
      return likedPhotos.value.has(photoId)
    }

    const toggleComments = async (photoId) => {
      if (showComments.value[photoId]) {
        showComments.value[photoId] = false
      } else {
        showComments.value[photoId] = true
        if (!comments.value[photoId]) {
          comments.value[photoId] = await photosStore.fetchComments(photoId)
        }
      }
    }

    const addComment = async (photoId) => {
      const text = newComments.value[photoId]
      if (!text || text.trim() === '') return
      
      try {
        const comment = await photosStore.addComment(photoId, text.trim())
        if (!comments.value[photoId]) {
          comments.value[photoId] = []
        }
        comments.value[photoId].push(comment)
        newComments.value[photoId] = ''
      } catch (error) {
        console.error('Failed to add comment:', error)
      }
    }

    const deletePhoto = async (photoId) => {
      if (!confirm('ほんとに消しちゃうの-？')) {
        return
      }
      
      try {
        await photosStore.deletePhoto(photoId)
        showComments.value[photoId] = false
        delete comments.value[photoId]
        delete newComments.value[photoId]
        likedPhotos.value.delete(photoId)
      } catch (error) {
        console.error('Failed to delete photo:', error)
        alert('写真の削除に失敗。なんかミスったかも。')
      }
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return {
      photosStore,
      searchFilters,
      showComments,
      comments,
      newComments,
      likedPhotos,
      searchPhotos,
      clearSearch,
      toggleLike,
      isLiked,
      toggleComments,
      addComment,
      formatDate,
      carouselIndex,
      carouselPhotos,
      apiBaseUrl,
      deletePhoto
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
}

.search-section {
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

.search-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-select {
  flex: 1;
  min-width: 150px;
}

.search-btn {
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-content {
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-content h3 {
  margin-bottom: 0.5rem;
  color: #374151;
}

.empty-content p {
  color: #6b7280;
  margin-bottom: 2rem;
}

.carousel-section {
  margin-bottom: 2rem;
}

.carousel-wrapper {
  display: flex;
  align-items: center;
  position: relative;
}

.carousel {
  flex: 1;
  overflow: hidden;
  border-radius: 12px;
}

.carousel-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.carousel-image {
  width: 100%;
  height: auto;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.carousel-info {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.8);
  border-top: 1px solid #e5e7eb;
  width: 100%;
  text-align: center;
}

.carousel-btn {
  background: #f3f4f6;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.carousel-btn:hover {
  background: #e5e7eb;
}

.carousel-btn:focus {
  outline: none;
}

.carousel-btn:nth-child(1) {
  left: 1rem;
}

.carousel-btn:nth-child(2) {
  right: 1rem;
}

.small-carousel {
  max-width: 500px;
  margin: 0 auto 2rem auto;
}

.small-carousel .carousel-wrapper {
  width: 100%;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.small-carousel .carousel-image {
  max-width: 300px;
  max-height: 300px;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.16);
  transition: transform 0.7s cubic-bezier(.4,0,.2,1), opacity 0.7s cubic-bezier(.4,0,.2,1);
}

.small-carousel .carousel-item {
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.7s cubic-bezier(.4,0,.2,1);
}

.small-carousel .carousel-item.active {
  opacity: 1;
  pointer-events: auto;
}

.small-carousel .carousel-info {
  font-size: 1rem;
  text-align: center;
  margin-top: 0.7rem;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.photo-card {
  overflow: hidden;
}

.photo-container {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
}

.photo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.photo-card:hover .photo-image {
  transform: scale(1.05);
}

.photo-info {
  padding: 1.5rem;
}

.photo-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: #6b7280;
}

.capture-date {
  font-weight: 500;
}

.photo-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.action-btn {
  background: #f3f4f6;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.action-btn:hover {
  background: #e5e7eb;
}

.like-btn.liked {
  background: #fef2f2;
  color: #dc2626;
}

.delete-btn {
  background: #fef2f2;
  color: #dc2626;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #b91c1c;
}

.comments-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.add-comment {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.comment-input {
  flex: 1;
  font-size: 0.9rem;
}

.comment-submit {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.comments-list {
  max-height: 200px;
  overflow-y: auto;
}

.comment {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.9rem;
}

.comment:last-child {
  border-bottom: none;
}

.comment-date {
  display: block;
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.capture-date-display {
  padding: 1rem 1.5rem 0.5rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.actual-capture-date {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2563eb;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.no-exif-date {
  font-size: 0.9rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .search-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-select {
    min-width: auto;
  }
  
  .photos-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .photo-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .photo-actions {
    justify-content: center;
  }
  
  .add-comment {
    flex-direction: column;
  }
  
  .capture-date-display {
    padding: 0.75rem 1rem 0.5rem 1rem;
  }
  
  .actual-capture-date,
  .no-exif-date {
    font-size: 0.85rem;
  }
}
</style>
