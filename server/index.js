import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { User, Post, Connection, Notification } from './models.js'

const app = express()
app.use(cors({ origin: process.env.CLIENT_URL || true }))
app.use(express.json({ limit: '2mb' }))
const secret = process.env.JWT_SECRET || 'cinema-secret-change-me'
const tokenFor = user => jwt.sign({ id: user._id }, secret, { expiresIn: '7d' })
const safe = user => { const json = user.toObject ? user.toObject() : user; delete json.passwordHash; return json }
const auth = async (req, res, next) => { try { const token = req.headers.authorization?.replace('Bearer ', ''); if (!token) throw Error(); req.user = await User.findById(jwt.verify(token, secret).id); if (!req.user) throw Error(); next() } catch { res.status(401).json({ message: 'Please sign in again' }) } }
const notify = async (recipientId, actorId, type, text, entityId) => Notification.create({ recipientId, actorId, type, text, entityId })

app.get('/api/health', (_, res) => res.json({ ok: true, service: 'Indian Cinema API' }))
app.post('/api/auth/signup', async (req, res) => { try { const { name, email, password, role, region } = req.body; if (!name || !email || !password || !role || !region) return res.status(400).json({ message: 'Please complete every field' }); const user = await User.create({ name, email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12), role, region, badges: ['profile-complete'] }); res.status(201).json({ token: tokenFor(user), user: safe(user) }) } catch (e) { res.status(400).json({ message: e.code === 11000 ? 'Email already registered' : e.message }) } })
app.post('/api/auth/login', async (req, res) => { const user = await User.findOne({ email: req.body.email?.toLowerCase() }); if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash || ''))) return res.status(401).json({ message: 'Email or password is incorrect' }); res.json({ token: tokenFor(user), user: safe(user) }) })
app.get('/api/me', auth, (req, res) => res.json(safe(req.user)))
app.put('/api/me', auth, async (req, res) => { const allowed = ['name', 'role', 'region', 'bio', 'photo', 'credits']; const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key))); const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true }); res.json(safe(user)) })
app.get('/api/posts', async (req, res) => { const filter = {}; if (req.query.region) filter.region = req.query.region; if (req.query.role) filter.role = req.query.role; const posts = await Post.find(filter).populate('userId', 'name role region photo').populate('comments.userId', 'name').sort('-createdAt').limit(50); res.json(posts) })
app.post('/api/posts', auth, async (req, res) => { if (!req.body.content?.trim()) return res.status(400).json({ message: 'Post content is required' }); const post = await Post.create({ userId: req.user._id, content: req.body.content.trim(), image: req.body.image, region: req.user.region, role: req.user.role }); res.status(201).json(await post.populate('userId', 'name role region photo')) })
app.post('/api/posts/:id/like', auth, async (req, res) => { const post = await Post.findById(req.params.id); if (!post) return res.sendStatus(404); const index = post.likes.findIndex(id => id.equals(req.user._id)); if (index >= 0) post.likes.splice(index, 1); else { post.likes.push(req.user._id); if (!post.userId.equals(req.user._id)) await notify(post.userId, req.user._id, 'like', `${req.user.name} appreciated your story`, post._id) } await post.save(); res.json({ likes: post.likes.length, liked: index < 0 }) })
app.post('/api/posts/:id/comments', auth, async (req, res) => { if (!req.body.text?.trim()) return res.status(400).json({ message: 'Comment is required' }); const post = await Post.findByIdAndUpdate(req.params.id, { $push: { comments: { userId: req.user._id, text: req.body.text.trim() } } }, { new: true }).populate('comments.userId', 'name'); if (post && !post.userId.equals(req.user._id)) await notify(post.userId, req.user._id, 'comment', `${req.user.name} commented on your story`, post._id); res.json(post) })
app.get('/api/users', async (req, res) => { const q = req.query.q?.trim(); const filter = q ? { $or: [{ name: new RegExp(q, 'i') }, { role: new RegExp(q, 'i') }, { region: new RegExp(q, 'i') }] } : {}; res.json(await User.find(filter).select('-passwordHash').limit(30)) })
app.post('/api/connections/:userId', auth, async (req, res) => { if (String(req.user._id) === req.params.userId) return res.status(400).json({ message: 'You cannot connect with yourself' }); const connection = await Connection.findOneAndUpdate({ requesterId: req.user._id, receiverId: req.params.userId }, { $set: { status: 'pending' } }, { upsert: true, new: true }); await notify(req.params.userId, req.user._id, 'connection', `${req.user.name} wants to join your creative circle`, connection._id); res.status(201).json(connection) })
app.get('/api/connections', auth, async (req, res) => res.json(await Connection.find({ $or: [{ requesterId: req.user._id }, { receiverId: req.user._id }] }).populate('requesterId receiverId', 'name role region photo').sort('-createdAt')))
app.patch('/api/connections/:id', auth, async (req, res) => { if (!['accepted', 'rejected'].includes(req.body.status)) return res.sendStatus(400); const connection = await Connection.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }); if (connection?.requesterId) await notify(connection.requesterId, req.user._id, 'connection', `${req.user.name} ${req.body.status} your invitation`, connection._id); res.json(connection) })
app.get('/api/notifications', auth, async (req, res) => res.json(await Notification.find({ recipientId: req.user._id }).populate('actorId', 'name role photo').sort('-createdAt').limit(30)))

const port = process.env.PORT || 4000
if (process.env.MONGODB_URI) mongoose.connect(process.env.MONGODB_URI).then(() => console.log('MongoDB connected')).catch(e => console.error('MongoDB unavailable:', e.message))
app.listen(port, () => console.log(`Indian Cinema API listening on ${port}`))
