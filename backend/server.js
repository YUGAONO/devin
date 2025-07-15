const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { format, parseISO, isWithinInterval, subYears, startOfMonth, endOfMonth } = require('date-fns');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

let photos = [];
let comments = [];
let likes = [];

app.post('/api/photos', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    const photo = {
      id: uuidv4(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.body.uploadedBy || 'User',
      likesCount: 0,
      commentsCount: 0
    };

    photos.push(photo);
    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

app.get('/api/photos', (req, res) => {
  try {
    const { year, month, yearsAgo } = req.query;
    let filteredPhotos = [...photos];

    if (year || month || yearsAgo) {
      filteredPhotos = photos.filter(photo => {
        const photoDate = parseISO(photo.uploadedAt);
        
        if (yearsAgo && month) {
          const targetDate = subYears(new Date(), parseInt(yearsAgo));
          const targetMonth = parseInt(month) - 1;
          const startDate = startOfMonth(new Date(targetDate.getFullYear(), targetMonth));
          const endDate = endOfMonth(new Date(targetDate.getFullYear(), targetMonth));
          return isWithinInterval(photoDate, { start: startDate, end: endDate });
        }
        
        if (year) {
          return photoDate.getFullYear() === parseInt(year);
        }
        
        if (month) {
          return photoDate.getMonth() === parseInt(month) - 1;
        }
        
        return true;
      });
    }

    const photosWithCounts = filteredPhotos.map(photo => ({
      ...photo,
      likesCount: likes.filter(like => like.photoId === photo.id).length,
      commentsCount: comments.filter(comment => comment.photoId === photo.id).length
    }));

    res.json(photosWithCounts.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

app.post('/api/photos/:photoId/like', (req, res) => {
  try {
    const { photoId } = req.params;
    const { userId } = req.body;

    const existingLike = likes.find(like => like.photoId === photoId && like.userId === userId);
    
    if (existingLike) {
      likes = likes.filter(like => !(like.photoId === photoId && like.userId === userId));
      res.json({ liked: false, message: 'Like removed' });
    } else {
      const like = {
        id: uuidv4(),
        photoId,
        userId: userId || 'User',
        createdAt: new Date().toISOString()
      };
      likes.push(like);
      res.json({ liked: true, message: 'Photo liked' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

app.get('/api/photos/:photoId/likes', (req, res) => {
  try {
    const { photoId } = req.params;
    const photoLikes = likes.filter(like => like.photoId === photoId);
    res.json(photoLikes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

app.post('/api/photos/:photoId/comments', (req, res) => {
  try {
    const { photoId } = req.params;
    const { text, userId } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const comment = {
      id: uuidv4(),
      photoId,
      text: text.trim(),
      userId: userId || 'User',
      createdAt: new Date().toISOString()
    };

    comments.push(comment);
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

app.get('/api/photos/:photoId/comments', (req, res) => {
  try {
    const { photoId } = req.params;
    const photoComments = comments
      .filter(comment => comment.photoId === photoId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json(photoComments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Couple Photo Sharing API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
