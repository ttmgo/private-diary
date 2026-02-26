import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

// 情绪标签类型
interface Mood {
  emoji: string
  label: string
  color: string
}

// 日记条目类型
interface DiaryEntry {
  id: string
  content: string
  mood: string
  images: string[]
  date: string
  createdAt: number
}

// 预设情绪标签
const MOODS: Mood[] = [
  { emoji: '😊', label: '开心', color: '#FFD700' },
  { emoji: '😢', label: '难过', color: '#87CEEB' },
  { emoji: '😠', label: '生气', color: '#FF6B6B' },
  { emoji: '😰', label: '焦虑', color: '#DDA0DD' },
  { emoji: '😴', label: '疲惫', color: '#C0C0C0' },
  { emoji: '🤔', label: '思考', color: '#98FB98' },
  { emoji: '🥰', label: '幸福', color: '#FFB6C1' },
  { emoji: '😎', label: '惬意', color: '#FFA07A' },
]

function App() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [content, setContent] = useState('')
  const [selectedMood, setSelectedMood] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const [showOnThisDay, setShowOnThisDay] = useState(false)
  const [loading, setLoading] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 从 localStorage 加载日记
  useEffect(() => {
    const saved = localStorage.getItem('private-diary-entries')
    if (saved) {
      try {
        setEntries(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load entries:', e)
      }
    } else {
      // 添加一些示例数据
      const sampleEntries = generateSampleEntries()
      setEntries(sampleEntries)
      localStorage.setItem('private-diary-entries', JSON.stringify(sampleEntries))
    }
  }, [])

  // 保存到 localStorage
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('private-diary-entries', JSON.stringify(entries))
    }
  }, [entries])

  // 生成示例数据
  function generateSampleEntries(): DiaryEntry[] {
    const sample: DiaryEntry[] = []
    const now = new Date()
    
    for (let i = 0; i < 50; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      const moods = MOODS.map(m => m.emoji)
      const contents = [
        '今天天气真好，出门散步心情愉悦！',
        '工作压力好大，需要调整一下心态。',
        '和朋友们聚会很开心，聊了很多有趣的话题。',
        '学习新技术的过程很有成就感！',
        '今天遇到了一个小挫折，但相信明天会更好。',
        '读了一本很有启发的书，推荐给大家。',
        '给自己放个小假，享受一下悠闲的时光。',
        '完成了今天的目标，给自己点个赞！',
      ]
      
      sample.push({
        id: `entry-${i}`,
        content: contents[i % contents.length],
        mood: moods[i % moods.length],
        images: i % 5 === 0 ? [`https://picsum.photos/seed/${i}/400/300`] : [],
        date: date.toISOString().split('T')[0],
        createdAt: date.getTime()
      })
    }
    
    return sample
  }

  // 过滤特定日期的日记
  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date)
    const selected = new Date(selectedDate)
    return entryDate.toDateString() === selected.toDateString()
  })

  // 获取去年今日的日记
  const onThisDayEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date)
    const now = new Date()
    const lastYear = new Date(now)
    lastYear.setFullYear(lastYear.getFullYear() - 1)
    
    return entryDate.toDateString() === lastYear.toDateString()
  })

  // 无限滚动加载更多
  const loadMore = useCallback(() => {
    if (loading) return
    setLoading(true)
    
    setTimeout(() => {
      setLoading(false)
    }, 500)
  }, [loading])

  // 滚动检测
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000 &&
        !loading
      ) {
        loadMore()
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore, loading])

  // 发布新日记
  const handlePublish = () => {
    if (!content.trim()) return
    
    const newEntry: DiaryEntry = {
      id: `entry-${Date.now()}`,
      content: content.trim(),
      mood: selectedMood,
      images,
      date: selectedDate.toISOString().split('T')[0],
      createdAt: Date.now()
    }
    
    setEntries(prev => [newEntry, ...prev])
    setContent('')
    setSelectedMood('')
    setImages([])
  }

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result as string
        setImages(prev => [...prev, result])
      }
      reader.readAsDataURL(file)
    })
  }

  // 删除图片
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // 格式化日期
  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return '今天'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天'
    }
    
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // 获取星期几
  const getWeekday = (date: Date) => {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()]
  }

  // 生成日历月份
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null)
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  // 检查日期是否有日记
  const hasEntryOnDate = (date: Date) => {
    return entries.some(entry => 
      new Date(entry.date).toDateString() === date.toDateString()
    )
  }

  // 选择日历日期
  const handleDateSelect = (date: Date | null) => {
    if (date) {
      setSelectedDate(date)
      setShowCalendar(false)
    }
  }

  // 跳转到今天
  const goToToday = () => {
    setSelectedDate(new Date())
    setShowCalendar(false)
  }

  // 跳转到去年今日
  const goToLastYear = () => {
    const lastYear = new Date()
    lastYear.setFullYear(lastYear.getFullYear() - 1)
    setSelectedDate(lastYear)
    setShowCalendar(false)
  }

  // 按日期分组的日记
  const groupedEntries = [...filteredEntries].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="app">
      {/* 侧边栏 */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">📔 私人日记</h1>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${!showOnThisDay ? 'active' : ''}`}
            onClick={() => { setShowOnThisDay(false); setSelectedDate(new Date()) }}
          >
            <span className="nav-icon">🏠</span>
            <span>首页</span>
          </button>
          
          <button 
            className={`nav-item ${showOnThisDay ? 'active' : ''}`}
            onClick={() => setShowOnThisDay(!showOnThisDay)}
          >
            <span className="nav-icon">📅</span>
            <span>去年今日</span>
          </button>
          
          <button 
            className="nav-item"
            onClick={() => setShowCalendar(true)}
          >
            <span className="nav-icon">🗓️</span>
            <span>日历</span>
          </button>
        </nav>

        {/* 日期选择器 */}
        <div className="date-selector">
          <div className="current-date" onClick={() => setShowCalendar(!showCalendar)}>
            <span className="date-label">{formatDate(selectedDate)}</span>
            <span className="weekday">{getWeekday(selectedDate)}</span>
            <span className="calendar-icon">{showCalendar ? '▲' : '▼'}</span>
          </div>
          
          {showCalendar && (
            <div className="calendar-dropdown">
              <div className="calendar-header">
                <button onClick={() => {
                  const newDate = new Date(selectedDate)
                  newDate.setMonth(newDate.getMonth() - 1)
                  setSelectedDate(newDate)
                }}>◀</button>
                <span>{selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月</span>
                <button onClick={() => {
                  const newDate = new Date(selectedDate)
                  newDate.setMonth(newDate.getMonth() + 1)
                  setSelectedDate(newDate)
                }}>▶</button>
              </div>
              
              <div className="calendar-weekdays">
                {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                  <span key={day}>{day}</span>
                ))}
              </div>
              
              <div className="calendar-days">
                {generateCalendarDays().map((date, index) => (
                  <button
                    key={index}
                    className={`calendar-day ${
                      date ? 'valid' : 'empty'
                    } ${
                      date && date.toDateString() === selectedDate.toDateString() ? 'selected' : ''
                    } ${
                      date && hasEntryOnDate(date) ? 'has-entry' : ''
                    }`}
                    onClick={() => handleDateSelect(date)}
                    disabled={!date}
                  >
                    {date?.getDate()}
                  </button>
                ))}
              </div>
              
              <div className="calendar-actions">
                <button onClick={goToToday}>今天</button>
                <button onClick={goToLastYear}>去年今日</button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="main-content">
        {/* 发布框 */}
        <div className="composer">
          <textarea
            className="composer-input"
            placeholder="今天发生了什么？记录下来吧..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          
          {/* 已选图片预览 */}
          {images.length > 0 && (
            <div className="image-preview">
              {images.map((img, index) => (
                <div key={index} className="preview-item">
                  <img src={img} alt="" />
                  <button 
                    className="remove-image"
                    onClick={() => removeImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* 情绪标签选择 */}
          <div className="mood-selector">
            <span className="mood-label">今天心情：</span>
            <div className="mood-options">
              {MOODS.map(mood => (
                <button
                  key={mood.emoji}
                  className={`mood-btn ${selectedMood === mood.emoji ? 'selected' : ''}`}
                  onClick={() => setSelectedMood(mood.emoji)}
                  title={mood.label}
                  style={{
                    backgroundColor: selectedMood === mood.emoji ? mood.color + '40' : 'transparent',
                    borderColor: mood.color
                  }}
                >
                  {mood.emoji}
                </button>
              ))}
            </div>
          </div>
          
          {/* 工具栏 */}
          <div className="composer-toolbar">
            <div className="toolbar-left">
              <button 
                className="toolbar-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                🖼️ 图片
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
            
            <button 
              className="publish-btn"
              onClick={handlePublish}
              disabled={!content.trim()}
            >
              发布
            </button>
          </div>
        </div>

        {/* 日记列表 */}
        <div className="feed" ref={feedRef}>
          {showOnThisDay ? (
            <div className="on-this-day-section">
              <h2 className="section-title">
                📅 去年今日 
                <span className="date-badge">
                  {new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                </span>
              </h2>
              
              {onThisDayEntries.length > 0 ? (
                onThisDayEntries.map(entry => (
                  <DiaryCard key={entry.id} entry={entry} />
                ))
              ) : (
                <div className="empty-state">
                  <p>去年的今天还没有日记</p>
                  <p className="empty-hint">从今天开始记录，以后就能回顾啦！</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="feed-header">
                <h2 className="section-title">
                  {formatDate(selectedDate)} 的日记
                  <span className="entry-count">{groupedEntries.length} 篇</span>
                </h2>
              </div>
              
              {groupedEntries.length > 0 ? (
                groupedEntries.map(entry => (
                  <DiaryCard key={entry.id} entry={entry} />
                ))
              ) : (
                <div className="empty-state">
                  <p>这一天还没有日记</p>
                  <p className="empty-hint">点击上方发布框，记录今天的想法吧！</p>
                </div>
              )}
              
              {loading && <div className="loading">加载中...</div>}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

// 日记卡片组件
function DiaryCard({ entry }: { entry: DiaryEntry }) {
  const mood = MOODS.find(m => m.emoji === entry.mood)
  
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <article className="diary-card">
      <div className="card-header">
        <div className="mood-badge" style={{ backgroundColor: mood?.color + '30' }}>
          <span className="mood-emoji">{entry.mood || '📝'}</span>
          {mood && <span className="mood-text">{mood.label}</span>}
        </div>
        <time className="card-time">{formatTime(entry.createdAt)}</time>
      </div>
      
      <div className="card-content">
        <p>{entry.content}</p>
      </div>
      
      {entry.images.length > 0 && (
        <div className="card-images">
          {entry.images.map((img, index) => (
            <img 
              key={index} 
              src={img} 
              alt="" 
              className="card-image"
              loading="lazy"
            />
          ))}
        </div>
      )}
    </article>
  )
}

export default App
