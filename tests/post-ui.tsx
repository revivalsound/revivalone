// Local-only interaction fixture; not an application entry point or production route.
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../src/lib/AuthContext'
import CreatePost from '../src/pages/app/CreatePost'
import PostPage from '../src/pages/app/PostPage'
import PostCard from '../src/components/posts/PostCard'
import { fixturePost } from './post-ui-client'
import '../src/index.css'

createRoot(document.getElementById('root')!).render(<AuthProvider><BrowserRouter><div className="p-4"><nav className="flex gap-4"><Link to="/tests/post-ui.html">Editor</Link><Link to="/tests/cards">Cards</Link></nav><Routes><Route path="/post/:id" element={<PostPage />} /><Route path="/tests/cards" element={<div className="mx-auto mt-6 grid max-w-5xl gap-5 sm:grid-cols-2"><PostCard post={fixturePost} /><PostCard post={{ ...fixturePost, id: '00000000-0000-4000-8000-000000000002', title: 'A compact card' }} compact /></div>} /><Route path="*" element={<CreatePost />} /></Routes></div></BrowserRouter></AuthProvider>)
