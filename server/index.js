import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { User, Post, Connection } from './models.js'

const app = express(); app.use(cors()); app.use(express.json())
const secret = process.env.JWT_SECRET || 'cinema-secret'
const tokenFor = user => jwt.sign({ id: user._id }, secret, { expiresIn: '7d' })
const auth = async (req, res, next) => { try { const token = req.headers.authorization?.split(' ')[1]; if (!token) return res.status(401).json({ message: 'Please sign in' }); req.user = await User.findById(jwt.verify(token, secret).id); next() } catch { res.status(401).json({ message: 'Invalid session' }) } }

app.get('/api/health', (_, res) => res.json({ ok: true, service: 'Indian Cinema API' }))
app.post('/api/auth/signup', async (req, res) => { try { const { name, email, password, role, region } = req.body; const passwordHash = await bcrypt.hash(password, 10); const user = await User.create({ name, email, passwordHash, role, region, badges: ['profile-complete'] }); res.status(201).json({ token: tokenFor(user), user: user.toJSON() }) } catch (e) { res.status(400).json({ message: e.code === 11000 ? 'Email already registered' : e.message }) } })
app.post('/api/auth/login', async (req, res) => { const user = await User.findOne({ email: req.body.email }); if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect' }); res.json({ token: tokenFor(user), user: user.toJSON() }) })
app.get('/api/me', auth, (req, res) => res.json(req.user))
app.put('/api/me', auth, async (req, res) => { const user = await User.findByIdAndUpdate(req.user._id, { $set: req.body }, { new: true }); res.json(user) })
app.get('/api/posts', async (req, res) => { const filter = {}; if (req.query.region) filter.region = req.query.region; const posts = await Post.find().populate('userId', 'name role region photo').sort('-createdAt').limit(50); res.json(posts) })
app.post('/api/posts', auth, async (req, res) => { const post = await Post.create({ userId: req.user._id, content: req.body.content, image: req.body.image }); res.status(201).json(await post.populate('userId', 'name role region photo')) })
app.post('/api/posts/:id/like', auth, async (req, res) => { const post = await Post.findById(req.params.id); const i = post.likes.findIndex(id => id.equals(req.user._id)); i >= 0 ? post.likes.splice(i, 1) : post.likes.push(req.user._id); await post.save(); res.json({ likes: post.likes.length }) })
app.post('/api/posts/:id/comments', auth, async (req, res) => { const post = await Post.findByIdAndUpdate(req.params.id, { $push: { comments: { userId: req.user._id, text: req.body.text } } }, { new: true }); res.json(post) })
app.get('/api/users', async (req, res) => { const q = req.query.q || ''; const filter = q ? { $or: [{ name: new RegExp(q, 'i') }, { role: new RegExp(q, 'i') }, { region: new RegExp(q, 'i') }] } : {}; res.json(await User.find(filter).select('-passwordHash').limit(30)) })
app.post('/api/connections/:userId', auth, async (req, res) => { const connection = await Connection.findOneAndUpdate({ requesterId: req.user._id, receiverId: req.params.userId }, { status: 'pending' }, { upsert: true, new: true }); res.status(201).json(connection) })
app.patch('/api/connections/:id', auth, async (req, res) => { res.json(await Connection.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })) })
app.get('/api/connections', auth, async (req, res) => res.json(await Connection.find({ $or: [{ requesterId: req.user._id }, { receiverId: req.user._id }] }).populate('requesterId receiverId', 'name role region photo')))

const port = process.env.PORT || 4000
if (process.env.MONGODB_URI) mongoose.connect(process.env.MONGODB_URI).then(() => console.log('MongoDB connected')).catch(e => console.error('MongoDB unavailable:', e.message))
app.listen(port, () => console.log(`Indian Cinema API listening on ${port}`))
