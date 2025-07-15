import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000/api'

export const usePhotosStore = defineStore('photos', {
  state: () => ({
    photos: [],
    loading: false,
    error: null,
    currentUser: 'User1'
  }),

  actions: {
    async fetchPhotos(filters = {}) {
      this.loading = true
      this.error = null
      
      try {
        const params = new URLSearchParams()
        if (filters.year) params.append('year', filters.year)
        if (filters.month) params.append('month', filters.month)
        if (filters.yearsAgo) params.append('yearsAgo', filters.yearsAgo)
        
        const response = await axios.get(`${API_BASE_URL}/photos?${params}`)
        this.photos = response.data
      } catch (error) {
        this.error = 'Failed to fetch photos'
        console.error('Error fetching photos:', error)
      } finally {
        this.loading = false
      }
    },

    async uploadPhoto(file, uploadedBy = this.currentUser) {
      this.loading = true
      this.error = null
      
      try {
        const formData = new FormData()
        formData.append('photos', file)
        formData.append('uploadedBy', uploadedBy)
        
        const response = await axios.post(`${API_BASE_URL}/photos`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        if (response.data.photos) {
          response.data.photos.forEach(photo => {
            this.photos.unshift(photo)
          })
          return response.data.photos[0] // Return first photo for compatibility
        } else {
          this.photos.unshift(response.data)
          return response.data
        }
      } catch (error) {
        this.error = 'Failed to upload photo'
        console.error('Error uploading photo:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async toggleLike(photoId) {
      try {
        const response = await axios.post(`${API_BASE_URL}/photos/${photoId}/like`, {
          userId: this.currentUser
        })
        
        const photoIndex = this.photos.findIndex(p => p.id === photoId)
        if (photoIndex !== -1) {
          if (response.data.liked) {
            this.photos[photoIndex].likesCount++
          } else {
            this.photos[photoIndex].likesCount--
          }
        }
        
        return response.data
      } catch (error) {
        this.error = 'Failed to toggle like'
        console.error('Error toggling like:', error)
      }
    },

    async addComment(photoId, text) {
      try {
        const response = await axios.post(`${API_BASE_URL}/photos/${photoId}/comments`, {
          text,
          userId: this.currentUser
        })
        
        const photoIndex = this.photos.findIndex(p => p.id === photoId)
        if (photoIndex !== -1) {
          this.photos[photoIndex].commentsCount++
        }
        
        return response.data
      } catch (error) {
        this.error = 'Failed to add comment'
        console.error('Error adding comment:', error)
        throw error
      }
    },

    async fetchComments(photoId) {
      try {
        const response = await axios.get(`${API_BASE_URL}/photos/${photoId}/comments`)
        return response.data
      } catch (error) {
        console.error('Error fetching comments:', error)
        return []
      }
    }
  }
})
