<template>
  <div id="app">
    <header class="header">
      <nav class="nav">
        <router-link to="/" class="nav-link">
          <h1 class="title">📸 カップル写真</h1>
        </router-link>
        <router-link to="/upload" class="nav-link upload-btn">
          アップロード
        </router-link>
      </nav>
    </header>
    
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.nav {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-link {
  color: white;
  text-decoration: none;
  transition: opacity 0.3s;
}

.nav-link:hover {
  opacity: 0.8;
}

.title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.upload-btn {
  background: rgba(255,255,255,0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: calc(100vh - 100px);
}

@media (max-width: 768px) {
  .title {
    font-size: 1.2rem;
  }
  
  .upload-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
  
  .main {
    padding: 1rem;
  }
}
</style>
