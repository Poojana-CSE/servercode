// import express
const express = require('express');

// import mongoose
const mongoose = require('mongoose');

// import cors --> Accept the response from frontend
const cors = require('cors');

// import bcrypt for password hashing
const bcrypt = require('bcrypt'); 

// Mongo DB URL
const url = "mongodb://localhost:27017/";

// Database Name
const db = 'MyBlog';

// Call Express
const App = express();

// Call Cors
App.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Use JSON
App.use(express.json());

// DataBase Connection
mongoose.connect(url)
.then(()=>{
    console.log("Mongo DB Connected");
    console.log("Database Created...");
})
.catch((err)=>{
    console.log("Connection Failed...");
    console.log(err);
});

// Create Schema
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, required: true },
    externalLink: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
});

// Create Blog Model
const Blog = mongoose.model('Blog', BlogSchema);

// Add User Route
App.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'UserName Already Exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(200).json({ message: 'Registration Successful' });
    } catch {
        console.log("Registration Failed...");
    }
});

// Login Check User Route
App.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'User Not Found!' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid Password' });
        }
        res.status(200).json({ message: 'Login Successful', username: user.username });
    } catch (err) {
        res.status(500).json({ message: 'Login Failed!' });
        console.log(err);
    }
});

// Add Blog Route
App.post('/blogs/create', async (req, res) => {
    const { title, content, author, category, externalLink } = req.body;
    if (!title || !content || !author || !category) {
        return res.status(400).json({ message: 'Please fill all the required fields' });
    }

    try {
        const newBlog = new Blog({
            title,
            content,
            author,  // Directly use the author (username) from the request body
            category,
            externalLink,
        });

        // Save the blog post to the database
        await newBlog.save();
        res.status(200).json({ message: 'Blog created successfully', blog: newBlog });
    } catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).json({ message: 'Error creating blog, please try again' });
    }
});

// Get all blogs
App.get('/blogs/', async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.status(200).json({ blogs });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ message: 'Error fetching blogs' });
    }
});

//myblogs fetch
App.get('/myblogs/:author', async (req, res) => {
    const { author } = req.params;

    try {
        const blogs = await Blog.find({ author });

        if (blogs.length === 0) {
            return res.status(404).json({ message: "No blogs found for this author." });
        }

        res.status(200).json({ blogs });
    } catch (error) {
        console.error('Error fetching author blogs:', error);
        res.status(500).json({ message: 'Error fetching blogs' });
    }
});


// Delete
// Delete Blog with username confirmation
// Delete Blog Route
const deleteBlog = async (id, author) => {
    const username = prompt("Enter the username to delete:");
  
    if (username === author) {
      try {
        const response = await fetch(`http://localhost:8000/myblogs/delete/${id}`, { method: 'DELETE' });
        if (response.ok) {
          const result = await response.json();
          alert(result.message);
          setBlogs(blogs.filter(blog => blog._id !== id));
        } else {
          console.log('Failed to delete blog');
        }
      } catch (error) {
        console.error('Error deleting blog:', error);
      }
    } else {
      alert('Username does not match. Blog not deleted.');
    }
  };
  

  

// Update
// Update Blog Route
App.put('/myblogs/update/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content, category, externalLink } = req.body;

    try {
        const updatedBlog = await Blog.findByIdAndUpdate(
            id,
            { title, content, category, externalLink },
            { new: true } // Return the updated document
        );

        if (!updatedBlog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.status(200).json({ message: "Blog updated successfully", blog: updatedBlog });
    } catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).json({ message: 'Error updating blog' });
    }
});


// Port Register
App.listen(8000, () => {
    console.log("Server Started, http://localhost:8000");
});
