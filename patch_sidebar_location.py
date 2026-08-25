import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Make sure useLocation is imported
if "useLocation" not in content:
    content = content.replace("import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';", "import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';")

# Update Sidebar to use location
content = content.replace("function Sidebar() {", "function Sidebar() {\n  const location = useLocation();")
content = content.replace("const path = window.location.pathname;", "const path = location.pathname;")

with open('src/App.tsx', 'w') as f:
    f.write(content)
