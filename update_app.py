import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Update Sidebar items
old_sidebar_items = """  const navItems = [
    { to: '/', icon: HomeIcon, label: 'Home' },
    { to: '/practice', icon: Play, label: 'Practice' },
    { to: '/words', icon: BookOpen, label: 'Words' },
    { to: '/import', icon: Import, label: 'Import' },
    { to: '/history', icon: HistoryIcon, label: 'History' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];"""
new_sidebar_items = """  const navItems = [
    { to: '/', icon: HomeIcon, label: 'Home' },
    { to: '/practice', icon: Play, label: 'Practice' },
    { to: '/words', icon: BookOpen, label: 'Words' },
    { to: '/history', icon: HistoryIcon, label: 'History' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];"""
content = content.replace(old_sidebar_items, new_sidebar_items)
content = content.replace("import { Home as HomeIcon, Play, BookOpen, Import, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';", "import { Home as HomeIcon, Play, BookOpen, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';")

# Update routing
content = content.replace('<Route path="/import" element={<ImportPage />} />', '<Route path="/words/import" element={<ImportPage />} />')

# Optionally add a redirect for backwards compatibility
content = content.replace("import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';", "import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';")
content = content.replace('<Route path="/words/import" element={<ImportPage />} />', '<Route path="/words/import" element={<ImportPage />} />\n            <Route path="/import" element={<Navigate to="/words/import" replace />} />')

with open('src/App.tsx', 'w') as f:
    f.write(content)
